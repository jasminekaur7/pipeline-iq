# Standard assertion-based tests runnable without external test runner
import sys
from datetime import datetime, timedelta
from backend.models.database import SessionLocal, Account, Contact, Deal, Activity, Decision, DecisionContract
from backend.engine.decision_debt import calculate_account_decision_debt
from backend.engine.risk_engine import calculate_account_risks
from backend.engine.graph_engine import build_account_relationship_graph
from backend.engine.agent_machine import (
    complete_decision_contract_tool, escalate_decision_contract_tool, snooze_decision_contract_tool
)
from backend.engine.self_audit import get_self_audit_metrics

def test_decision_debt_calculation():
    db = SessionLocal()
    try:
        acme = db.query(Account).filter(Account.id == "acc-acme").first()
        assert acme is not None
        
        breakdown = calculate_account_decision_debt(acme)
        assert breakdown.score >= 70, f"Expected ACME debt >= 70, got {breakdown.score}"
        assert breakdown.severity == "CRITICAL"
        assert len(breakdown.contributors) >= 3
        assert breakdown.revenue_impact > 0
    finally:
        db.close()

def test_risk_engine_calculation():
    db = SessionLocal()
    try:
        acme = db.query(Account).filter(Account.id == "acc-acme").first()
        assert acme is not None
        
        risks = calculate_account_risks(acme)
        assert risks.overall_risk_score >= 60
        assert risks.churn_risk_score > 0
        assert risks.confidence > 0.7
        assert risks.revenue_at_risk > 0
    finally:
        db.close()

def test_relationship_graph_building():
    db = SessionLocal()
    try:
        acme = db.query(Account).filter(Account.id == "acc-acme").first()
        graph = build_account_relationship_graph(acme)
        
        assert len(graph.nodes) >= 5
        assert len(graph.edges) >= 4
        assert graph.ripple_summary is not None
        assert len(graph.critical_path) >= 2
    finally:
        db.close()

def test_contract_actions_and_state():
    db = SessionLocal()
    try:
        contract = db.query(DecisionContract).filter(DecisionContract.status == "PENDING").first()
        if contract:
            c_id = contract.id
            snoozed = snooze_decision_contract_tool(db, c_id, days=2)
            assert snoozed.status == "SNOOZED"
    finally:
        db.close()

def test_self_audit_metrics():
    db = SessionLocal()
    try:
        audit = get_self_audit_metrics(db)
        assert audit.total_predictions >= 50
        assert audit.verified_predictions >= 30
        assert 0.0 <= audit.overall_accuracy_rate <= 100.0
        assert len(audit.calibration_buckets) == 5
    finally:
        db.close()

if __name__ == "__main__":
    print("Running engine unit tests...")
    test_decision_debt_calculation()
    test_risk_engine_calculation()
    test_relationship_graph_building()
    test_contract_actions_and_state()
    test_self_audit_metrics()
    print("ALL 5 ENGINE UNIT TESTS PASSED SUCCESSFULLY!")
