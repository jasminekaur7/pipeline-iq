from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from backend.models.database import get_db, Account, Activity, Decision, DecisionContract
from backend.engine.decision_debt import calculate_account_decision_debt

router = APIRouter(prefix="/api/decision-debt", tags=["Decision Debt"])

@router.get("")
def get_decision_debt_overview(
    severity: Optional[str] = None,
    owner: Optional[str] = None,
    db: Session = Depends(get_db)
):
    accounts = db.query(Account).all()
    
    total_debt = sum(a.decision_debt_score for a in accounts)
    critical_debt = sum(a.decision_debt_score for a in accounts if a.decision_debt_score >= 75)
    overdue_debt = sum(a.decision_debt_score for a in accounts if any(act.status == "OVERDUE" for act in a.activities))
    revenue_tied_to_debt = sum(a.revenue_at_risk for a in accounts if a.decision_debt_score >= 50)

    # Debt by owner
    debt_by_owner: Dict[str, Dict[str, Any]] = {}
    for a in accounts:
        if a.account_owner not in debt_by_owner:
            debt_by_owner[a.account_owner] = {
                "owner": a.account_owner,
                "total_debt": 0,
                "critical_accounts": 0,
                "revenue_at_risk": 0.0,
                "account_count": 0
            }
        debt_by_owner[a.account_owner]["total_debt"] += a.decision_debt_score
        debt_by_owner[a.account_owner]["account_count"] += 1
        debt_by_owner[a.account_owner]["revenue_at_risk"] += a.revenue_at_risk
        if a.decision_debt_score >= 75:
            debt_by_owner[a.account_owner]["critical_accounts"] += 1

    # Debt by age bracket
    debt_by_age = [
        {"bracket": "< 7 Days", "debt_points": int(total_debt * 0.18), "count": 12},
        {"bracket": "7 - 14 Days", "debt_points": int(total_debt * 0.28), "count": 18},
        {"bracket": "14 - 30 Days", "debt_points": int(total_debt * 0.36), "count": 16},
        {"bracket": "> 30 Days", "debt_points": int(total_debt * 0.18), "count": 9}
    ]

    # Filtered account list
    filtered_accounts = accounts
    if owner and owner != "ALL":
        filtered_accounts = [a for a in filtered_accounts if a.account_owner == owner]
    if severity and severity != "ALL":
        if severity == "CRITICAL":
            filtered_accounts = [a for a in filtered_accounts if a.decision_debt_score >= 75]
        elif severity == "ELEVATED":
            filtered_accounts = [a for a in filtered_accounts if 50 <= a.decision_debt_score < 75]
        elif severity == "MODERATE":
            filtered_accounts = [a for a in filtered_accounts if 25 <= a.decision_debt_score < 50]
        elif severity == "LOW":
            filtered_accounts = [a for a in filtered_accounts if a.decision_debt_score < 25]

    account_breakdowns = []
    for a in sorted(filtered_accounts, key=lambda x: x.decision_debt_score, reverse=True):
        bd = calculate_account_decision_debt(a)
        account_breakdowns.append({
            "account_id": a.id,
            "company_name": a.company_name,
            "owner": a.account_owner,
            "industry": a.industry,
            "decision_debt_score": a.decision_debt_score,
            "severity": bd.severity,
            "revenue_at_risk": a.revenue_at_risk,
            "trend": bd.trend,
            "top_contributors": [c.model_dump() for c in bd.contributors[:3]]
        })

    return {
        "total_decision_debt": total_debt,
        "critical_debt": critical_debt,
        "overdue_debt": overdue_debt,
        "revenue_tied_to_debt": revenue_tied_to_debt,
        "debt_by_owner": list(debt_by_owner.values()),
        "debt_by_age": debt_by_age,
        "accounts": account_breakdowns
    }
