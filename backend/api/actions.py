from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
from backend.models.database import get_db, Account, DecisionContract, Activity, Decision
from backend.models.schemas import ActionCenterItem

router = APIRouter(prefix="/api/actions", tags=["Action Center"])

@router.get("/center", response_model=List[ActionCenterItem])
def get_action_center_items(db: Session = Depends(get_db)):
    """
    Returns prioritized human attention queue distinguishing:
    1. AI RECOMMENDATION (Requires Human Approval)
    2. HUMAN-APPROVED ACTION (In flight / Active Decision Contract)
    3. ESCALATED / OVERDUE ACTION (Urgent Attention Required)
    4. COMPLETED ACTION (Recently Resolved)

    Priority ranking accounts for Decision Debt, Revenue at Risk, and Deadline Urgency.
    """
    items: List[ActionCenterItem] = []
    now = datetime.utcnow()

    # 1. Escalated or Overdue Decision Contracts (Highest Priority)
    urgent_contracts = db.query(DecisionContract).filter(
        DecisionContract.status.in_(["ESCALATED", "OVERDUE"])
    ).all()

    for c in urgent_contracts:
        acc = c.account
        if acc:
            items.append(ActionCenterItem(
                id=f"act-cnt-{c.id}",
                account_id=acc.id,
                company_name=acc.company_name,
                account_owner=c.owner,
                title=f"URGENT: {c.status} Contract — {c.action}",
                priority="CRITICAL",
                action_type="ESCALATION" if c.status == "ESCALATED" else "OVERDUE_DECISION",
                deadline=c.deadline,
                revenue_at_risk=acc.revenue_at_risk,
                current_debt=acc.decision_debt_score,
                evidence_count=len(acc.evidences),
                recommended_action=f"Enforce escalation rule: {c.escalation_rule} -> {c.escalation_target or 'Leadership'}",
                why=f"Decision contract past deadline. {c.reason or 'Unresolved pipeline deadlock.'}",
                contract_id=c.id,
                requires_approval=True,
                approval_status="APPROVED"
            ))

    # 2. Critical Accounts: AI Recommendations requiring Human Approval
    critical_accounts = db.query(Account).filter(Account.decision_debt_score >= 65).all()
    for acc in critical_accounts:
        if any(item.account_id == acc.id for item in items):
            continue

        stalled_deals = [d for d in (acc.deals or []) if d.status == "STALLED" or d.days_in_stage >= 14]
        deal_desc = f"${stalled_deals[0].value:,.0f} deal stalled {stalled_deals[0].days_in_stage}d" if stalled_deals else "Pipeline velocity halted"
        inactive_contacts = [c for c in (acc.contacts or []) if c.status in ["INACTIVE", "AT_RISK"] or c.engagement_score < 45]
        contact_desc = f"{inactive_contacts[0].name} ({inactive_contacts[0].role}) inactive" if inactive_contacts else "Stakeholder disengagement"

        # Check if contract already exists
        active_contract = next((c for c in (acc.contracts or []) if c.status in ["PENDING", "DUE_SOON"]), None)
        status_val = "APPROVED" if active_contract else "RECOMMENDATION"

        items.append(ActionCenterItem(
            id=f"act-debt-{acc.id}",
            account_id=acc.id,
            company_name=acc.company_name,
            account_owner=acc.account_owner,
            title=f"Establish Decision Contract for {acc.company_name}",
            priority="CRITICAL" if acc.revenue_at_risk >= 150000 or acc.decision_debt_score >= 80 else "HIGH",
            action_type="HIGH_REVENUE_RISK",
            deadline=now + timedelta(days=2),
            revenue_at_risk=acc.revenue_at_risk,
            current_debt=acc.decision_debt_score,
            evidence_count=len(acc.evidences or []),
            recommended_action=f"Assign formal decision contract to {acc.account_owner} with 3-day escalation deadline",
            why=f"Decision debt reached {acc.decision_debt_score}/100. {deal_desc}. Primary stakeholder {contact_desc}.",
            contract_id=active_contract.id if active_contract else None,
            requires_approval=(status_val == "RECOMMENDATION"),
            approval_status=status_val
        ))

    # 3. Pending Contracts Approaching Deadline
    pending_contracts = db.query(DecisionContract).filter(
        DecisionContract.status == "PENDING"
    ).all()

    for c in pending_contracts:
        days_left = (c.deadline - now).days
        if days_left <= 3:
            acc = c.account
            if acc and not any(item.account_id == acc.id for item in items):
                items.append(ActionCenterItem(
                    id=f"act-cnt-{c.id}",
                    account_id=acc.id,
                    company_name=acc.company_name,
                    account_owner=c.owner,
                    title=f"Approaching Deadline: {c.action}",
                    priority="HIGH",
                    action_type="CONTRACT_DEADLINE",
                    deadline=c.deadline,
                    revenue_at_risk=acc.revenue_at_risk,
                    current_debt=acc.decision_debt_score,
                    evidence_count=len(acc.evidences or []),
                    recommended_action=f"Review progress with {c.owner} prior to auto-escalation",
                    why=f"Deadline expires in {max(1, days_left)} day(s). Impact: {c.expected_impact}",
                    contract_id=c.id,
                    requires_approval=False,
                    approval_status="APPROVED"
                ))

    # 4. Completed actions (last 3 for accountability feedback)
    completed_contracts = db.query(DecisionContract).filter(
        DecisionContract.status == "COMPLETED"
    ).order_by(DecisionContract.completed_at.desc()).limit(3).all()

    for c in completed_contracts:
        acc = c.account
        if acc and not any(item.account_id == acc.id for item in items):
            items.append(ActionCenterItem(
                id=f"act-comp-{c.id}",
                account_id=acc.id,
                company_name=acc.company_name,
                account_owner=c.owner,
                title=f"Resolved Action: {c.action}",
                priority="MEDIUM",
                action_type="OVERDUE_DECISION",
                deadline=c.deadline,
                revenue_at_risk=acc.revenue_at_risk,
                current_debt=acc.decision_debt_score,
                evidence_count=len(acc.evidences or []),
                recommended_action="Verification recorded; monitor trailing signal health",
                why=f"Completed on {c.completed_at.strftime('%b %d') if c.completed_at else 'recently'}: {c.outcome or 'Resolved'}",
                contract_id=c.id,
                requires_approval=False,
                approval_status="COMPLETED"
            ))

    # Priority sorting: CRITICAL first, then by current Decision Debt score, then revenue at risk
    priority_weight = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1}
    items.sort(
        key=lambda x: (
            priority_weight.get(x.priority, 0),
            x.current_debt or 0,
            x.revenue_at_risk
        ),
        reverse=True
    )

    return items
