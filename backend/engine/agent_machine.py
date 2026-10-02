import datetime
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.models.database import (
    Account, Contact, Deal, Activity, Decision, DecisionContract, Prediction, Evidence, AuditEvent
)
from backend.engine.decision_debt import calculate_account_decision_debt
from backend.engine.risk_engine import calculate_account_risks

class AgentStateMachine:
    """
    Explicit finite state machine governing decision contracts and autonomous risk lifecycle:
    OBSERVE -> DETECT -> ANALYZE -> RECOMMEND -> HUMAN_APPROVAL -> CONTRACT_CREATED -> MONITOR -> OUTCOME -> AUDIT
    Missed Actions: MONITOR -> DEADLINE_MISSED -> RECALCULATE_DEBT -> ESCALATE -> AUDIT
    """
    VALID_TRANSITIONS = {
        "OBSERVE": ["DETECT"],
        "DETECT": ["ANALYZE", "OBSERVE"],
        "ANALYZE": ["RECOMMEND", "OBSERVE"],
        "RECOMMEND": ["HUMAN_APPROVAL"],
        "HUMAN_APPROVAL": ["CONTRACT_CREATED", "OBSERVE"],
        "CONTRACT_CREATED": ["MONITOR"],
        "MONITOR": ["DEADLINE_MISSED", "ACTION_COMPLETED", "CONTRACT_SNOOZED", "OUTCOME"],
        "DEADLINE_MISSED": ["RECALCULATE_DEBT"],
        "RECALCULATE_DEBT": ["ESCALATE"],
        "ESCALATE": ["OUTCOME", "ACTION_COMPLETED", "AUDIT"],
        "ACTION_COMPLETED": ["OUTCOME", "AUDIT"],
        "CONTRACT_SNOOZED": ["MONITOR"],
        "OUTCOME": ["AUDIT"],
        "AUDIT": ["OBSERVE"]
    }

    @classmethod
    def can_transition(cls, current_state: str, next_state: str) -> bool:
        return next_state in cls.VALID_TRANSITIONS.get(current_state, [])

def record_audit_event(
    db: Session,
    account_id: Optional[str],
    entity_type: str,
    entity_id: str,
    event_type: str,
    actor: str = "System Agent",
    metadata: Optional[Dict[str, Any]] = None,
    timestamp: Optional[datetime.datetime] = None
) -> AuditEvent:
    """
    Persists an immutable audit log entry for system traceability.
    """
    import uuid
    if timestamp is None:
        timestamp = datetime.datetime.utcnow()
    
    meta_str = json.dumps(metadata or {})
    event_id = f"aud-{int(timestamp.timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"
    
    audit_event = AuditEvent(
        id=event_id,
        account_id=account_id,
        entity_type=entity_type,
        entity_id=entity_id,
        event_type=event_type,
        timestamp=timestamp,
        actor=actor,
        metadata_json=meta_str
    )
    db.add(audit_event)
    return audit_event

def find_risky_accounts(db: Session, min_debt: int = 40, limit: int = 15) -> List[Account]:
    """Internal tool: Finds accounts with decision debt >= min_debt"""
    return db.query(Account).filter(Account.decision_debt_score >= min_debt).order_by(Account.decision_debt_score.desc()).limit(limit).all()

def get_account_evidence(db: Session, account_id: str) -> List[Evidence]:
    """Internal tool: Retrieves evidence ledger records for an account"""
    return db.query(Evidence).filter(Evidence.account_id == account_id).order_by(Evidence.weight.desc(), Evidence.timestamp.desc()).all()

