from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.schemas import CopilotQueryRequest, CopilotQueryResponse
from backend.engine.ai_copilot import process_copilot_query

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])
ask_router = APIRouter(tags=["Ask Pipeline IQ"])

@router.post("/query", response_model=CopilotQueryResponse)
def query_copilot(payload: CopilotQueryRequest, db: Session = Depends(get_db)):
    return process_copilot_query(db, query=payload.query, account_id=payload.account_id)

@router.post("/ask", response_model=CopilotQueryResponse)
def ask_copilot(payload: CopilotQueryRequest, db: Session = Depends(get_db)):
    return process_copilot_query(db, query=payload.query, account_id=payload.account_id)

@ask_router.post("/api/ask", response_model=CopilotQueryResponse)
@ask_router.post("/ask", response_model=CopilotQueryResponse)
def ask_pipeline_iq(payload: CopilotQueryRequest, db: Session = Depends(get_db)):
    return process_copilot_query(db, query=payload.query, account_id=payload.account_id)

