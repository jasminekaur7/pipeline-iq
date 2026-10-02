from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ContactOut(BaseModel):
    id: str
    account_id: str
    name: str
    role: str
    influence_level: Optional[str] = "STAKEHOLDER"
    email: str
    phone: str
    status: str
    last_interaction: datetime
    engagement_score: float

    class Config:
        from_attributes = True

class DealOut(BaseModel):
    id: str
    account_id: str
    contact_id: Optional[str] = None
    deal_name: str
    value: float
    stage: str
    probability: float
    expected_close_date: datetime
    owner: str
    days_in_stage: int
    status: str

    class Config:
        from_attributes = True

class InteractionOut(BaseModel):
    id: str
    account_id: str
    contact_id: Optional[str] = None
    type: str
    direction: Optional[str] = "OUTBOUND"
    timestamp: datetime
    sentiment: str
    summary: str
    outcome: str

    class Config:
        from_attributes = True

class ActivityOut(BaseModel):
    id: str
    account_id: str
    assigned_to: str
    activity_type: str
    due_date: datetime
    completed_at: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True

class DecisionOut(BaseModel):
    id: str
    account_id: str
    contact_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    description: str
    expected_action: str
    owner: str
    due_date: datetime
    due_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DecisionContractCreate(BaseModel):
    account_id: str
    decision_id: Optional[str] = None
    action: str
    owner: str
    deadline: datetime
    escalation_rule: str
    escalation_target: Optional[str] = "Sales Director"
    expected_impact: Optional[str] = "Reduce Churn & Unblock Pipeline"
    reason: Optional[str] = ""

class DecisionContractUpdate(BaseModel):
    action: Optional[str] = None
    owner: Optional[str] = None
    deadline: Optional[datetime] = None
    escalation_rule: Optional[str] = None
    escalation_target: Optional[str] = None
    status: Optional[str] = None
    expected_impact: Optional[str] = None
    reason: Optional[str] = None

class DecisionContractOut(BaseModel):
    id: str
    account_id: str
    decision_id: Optional[str] = None
    company_name: Optional[str] = None
    action: str
    owner: str
    deadline: datetime
    escalation_rule: str
    escalation_target: Optional[str] = "Sales Director"
    status: str
    expected_impact: str
    reason: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    escalated_at: Optional[datetime] = None
    outcome: Optional[str] = None

    class Config:
        from_attributes = True

class OutcomeCreate(BaseModel):
    actual_outcome: str # CONFIRMED_CHURN, PREVENTED, FALSE_POSITIVE, RENEWED, LOST
    verification_source: Optional[str] = "CRM Telemetry / Billing Sync"
    notes: Optional[str] = ""

class OutcomeOut(BaseModel):
    id: str
    prediction_id: str
    actual_outcome: str
    verified_at: datetime
    verification_source: str
    notes: Optional[str] = ""

    class Config:
        from_attributes = True

class PredictionOut(BaseModel):
    id: str
    account_id: str
    risk_type: str
    score: float
    confidence: float
    created_at: datetime
    outcome: Optional[str] = None
    outcome_verified_at: Optional[datetime] = None
    actual_outcome_match: Optional[bool] = None
    audit_notes: Optional[str] = ""

    class Config:
        from_attributes = True

class EvidenceOut(BaseModel):
    id: str
    related_entity: str
    account_id: str
    evidence_type: str
    source: str
    description: str
    timestamp: datetime
    weight: float

    class Config:
        from_attributes = True

class AuditEventOut(BaseModel):
    id: str
    account_id: Optional[str] = None
    entity_type: str
    entity_id: str
    event_type: str
    timestamp: datetime
    actor: str
    metadata_json: Optional[str] = "{}"

    class Config:
        from_attributes = True

class DecisionDebtContributor(BaseModel):
    category: str
    points: int
    description: str
    entity_id: Optional[str] = None
    severity: str

class DecisionDebtBreakdown(BaseModel):
    score: int
    severity: str # LOW, MODERATE, ELEVATED, CRITICAL
    contributors: List[DecisionDebtContributor]
    revenue_impact: float
    trend: str # INCREASING, STABLE, DECREASING

