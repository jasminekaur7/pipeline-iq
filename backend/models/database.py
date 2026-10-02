import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from backend.config import settings

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

# SQLite connection arguments for concurrency
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, index=True)
    company_name = Column(String, nullable=False, index=True)
    industry = Column(String, default="Technology")
    account_value = Column(Float, default=0.0)
    account_owner = Column(String, default="Unassigned")
    health_status = Column(String, default="HEALTHY") # HEALTHY, WARNING, CRITICAL
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Computed/cached metrics for speed & consistency
    decision_debt_score = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)
    revenue_at_risk = Column(Float, default=0.0)
    last_signal_date = Column(DateTime, default=utc_now)

    # Relationships
    contacts = relationship("Contact", back_populates="account", cascade="all, delete-orphan")
    deals = relationship("Deal", back_populates="account", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="account", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="account", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="account", cascade="all, delete-orphan")
    contracts = relationship("DecisionContract", back_populates="account", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="account", cascade="all, delete-orphan")
    evidences = relationship("Evidence", back_populates="account", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="account", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    role = Column(String, default="Stakeholder")
    influence_level = Column(String, default="STAKEHOLDER") # DECISION_MAKER, INFLUENCER, STAKEHOLDER, GATEKEEPER, OPERATOR
    email = Column(String, nullable=False)
    phone = Column(String, default="+1-555-0100")
    status = Column(String, default="ACTIVE") # ACTIVE, INACTIVE, AT_RISK
    last_interaction = Column(DateTime, default=utc_now)
    engagement_score = Column(Float, default=80.0)

    account = relationship("Account", back_populates="contacts")
    decisions = relationship("Decision", back_populates="contact")


class Deal(Base):
    __tablename__ = "deals"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(String, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    deal_name = Column(String, nullable=False)
    value = Column(Float, default=0.0)
    stage = Column(String, default="DISCOVERY") # DISCOVERY, PROPOSAL, NEGOTIATION, COMMITTED, STALLED, CLOSED_WON, CLOSED_LOST
    probability = Column(Float, default=0.5)
    expected_close_date = Column(DateTime, default=utc_now)
    owner = Column(String, default="Sales Rep")
    days_in_stage = Column(Integer, default=0)
    status = Column(String, default="ACTIVE") # ACTIVE, STALLED, WON, LOST

    account = relationship("Account", back_populates="deals")
    decisions = relationship("Decision", back_populates="deal")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(String, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    type = Column(String, default="EMAIL") # EMAIL, CALL, MEETING, NOTE
    direction = Column(String, default="OUTBOUND") # INBOUND, OUTBOUND
    timestamp = Column(DateTime, default=utc_now, index=True)
    sentiment = Column(String, default="NEUTRAL") # POSITIVE, NEUTRAL, NEGATIVE
    summary = Column(Text, default="")
    outcome = Column(String, default="")

    account = relationship("Account", back_populates="interactions")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_to = Column(String, default="Account Owner")
    activity_type = Column(String, default="FOLLOW_UP") # FOLLOW_UP, EXECUTIVE_CHECKIN, SECURITY_REVIEW, CONTRACT_RENEWAL, TECHNICAL_DEMO
    due_date = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, default="PENDING") # PENDING, COMPLETED, OVERDUE, CANCELLED

    account = relationship("Account", back_populates="activities")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(String, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    opportunity_id = Column(String, ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=False)
    expected_action = Column(String, nullable=False)
    owner = Column(String, default="Account Owner")
    due_date = Column(DateTime, nullable=False)
    due_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, default="PENDING") # PENDING, COMPLETED, OVERDUE, ESCALATED
    created_at = Column(DateTime, default=utc_now)

    account = relationship("Account", back_populates="decisions")
    contact = relationship("Contact", back_populates="decisions")
    deal = relationship("Deal", back_populates="decisions")
    contracts = relationship("DecisionContract", back_populates="decision")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_type = Column(String, default="CHURN_RISK") # CHURN_RISK, DEAL_LOSS, STALLED_PIPELINE, ENGAGEMENT_DECLINE
    score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.8)
    created_at = Column(DateTime, default=utc_now)
    outcome = Column(String, nullable=True) # CONFIRMED_CHURN, PREVENTED, FALSE_POSITIVE, RENEWED, LOST
    outcome_verified_at = Column(DateTime, nullable=True)
    actual_outcome_match = Column(Boolean, nullable=True)
    audit_notes = Column(Text, default="")

    account = relationship("Account", back_populates="predictions")
    outcomes = relationship("Outcome", back_populates="prediction", cascade="all, delete-orphan")


class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(String, primary_key=True, index=True)
    prediction_id = Column(String, ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False, index=True)
    actual_outcome = Column(String, nullable=False) # CONFIRMED_CHURN, PREVENTED, FALSE_POSITIVE, RENEWED, LOST
    verified_at = Column(DateTime, default=utc_now)
    verification_source = Column(String, default="CRM Telemetry / Billing Sync")
    notes = Column(Text, default="")

    prediction = relationship("Prediction", back_populates="outcomes")


class DecisionContract(Base):
    __tablename__ = "decision_contracts"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    decision_id = Column(String, ForeignKey("decisions.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    owner = Column(String, nullable=False)
    deadline = Column(DateTime, nullable=False)
    escalation_rule = Column(String, nullable=False) # e.g. "Escalate to Sales Director if no action in 3 days"
    escalation_target = Column(String, default="Sales Director")
    status = Column(String, default="PENDING") # PENDING, DUE_SOON, OVERDUE, ESCALATED, COMPLETED, SNOOZED
    expected_impact = Column(String, default="Prevent Churn / Unblock Pipeline")
    reason = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    escalated_at = Column(DateTime, nullable=True)
    outcome = Column(String, default="")

    account = relationship("Account", back_populates="contracts")
    decision = relationship("Decision", back_populates="contracts")


class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(String, primary_key=True, index=True)
    related_entity = Column(String, nullable=False) # e.g. "ACCOUNT:acme", "DEAL:deal-1", "DECISION:dec-1"
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_type = Column(String, default="INTERACTION_GAP") # INTERACTION_GAP, DEAL_STALLED, CONTACT_DISENGAGEMENT, OVERDUE_ACTIVITY, HISTORICAL_SIMILARITY
    source = Column(String, default="CRM Pipeline")
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utc_now)
    weight = Column(Float, default=0.8)

    account = relationship("Account", back_populates="evidences")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True, index=True)
    entity_type = Column(String, nullable=False) # ACCOUNT, DECISION, CONTRACT, PREDICTION, AGENT
    entity_id = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True) # OBSERVED, DEBT_RECALCULATED, RISK_DETECTED, RECOMMENDATION_GENERATED, HUMAN_APPROVED, CONTRACT_CREATED, DEADLINE_MISSED, CONTRACT_ESCALATED, CONTRACT_SNOOZED, ACTION_COMPLETED, OUTCOME_VERIFIED
    timestamp = Column(DateTime, default=utc_now, index=True)
    actor = Column(String, default="System Agent") # System Agent, Sarah Chen, Human Operator, Sales Director
    metadata_json = Column(Text, default="{}")

    account = relationship("Account", back_populates="audit_events")


def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
