from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models.database import Prediction
from backend.models.schemas import SelfAuditSummary, CalibrationBucket, PredictionOut

def get_self_audit_metrics(db: Session) -> SelfAuditSummary:
    """
    Evaluates all historical predictions against real-world recorded outcomes.
    Calculates calibration accuracy, Brier score, and false-positive/negative rates.
    """
    all_predictions = db.query(Prediction).order_by(Prediction.created_at.desc()).all()
    total_preds = len(all_predictions)

    verified = [p for p in all_predictions if p.actual_outcome_match is not None]
    verified_count = len(verified)

    if verified_count == 0:
        return SelfAuditSummary(
            total_predictions=total_preds,
            verified_predictions=0,
            correct_predictions=0,
            incorrect_predictions=0,
            overall_accuracy_rate=0.0,
            brier_score=0.0,
            calibration_buckets=[],
            false_positives=0,
            false_negatives=0,
            recent_audits=[]
        )

    correct_count = sum(1 for p in verified if p.actual_outcome_match is True)
    incorrect_count = verified_count - correct_count
    accuracy_rate = round((correct_count / verified_count) * 100.0, 1)

    # False Positives vs False Negatives
    false_positives = sum(1 for p in verified if p.actual_outcome_match is False and p.score >= 50.0)
    false_negatives = sum(1 for p in verified if p.actual_outcome_match is False and p.score < 50.0)

    # Brier Score calculation: Mean squared difference between confidence/score and actual outcome (1 or 0)
    # Lower is better (0.0 = perfect calibration, 0.25 = uninformative)
    squared_errors = []
    for p in verified:
        outcome_val = 1.0 if (p.outcome in ["CONFIRMED_CHURN", "LOST"] or "CONFIRMED" in str(p.outcome)) else 0.0
        prob_val = p.confidence if p.confidence <= 1.0 else (p.score / 100.0)
        squared_errors.append((prob_val - outcome_val) ** 2)

    brier_score = round(sum(squared_errors) / len(squared_errors), 3) if squared_errors else 0.124

    # Calibration Buckets: compare predicted confidence band against empirical frequency
    bucket_definitions = [
        ("0 - 30%", 0.0, 0.30),
        ("30 - 50%", 0.30, 0.50),
        ("50 - 70%", 0.50, 0.70),
        ("70 - 90%", 0.70, 0.90),
        ("90 - 100%", 0.90, 1.01)
    ]

    calibration_buckets: List[CalibrationBucket] = []
    for label, low, high in bucket_definitions:
        bucket_preds = [p for p in verified if low <= (p.confidence if p.confidence <= 1.0 else p.score / 100.0) < high]
        b_count = len(bucket_preds)
        if b_count > 0:
            b_correct = sum(1 for p in bucket_preds if p.actual_outcome_match is True)
            rate = round((b_correct / b_count) * 100.0, 1)
        else:
            b_correct = 0
            rate = 0.0

        calibration_buckets.append(CalibrationBucket(
            bucket_range=label,
            predicted_count=b_count,
            actual_positive_count=b_correct,
            accuracy_rate=rate
        ))

    # Format recent audits
    recent_audits = [PredictionOut.model_validate(p) for p in verified[:20]]

    return SelfAuditSummary(
        total_predictions=total_preds,
        verified_predictions=verified_count,
        correct_predictions=correct_count,
        incorrect_predictions=incorrect_count,
        overall_accuracy_rate=accuracy_rate,
        brier_score=brier_score,
        calibration_buckets=calibration_buckets,
        false_positives=false_positives,
        false_negatives=false_negatives,
        recent_audits=recent_audits
    )

def record_prediction_outcome(
    db: Session,
    prediction_id: str,
    actual_outcome: str,
    verification_source: str = "CRM Telemetry / Billing Sync",
    notes: str = "",
    actor: str = "Human Operator"
) -> Prediction:
    """
    Records an empirical outcome against an AI prediction.
    Creates an Outcome record, sets outcome verification timestamps,
    computes correctness match, and emits an OUTCOME_VERIFIED audit event.
    """
    import datetime
    from backend.models.database import Outcome
    from backend.engine.agent_machine import record_audit_event

    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise ValueError(f"Prediction {prediction_id} not found")

    now = datetime.datetime.utcnow()

    # Determine whether the prediction was correct
    # If high risk (score >= 50) and actual outcome was churn/lost -> True match
    # If low risk (score < 50) and actual outcome was renewed/prevented -> True match
    # If high risk and actual outcome was renewed/prevented -> False (false positive or prevented)
    # If outcome is FALSE_POSITIVE -> False match
    if actual_outcome == "FALSE_POSITIVE":
        match = False
    elif actual_outcome in ["CONFIRMED_CHURN", "LOST"]:
        match = (prediction.score >= 50.0)
    elif actual_outcome in ["RENEWED", "PREVENTED"]:
        match = (prediction.score < 50.0)
    else:
        match = True

    prediction.outcome = actual_outcome
    prediction.outcome_verified_at = now
    prediction.actual_outcome_match = match
    if notes:
        prediction.audit_notes = notes

    # Create Outcome entity
    outcome_rec = Outcome(
        id=f"out-{int(now.timestamp() * 1000)}",
        prediction_id=prediction.id,
        actual_outcome=actual_outcome,
        verified_at=now,
        verification_source=verification_source,
        notes=notes
    )
    db.add(outcome_rec)

    # Emit Audit Event
    record_audit_event(
        db=db,
        account_id=prediction.account_id,
        entity_type="PREDICTION",
        entity_id=prediction.id,
        event_type="OUTCOME_VERIFIED",
        actor=actor,
        metadata={
            "actual_outcome": actual_outcome,
            "verification_source": verification_source,
            "prediction_score": prediction.score,
            "matched": match,
            "notes": notes
        }
    )

    db.commit()
    db.refresh(prediction)
    return prediction

