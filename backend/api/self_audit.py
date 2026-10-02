from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.schemas import SelfAuditSummary, OutcomeCreate, PredictionOut
from backend.engine.self_audit import get_self_audit_metrics, record_prediction_outcome

router = APIRouter(prefix="/api/self-audit", tags=["Self-Audit"])

# Extra router for /api/predictions prefix
predictions_router = APIRouter(prefix="/api/predictions", tags=["Predictions"])

@router.get("", response_model=SelfAuditSummary)
def get_self_audit(db: Session = Depends(get_db)):
    return get_self_audit_metrics(db)

@router.post("/predictions/{prediction_id}/outcome", response_model=PredictionOut)
def record_outcome_audit(
    prediction_id: str,
    payload: OutcomeCreate,
    db: Session = Depends(get_db)
):
    try:
        updated = record_prediction_outcome(
            db=db,
            prediction_id=prediction_id,
            actual_outcome=payload.actual_outcome,
            verification_source=payload.verification_source or "CRM Telemetry / Billing Sync",
            notes=payload.notes or "",
            actor="Human Operator"
        )
        return PredictionOut.model_validate(updated)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@predictions_router.post("/{prediction_id}/outcome", response_model=PredictionOut)
def record_prediction_outcome_endpoint(
    prediction_id: str,
    payload: OutcomeCreate,
    db: Session = Depends(get_db)
):
    try:
        updated = record_prediction_outcome(
            db=db,
            prediction_id=prediction_id,
            actual_outcome=payload.actual_outcome,
            verification_source=payload.verification_source or "CRM Telemetry / Billing Sync",
            notes=payload.notes or "",
            actor="Human Operator"
        )
        return PredictionOut.model_validate(updated)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