def create_decision_contract_tool(
    db: Session,
    account_id: str,
    action: str,
    owner: str,
    deadline: datetime.datetime,
    escalation_rule: str,
    escalation_target: str = "Sales Director",
    decision_id: Optional[str] = None,
    expected_impact: str = "Reduce Churn & Unblock Pipeline",
    reason: str = "",
    actor: str = "Human Operator"
) -> DecisionContract:
    """
    Internal tool: Creates a binding decision contract and emits HUMAN_APPROVED & CONTRACT_CREATED audit events.
    """
    account = db.query(Account).filter(Account.id == account_id).first()
    contract_id = f"cnt-{int(datetime.datetime.utcnow().timestamp() * 1000)}"

    # If decision_id not provided, find the primary pending decision on this account
    if not decision_id and account and account.decisions:
        pending_decs = [d for d in account.decisions if d.status in ["PENDING", "OVERDUE"]]
        if pending_decs:
            decision_id = pending_decs[0].id

    contract = DecisionContract(
        id=contract_id,
        account_id=account_id,
        decision_id=decision_id,
        action=action,
        owner=owner,
        deadline=deadline,
        escalation_rule=escalation_rule,
        escalation_target=escalation_target,
        status="PENDING",
        expected_impact=expected_impact,
        reason=reason,
        created_at=datetime.datetime.utcnow()
    )
    db.add(contract)

    # 1. Audit Event: Human Approval
    record_audit_event(
        db=db,
        account_id=account_id,
        entity_type="CONTRACT",
        entity_id=contract_id,
        event_type="HUMAN_APPROVED",
        actor=actor,
        metadata={
            "action": action,
            "owner": owner,
            "deadline": deadline.isoformat(),
            "escalation_rule": escalation_rule
        }
    )

    # 2. Audit Event: Contract Created
    record_audit_event(
        db=db,
        account_id=account_id,
        entity_type="CONTRACT",
        entity_id=contract_id,
        event_type="CONTRACT_CREATED",
        actor="System Agent",
        metadata={
            "contract_id": contract_id,
            "decision_id": decision_id,
            "escalation_target": escalation_target
        }
    )

    # 3. Evidence Ledger
    ev = Evidence(
        id=f"ev-{int(datetime.datetime.utcnow().timestamp() * 1000)}",
        account_id=account_id,
        related_entity=f"CONTRACT:{contract_id}",
        evidence_type="CONTRACT_CREATED",
        source="Decision Contract Engine",
        description=f"Decision contract established: '{action}' assigned to {owner} (Due: {deadline.strftime('%Y-%m-%d')})",
        timestamp=datetime.datetime.utcnow(),
        weight=0.9
    )
    db.add(ev)
    db.commit()
    db.refresh(contract)
    return contract

def complete_decision_contract_tool(
    db: Session,
    contract_id: str,
    resolution_notes: str = "Completed successfully by account owner",
    actor: str = "Human Operator"
) -> DecisionContract:
    """
    Internal tool: Marks decision contract completed, resolves associated decisions/activities,
    recalculates decision debt, and logs ACTION_COMPLETED and DEBT_RECALCULATED audit events.
    """
    contract = db.query(DecisionContract).filter(DecisionContract.id == contract_id).first()
    if not contract:
        raise ValueError(f"Decision contract {contract_id} not found")

    now = datetime.datetime.utcnow()
    contract.status = "COMPLETED"
    contract.completed_at = now
    contract.outcome = resolution_notes

    # Resolve linked decision if present
    if contract.decision:
        contract.decision.status = "COMPLETED"
        contract.decision.completed_at = now

    account = contract.account
    old_debt = account.decision_debt_score if account else 0

    if account:
        # Resolve overdue activities tied to this action / owner
        for act in account.activities:
            if act.status in ["PENDING", "OVERDUE"] and contract.owner in act.assigned_to:
                act.status = "COMPLETED"
                act.completed_at = now

        # Recalculate account metrics
        debt = calculate_account_decision_debt(account)
        risks = calculate_account_risks(account)
        new_debt = max(0, debt.score - 20)
        account.decision_debt_score = new_debt
        account.risk_score = max(10, risks.overall_risk_score - 15)
        account.revenue_at_risk = round(account.account_value * (account.risk_score / 100.0), 2)
        if account.decision_debt_score < 40:
            account.health_status = "HEALTHY"

        # 1. Audit Event: Action Completed
        record_audit_event(
            db=db,
            account_id=account.id,
            entity_type="CONTRACT",
            entity_id=contract.id,
            event_type="ACTION_COMPLETED",
            actor=actor,
            metadata={
                "resolution_notes": resolution_notes,
                "completed_at": now.isoformat()
            }
        )

        # 2. Audit Event: Debt Recalculated
        record_audit_event(
            db=db,
            account_id=account.id,
            entity_type="ACCOUNT",
            entity_id=account.id,
            event_type="DEBT_RECALCULATED",
            actor="System Agent",
            metadata={
                "previous_score": old_debt,
                "new_score": new_debt,
                "delta": new_debt - old_debt,
                "reason": f"Contract '{contract.action}' completed"
            }
        )

        # Evidence Ledger Entry
        ev = Evidence(
            id=f"ev-comp-{int(now.timestamp() * 1000)}",
            account_id=account.id,
            related_entity=f"CONTRACT:{contract.id}",
            evidence_type="ACTION_COMPLETED",
            source="Decision Contract Execution",
            description=f"Action completed: '{contract.action}'. Decision debt decreased from {old_debt} to {new_debt}/100.",
            timestamp=now,
            weight=0.95
        )
        db.add(ev)

    db.commit()
    db.refresh(contract)
    return contract

