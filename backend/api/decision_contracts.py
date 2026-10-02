from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from backend.models.database import get_db, DecisionContract, Account
from backend.models.schemas import DecisionContractOut, DecisionContractCreate, DecisionContractUpdate
from backend.engine.agent_machine import (
    create_decision_contract_tool, complete_decision_contract_tool,
    escalate_decision_contract_tool, snooze_decision_contract_tool
)

router = APIRouter(prefix="/api/decision-contracts", tags=["Decision Contracts"])

@router.get("", response_model=List[DecisionContractOut])
def get_contracts(
    status: Optional[str] = None,
    owner: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DecisionContract).order_by(DecisionContract.deadline.asc())
    if status and status != "ALL":
        query = query.filter(DecisionContract.status == status.upper())
    if owner and owner != "ALL":
        query = query.filter(DecisionContract.owner == owner)

    contracts = query.all()
    results = []
    for c in contracts:
        results.append(DecisionContractOut(
            id=c.id,
            account_id=c.account_id,
            company_name=c.account.company_name if c.account else "Account",
            action=c.action,
            owner=c.owner,
            deadline=c.deadline,
            escalation_rule=c.escalation_rule,
            escalation_target=c.escalation_target or "Sales Director",
            status=c.status,
            expected_impact=c.expected_impact,
            reason=c.reason,
            created_at=c.created_at,
            completed_at=c.completed_at,
            escalated_at=c.escalated_at,
            outcome=c.outcome
        ))
    return results

@router.post("", response_model=DecisionContractOut)
def create_contract(payload: DecisionContractCreate, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == payload.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    contract = create_decision_contract_tool(
        db=db,
        account_id=payload.account_id,
        action=payload.action,
        owner=payload.owner,
        deadline=payload.deadline,
        escalation_rule=payload.escalation_rule,
        escalation_target=payload.escalation_target or "Sales Director",
        decision_id=payload.decision_id,
        expected_impact=payload.expected_impact or "Mitigate Churn & Unblock Pipeline",
        reason=payload.reason or f"Initiated for {account.company_name}"
    )

    return DecisionContractOut(
        id=contract.id,
        account_id=contract.account_id,
        company_name=account.company_name,
        action=contract.action,
        owner=contract.owner,
        deadline=contract.deadline,
        escalation_rule=contract.escalation_rule,
        escalation_target=contract.escalation_target or "Sales Director",
        status=contract.status,
        expected_impact=contract.expected_impact,
        reason=contract.reason,
        created_at=contract.created_at,
        completed_at=contract.completed_at,
        escalated_at=contract.escalated_at,
        outcome=contract.outcome
    )

@router.post("/{contract_id}/complete", response_model=DecisionContractOut)
def complete_contract(
    contract_id: str,
    notes: Optional[Dict[str, str]] = Body(default={"notes": "Stakeholder outreach completed successfully"}),
    db: Session = Depends(get_db)
):
    resolution_notes = notes.get("notes", "Completed successfully by account owner") if notes else "Completed successfully"
    try:
        updated = complete_decision_contract_tool(db, contract_id, resolution_notes)
        return DecisionContractOut(
            id=updated.id,
            account_id=updated.account_id,
            company_name=updated.account.company_name if updated.account else "Account",
            action=updated.action,
            owner=updated.owner,
            deadline=updated.deadline,
            escalation_rule=updated.escalation_rule,
            escalation_target=updated.escalation_target or "Sales Director",
            status=updated.status,
            expected_impact=updated.expected_impact,
            reason=updated.reason,
            created_at=updated.created_at,
            completed_at=updated.completed_at,
            escalated_at=updated.escalated_at,
            outcome=updated.outcome
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{contract_id}/escalate", response_model=DecisionContractOut)
def escalate_contract(
    contract_id: str,
    payload: Optional[Dict[str, str]] = Body(default={"reason": "Missed contract deadline triggered escalation"}),
    db: Session = Depends(get_db)
):
    reason = payload.get("reason", "Missed contract deadline triggered escalation") if payload else "Missed contract deadline"
    try:
        updated = escalate_decision_contract_tool(db, contract_id, reason)
        return DecisionContractOut(
            id=updated.id,
            account_id=updated.account_id,
            company_name=updated.account.company_name if updated.account else "Account",
            action=updated.action,
            owner=updated.owner,
            deadline=updated.deadline,
            escalation_rule=updated.escalation_rule,
            escalation_target=updated.escalation_target or "Sales Director",
            status=updated.status,
            expected_impact=updated.expected_impact,
            reason=updated.reason,
            created_at=updated.created_at,
            completed_at=updated.completed_at,
            escalated_at=updated.escalated_at,
            outcome=updated.outcome
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{contract_id}/snooze", response_model=DecisionContractOut)
def snooze_contract(
    contract_id: str,
    payload: Optional[Dict[str, int]] = Body(default={"days": 3}),
    db: Session = Depends(get_db)
):
    days = payload.get("days", 3) if payload else 3
    try:
        updated = snooze_decision_contract_tool(db, contract_id, days)
        return DecisionContractOut(
            id=updated.id,
            account_id=updated.account_id,
            company_name=updated.account.company_name if updated.account else "Account",
            action=updated.action,
            owner=updated.owner,
            deadline=updated.deadline,
            escalation_rule=updated.escalation_rule,
            escalation_target=updated.escalation_target or "Sales Director",
            status=updated.status,
            expected_impact=updated.expected_impact,
            reason=updated.reason,
            created_at=updated.created_at,
            completed_at=updated.completed_at,
            escalated_at=updated.escalated_at,
            outcome=updated.outcome
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch("/{contract_id}", response_model=DecisionContractOut)
def patch_contract(
    contract_id: str,
    payload: DecisionContractUpdate,
    db: Session = Depends(get_db)
):
    contract = db.query(DecisionContract).filter(DecisionContract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Decision contract not found")

    if payload.owner:
        contract.owner = payload.owner
    if payload.action:
        contract.action = payload.action
    if payload.deadline:
        contract.deadline = payload.deadline
    if payload.escalation_rule:
        contract.escalation_rule = payload.escalation_rule
    if payload.escalation_target:
        contract.escalation_target = payload.escalation_target
    if payload.status:
        contract.status = payload.status
    if payload.expected_impact:
        contract.expected_impact = payload.expected_impact
    if payload.reason:
        contract.reason = payload.reason

    db.commit()
    db.refresh(contract)
    return DecisionContractOut(
        id=contract.id,
        account_id=contract.account_id,
        company_name=contract.account.company_name if contract.account else "Account",
        action=contract.action,
        owner=contract.owner,
        deadline=contract.deadline,
        escalation_rule=contract.escalation_rule,
        escalation_target=contract.escalation_target or "Sales Director",
        status=contract.status,
        expected_impact=contract.expected_impact,
        reason=contract.reason,
        created_at=contract.created_at,
        completed_at=contract.completed_at,
        escalated_at=contract.escalated_at,
        outcome=contract.outcome
    )