class RiskBreakdown(BaseModel):
    churn_risk_score: int
    deal_loss_risk_score: int
    stalled_pipeline_score: int
    overall_risk_score: int
    confidence: float
    revenue_at_risk: float
    primary_threat: str

class AccountOut(BaseModel):
    id: str
    company_name: str
    industry: str
    account_value: float
    account_owner: str
    health_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    decision_debt_score: int
    risk_score: int
    revenue_at_risk: float
    deal_count: Optional[int] = 0
    contact_count: Optional[int] = 0
    overdue_count: Optional[int] = 0

    class Config:
        from_attributes = True

class AccountDetailOut(BaseModel):
    account: AccountOut
    contacts: List[ContactOut]
    deals: List[DealOut]
    interactions: List[InteractionOut]
    activities: List[ActivityOut]
    decisions: List[DecisionOut]
    contracts: List[DecisionContractOut]
    predictions: List[PredictionOut]
    evidences: List[EvidenceOut]
    audit_events: List[AuditEventOut] = []
    decision_debt: DecisionDebtBreakdown
    risk_analysis: RiskBreakdown
    ai_reasoning: str

# Graph models
class GraphNode(BaseModel):
    id: str
    label: str
    type: str # ACCOUNT, CONTACT, DEAL, ACTIVITY, DECISION
    status: Optional[str] = None
    value: Optional[float] = None
    risk_level: Optional[str] = None # NORMAL, WARNING, CRITICAL
    details: Optional[Dict[str, Any]] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str # HAS_CONTACT, HAS_DEAL, RELATES_TO, INFLUENCES, INTERACTED_WITH, DEPENDS_ON
    is_risk_path: Optional[bool] = False

class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    ripple_summary: Optional[str] = None
    critical_path: Optional[List[str]] = None
    downstream_exposure: Optional[float] = None
    affected_stakeholders: Optional[List[str]] = None

# Dashboard Overview
class DashboardMetrics(BaseModel):
    total_decision_debt: int
    total_revenue_at_risk: float
    critical_decisions_count: int
    overdue_actions_count: int
    high_risk_accounts_count: int
    prediction_accuracy_rate: float
    debt_trend_data: List[Dict[str, Any]]
    risk_distribution: Dict[str, int]
    attention_accounts: List[AccountOut]
    recent_contracts: List[DecisionContractOut]

# Action Center
class ActionCenterItem(BaseModel):
    id: str
    account_id: str
    company_name: str
    account_owner: str
    title: str
    priority: str # CRITICAL, HIGH, MEDIUM
    action_type: str # OVERDUE_DECISION, HIGH_REVENUE_RISK, CONTRACT_DEADLINE, ESCALATION
    deadline: Optional[datetime] = None
    revenue_at_risk: float
    current_debt: Optional[int] = None
    evidence_count: int
    recommended_action: str
    why: str
    contract_id: Optional[str] = None
    decision_id: Optional[str] = None
    requires_approval: bool = True
    approval_status: Optional[str] = "RECOMMENDATION" # RECOMMENDATION, APPROVED, COMPLETED

# Self-Audit
class CalibrationBucket(BaseModel):
    bucket_range: str # e.g. "70-80%"
    predicted_count: int
    actual_positive_count: int
    accuracy_rate: float

class SelfAuditSummary(BaseModel):
    total_predictions: int
    verified_predictions: int
    correct_predictions: int
    incorrect_predictions: int
    overall_accuracy_rate: float
    brier_score: float
    calibration_buckets: List[CalibrationBucket]
    false_positives: int
    false_negatives: int
    recent_audits: List[PredictionOut]

# AI Copilot Query
class CopilotQueryRequest(BaseModel):
    query: str
    account_id: Optional[str] = None

class CopilotQueryResponse(BaseModel):
    answer: str
    intent: str
    cited_accounts: List[Dict[str, Any]]
    cited_evidence: List[Dict[str, Any]]
    suggested_actions: List[str]
    ripple_analysis: Optional[Dict[str, Any]] = None
