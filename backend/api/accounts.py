from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.models.database import (
    get_db, Account, Contact, Deal, Interaction, Activity, Decision, DecisionContract, Prediction, Evidence
)
from backend.models.schemas import (
    AccountOut, AccountDetailOut, ContactOut, DealOut, InteractionOut,
    ActivityOut, DecisionOut, DecisionContractOut, PredictionOut, EvidenceOut,
    AuditEventOut, GraphData
)
from backend.engine.decision_debt import calculate_account_decision_debt
from backend.engine.risk_engine import calculate_account_risks
from backend.engine.graph_engine import build_account_relationship_graph

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])

@router.get("", response_model=List[AccountOut])
def get_accounts(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = Query("decision_debt_score", pattern="^(decision_debt_score|risk_score|revenue_at_risk|account_value|company_name)$"),
    order: Optional[str] = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    query = db.query(Account)
    if search:
        query = query.filter(Account.company_name.ilike(f"%{search}%"))
    if status and status != "ALL":
        query = query.filter(Account.health_status == status.upper())

    # Sorting
    col = getattr(Account, sort_by)
    if order == "desc":
        query = query.order_by(col.desc())
    else:
        query = query.order_by(col.asc())

    accounts = query.all()
    results = []
    for a in accounts:
        results.append(AccountOut(
            id=a.id,
            company_name=a.company_name,
            industry=a.industry,
            account_value=a.account_value,
            account_owner=a.account_owner,
            health_status=a.health_status,
            created_at=a.created_at,
            decision_debt_score=a.decision_debt_score,
            risk_score=a.risk_score,
            revenue_at_risk=a.revenue_at_risk,
            deal_count=len(a.deals),
            contact_count=len(a.contacts),
            overdue_count=sum(1 for act in a.activities if act.status == "OVERDUE")
        ))
    return results

@router.get("/{account_id}", response_model=AccountDetailOut)
def get_account_detail(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    debt_breakdown = calculate_account_decision_debt(account)
    risk_analysis = calculate_account_risks(account)

    # Generate grounded AI reasoning
    stalled_deals = [d for d in account.deals if d.status == "STALLED" or d.days_in_stage >= 14]
    inactive_contacts = [c for c in account.contacts if c.status in ["INACTIVE", "AT_RISK"] or c.engagement_score < 45]
    
    stalled_str = f"a {stalled_deals[0].days_in_stage}-day stalled deal ('{stalled_deals[0].deal_name}')" if stalled_deals else "no stalled deals"
    contacts_str = f"{len(inactive_contacts)} of {len(account.contacts)} contacts inactive" if account.contacts else "no recorded contacts"

    ai_reasoning = (
        f"{account.company_name} is accumulating decision debt ({debt_breakdown.score}/100) because critical business actions have been deferred. "
        f"The primary contributors are {stalled_str}, {contacts_str}, and {len(debt_breakdown.contributors)} unresolved pipeline signals. "
        f"Without executive intervention within the next 72 hours, model calibration projects an elevated churn and deal-loss trajectory."
    )

    acc_out = AccountOut(
        id=account.id,
        company_name=account.company_name,
        industry=account.industry,
        account_value=account.account_value,
        account_owner=account.account_owner,
        health_status=account.health_status,
        created_at=account.created_at,
        decision_debt_score=debt_breakdown.score,
        risk_score=risk_analysis.overall_risk_score,
        revenue_at_risk=risk_analysis.revenue_at_risk,
        deal_count=len(account.deals),
        contact_count=len(account.contacts),
        overdue_count=sum(1 for act in account.activities if act.status == "OVERDUE")
    )

    contracts_out = [
        DecisionContractOut(
            id=c.id,
            account_id=c.account_id,
            company_name=account.company_name,
            action=c.action,
            owner=c.owner,
            deadline=c.deadline,
            escalation_rule=c.escalation_rule,
            status=c.status,
            expected_impact=c.expected_impact,
            reason=c.reason,
            created_at=c.created_at,
            completed_at=c.completed_at,
            escalated_at=c.escalated_at,
            outcome=c.outcome
        ) for c in account.contracts
    ]

    audit_events_out = [
        AuditEventOut(
            id=ae.id,
            account_id=ae.account_id,
            entity_type=ae.entity_type,
            entity_id=ae.entity_id,
            event_type=ae.event_type,
            timestamp=ae.timestamp,
            actor=ae.actor,
            metadata_json=ae.metadata_json or "{}"
        ) for ae in (account.audit_events or [])
    ]

    return AccountDetailOut(
        account=acc_out,
        contacts=[ContactOut.model_validate(c) for c in account.contacts],
        deals=[DealOut.model_validate(d) for d in account.deals],
        interactions=[InteractionOut.model_validate(i) for i in account.interactions],
        activities=[ActivityOut.model_validate(a) for a in account.activities],
        decisions=[DecisionOut.model_validate(dec) for dec in account.decisions],
        contracts=contracts_out,
        predictions=[PredictionOut.model_validate(p) for p in account.predictions],
        evidences=[EvidenceOut.model_validate(e) for e in account.evidences],
        audit_events=audit_events_out,
        decision_debt=debt_breakdown,
        risk_analysis=risk_analysis,
        ai_reasoning=ai_reasoning
    )

@router.get("/{account_id}/decision-debt")
def get_account_debt(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return calculate_account_decision_debt(account)

@router.get("/{account_id}/timeline")
def get_account_timeline(account_id: str, db: Session = Depends(get_db)):
    """
    Returns an aggregated, chronological timeline of interactions, decisions,
    activities, contracts, and audit events for the account.
    """
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    items = []
    # 1. Interactions
    for i in (account.interactions or []):
        contact_name = "Stakeholder"
        if i.contact_id:
            for c in account.contacts:
                if c.id == i.contact_id:
                    contact_name = c.name
                    break
        items.append({
            "id": i.id,
            "item_type": "INTERACTION",
            "timestamp": i.timestamp,
            "title": f"{i.type} Touchpoint ({i.direction or 'OUTBOUND'})",
            "description": i.summary or i.outcome or "Client communication recorded",
            "actor_or_owner": contact_name,
            "status": i.sentiment,
            "sentiment": i.sentiment
        })

    # 2. Decisions
    for dec in (account.decisions or []):
        items.append({
            "id": dec.id,
            "item_type": "DECISION",
            "timestamp": dec.created_at,
            "title": f"Decision: {dec.expected_action}",
            "description": dec.description,
            "actor_or_owner": dec.owner,
            "status": dec.status
        })

    # 3. Activities
    for a in (account.activities or []):
        items.append({
            "id": a.id,
            "item_type": "ACTIVITY",
            "timestamp": a.completed_at or a.due_date,
            "title": f"Activity: {a.activity_type.replace('_', ' ').title()}",
            "description": f"Assigned to {a.assigned_to}",
            "actor_or_owner": a.assigned_to,
            "status": a.status
        })

    # 4. Contracts
    for c in (account.contracts or []):
        items.append({
            "id": c.id,
            "item_type": "CONTRACT",
            "timestamp": c.created_at,
            "title": f"Contract: {c.action}",
            "description": f"Escalation rule: {c.escalation_rule} -> {c.escalation_target or 'Leadership'}",
            "actor_or_owner": c.owner,
            "status": c.status
        })

    # 5. Audit Events
    for ae in (account.audit_events or []):
        items.append({
            "id": ae.id,
            "item_type": "AUDIT_EVENT",
            "timestamp": ae.timestamp,
            "title": f"Agent State: {ae.event_type.replace('_', ' ')}",
            "description": f"Actor: {ae.actor}. Target: {ae.entity_type} {ae.entity_id}",
            "actor_or_owner": ae.actor,
            "status": ae.event_type
        })

    # Sort descending by timestamp
    items.sort(key=lambda x: x["timestamp"], reverse=True)
    return items

@router.get("/{account_id}/audit-events", response_model=List[AuditEventOut])
def get_account_audit_events(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    events = sorted(account.audit_events or [], key=lambda e: e.timestamp, reverse=True)
    return [AuditEventOut.model_validate(e) for e in events]

@router.get("/{account_id}/graph", response_model=GraphData)
def get_account_graph_endpoint(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return build_account_relationship_graph(account)

@router.get("/{account_id}/evidence", response_model=List[EvidenceOut])
def get_account_evidences(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return [EvidenceOut.model_validate(e) for e in account.evidences]