def escalate_decision_contract_tool(
    db: Session,
    contract_id: str,
    escalation_reason: str = "Missed contract deadline trigger",
    actor: str = "System Agent"
) -> DecisionContract:
    """
    Internal tool: Escalates a contract, records DEADLINE_MISSED, CONTRACT_ESCALATED, and DEBT_RECALCULATED.
    """
    contract = db.query(DecisionContract).filter(DecisionContract.id == contract_id).first()
    if not contract:
        raise ValueError(f"Decision contract {contract_id} not found")

    now = datetime.datetime.utcnow()
    contract.status = "ESCALATED"
    contract.escalated_at = now
    contract.outcome = f"Escalated: {escalation_reason}. Target: {contract.escalation_target or 'Leadership'}. Rule: {contract.escalation_rule}"

    account = contract.account
    old_debt = account.decision_debt_score if account else 0

    if account:
        new_debt = min(100, old_debt + 10)
        account.decision_debt_score = new_debt
        account.health_status = "CRITICAL"

        # 1. Audit Event: Deadline Missed
        record_audit_event(
            db=db,
            account_id=account.id,
            entity_type="CONTRACT",
            entity_id=contract.id,
            event_type="DEADLINE_MISSED",
            actor="System Agent",
            metadata={
                "contract_id": contract.id,
                "deadline": contract.deadline.isoformat() if contract.deadline else None,
                "action": contract.action
            }
        )

        # 2. Audit Event: Contract Escalated
        record_audit_event(
            db=db,
            account_id=account.id,
            entity_type="CONTRACT",
            entity_id=contract.id,
            event_type="CONTRACT_ESCALATED",
            actor=actor,
            metadata={
                "escalation_rule": contract.escalation_rule,
                "escalation_target": contract.escalation_target or "Sales Leadership",
                "reason": escalation_reason
            }
        )

        # 3. Audit Event: Debt Recalculated
        record_audit_event(
            db=db,
            account_id=account.id,
            entity_type="ACCOUNT",
            entity_id=account.id,
            event_type="DEBT_RECALCULATED",
            actor="System Agent",
            metadata={
                "previous_score": old_debt,
                "new_score": new_debt,
                "delta": new_debt - old_debt,
                "reason": "Escalation penalty applied"
            }
        )

        ev = Evidence(
            id=f"ev-esc-{int(now.timestamp() * 1000)}",
            account_id=account.id,
            related_entity=f"CONTRACT:{contract.id}",
            evidence_type="ESCALATION_TRIGGERED",
            source="Automated Escalation Rule",
            description=f"Contract escalated to {contract.escalation_target or 'leadership'}: {contract.escalation_rule}. Decision debt elevated.",
            timestamp=now,
            weight=0.98
        )
        db.add(ev)

    db.commit()
    db.refresh(contract)
    return contract

def snooze_decision_contract_tool(
    db: Session,
    contract_id: str,
    days: int = 3,
    actor: str = "Human Operator"
) -> DecisionContract:
    """
    Internal tool: Snoozes a contract deadline, records CONTRACT_SNOOZED audit event.
    """
    contract = db.query(DecisionContract).filter(DecisionContract.id == contract_id).first()
    if not contract:
        raise ValueError(f"Decision contract {contract_id} not found")

    old_deadline = contract.deadline
    new_deadline = contract.deadline + datetime.timedelta(days=days)
    contract.deadline = new_deadline
    contract.status = "SNOOZED"
    contract.reason += f" [Snoozed by {days} days on {datetime.datetime.utcnow().strftime('%b %d')}]"

    # Audit Event: Contract Snoozed
    record_audit_event(
        db=db,
        account_id=contract.account_id,
        entity_type="CONTRACT",
        entity_id=contract.id,
        event_type="CONTRACT_SNOOZED",
        actor=actor,
        metadata={
            "previous_deadline": old_deadline.isoformat(),
            "new_deadline": new_deadline.isoformat(),
            "days_extended": days
        }
    )

    db.commit()
    db.refresh(contract)
    return contract

def run_agent_monitoring_cycle(db: Session) -> Dict[str, Any]:
    """
    Autonomous monitoring step:
    Checks all pending Decision Contracts against current time.
    If deadline is past and status is PENDING or DUE_SOON:
    triggers DEADLINE_MISSED -> ESCALATE -> RECALCULATE_DEBT.
    """
    now = datetime.datetime.utcnow()
    pending_contracts = db.query(DecisionContract).filter(
        DecisionContract.status.in_(["PENDING", "DUE_SOON"])
    ).all()

    escalated_count = 0
    due_soon_count = 0

    for c in pending_contracts:
        if c.deadline < now:
            # Overdue! Escalate contract automatically
            escalate_decision_contract_tool(db, c.id, escalation_reason="Automated deadline monitor trigger")
            escalated_count += 1
        elif (c.deadline - now).total_seconds() < 86400 * 2: # Within 48 hours
            c.status = "DUE_SOON"
            due_soon_count += 1

    db.commit()
    return {
        "checked_contracts": len(pending_contracts),
        "escalated_count": escalated_count,
        "due_soon_count": due_soon_count,
        "evaluated_at": now.isoformat()
    }
