from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from backend.models.database import get_db, Decision, Account
from backend.models.schemas import DecisionOut
from backend.engine.graph_engine import get_decision_ripple_paths, calculate_relationship_impact

router = APIRouter(prefix="/api/decisions", tags=["Decisions"])

@router.get("", response_model=List[DecisionOut])
def get_decisions(
    status: Optional[str] = None,
    account_id: Optional[str] = None,
    owner: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Decision).order_by(Decision.due_date.asc())
    if status and status != "ALL":
        query = query.filter(Decision.status == status.upper())
    if account_id:
        query = query.filter(Decision.account_id == account_id)
    if owner and owner != "ALL":
        query = query.filter(Decision.owner == owner)

    decisions = query.all()
    return [DecisionOut.model_validate(d) for d in decisions]

@router.get("/{decision_id}", response_model=DecisionOut)
def get_decision(decision_id: str, db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return DecisionOut.model_validate(decision)

@router.get("/{decision_id}/ripple")
def get_decision_ripple(decision_id: str, db: Session = Depends(get_db)):
    try:
        ripple = get_decision_ripple_paths(decision_id, db)
        impact = calculate_relationship_impact(decision_id, db)
        return {
            "ripple": ripple,
            "impact": impact
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
