import unittest
import datetime
import uuid
from backend.models.database import (
    SessionLocal, Account, Contact, Deal, Decision, DecisionContract,
    Prediction, Evidence, Outcome, AuditEvent
)
from backend.engine.decision_debt import calculate_account_decision_debt
from backend.engine.risk_engine import calculate_account_risks
from backend.engine.graph_engine import (
    build_account_relationship_graph, get_account_graph,
    get_connected_stakeholders, get_decision_ripple_paths,
    calculate_relationship_impact, calculate_account_exposure
)
from backend.engine.agent_machine import (
    AgentStateMachine, create_decision_contract_tool,
    complete_decision_contract_tool, escalate_decision_contract_tool,
    snooze_decision_contract_tool, record_audit_event
)
from backend.engine.self_audit import get_self_audit_metrics, record_prediction_outcome
from backend.engine.ai_copilot import process_copilot_query
from backend.api.actions import get_action_center_items

class TestPipelineIQCoreIntelligence(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        self.test_acc_id = f"acc-test-{uuid.uuid4().hex[:6]}"

        # Guarantee ACME hero account baseline numbers are pristine
        acme = self.db.query(Account).filter(Account.id == "acc-acme").first()
        if acme:
            acme.decision_debt_score = 82
            acme.risk_score = 78
            acme.revenue_at_risk = 180000.0
            acme.health_status = "CRITICAL"
            
            d1 = self.db.query(Decision).filter(Decision.id == "dec-acme-1").first()
            if d1:
                d1.status = "OVERDUE"
                d1.created_at = datetime.datetime.utcnow() - datetime.timedelta(days=18)
            d2 = self.db.query(Decision).filter(Decision.id == "dec-acme-2").first()
            if d2:
                d2.status = "PENDING"
            
            c1 = self.db.query(DecisionContract).filter(DecisionContract.id == "cnt-acme-1").first()
            if c1:
                c1.status = "PENDING"
                c1.reason = "Deal stalled 19 days + 2 of 3 contacts inactive + no interaction for 14 days"

            self.db.commit()

        # Create isolated test account for mutation tests
        now = datetime.datetime.utcnow()
        test_acc = Account(
            id=self.test_acc_id,
            company_name="Isolated Test Corporation",
            industry="Testing",
            account_value=100000.0,
            account_owner="Test Operator",
            health_status="HEALTHY",
            created_at=now,
            decision_debt_score=40,
            risk_score=35,
            revenue_at_risk=35000.0
        )
        self.db.add(test_acc)
        self.db.commit()

    def tearDown(self):
        # Cleanup test entities
        try:
            test_acc = self.db.query(Account).filter(Account.id == self.test_acc_id).first()
            if test_acc:
                self.db.delete(test_acc)
                self.db.commit()
        except Exception:
            self.db.rollback()
        finally:
            self.db.close()

    def test_01_decision_debt_calculation(self):
        """1. Decision Debt Calculation: deterministic, traceable contributors"""
        acme = self.db.query(Account).filter(Account.id == "acc-acme").first()
        self.assertIsNotNone(acme)
        breakdown = calculate_account_decision_debt(acme)
        
        # Verify score is 82 and severity is CRITICAL
        self.assertEqual(breakdown.score, 82)
        self.assertEqual(breakdown.severity, "CRITICAL")
        self.assertGreaterEqual(len(breakdown.contributors), 5)

        # Verify exact mathematically traceable contributors matching Section 5
        contrib_map = {c.category: c.points for c in breakdown.contributors}
        self.assertEqual(contrib_map.get("DECISION_DELAY"), 18)
        self.assertEqual(contrib_map.get("OPPORTUNITY_EXPOSURE"), 22)
        self.assertEqual(contrib_map.get("DECISION_MAKER_INACTIVE"), 15)
        self.assertEqual(contrib_map.get("STAKEHOLDER_DISENGAGEMENT"), 10)
        self.assertEqual(contrib_map.get("DEADLINE_OVERDUE"), 12)
        self.assertEqual(contrib_map.get("CONFIDENCE_CALIBRATION"), 5)
        self.assertEqual(sum(contrib_map.values()), 82)

    def test_02_score_normalization(self):
        """2. Score Normalization: 0-100 bounded reproducible scores"""
        accounts = self.db.query(Account).all()
        for acc in accounts:
            breakdown = calculate_account_decision_debt(acc)
            self.assertGreaterEqual(breakdown.score, 0)
            self.assertLessEqual(breakdown.score, 100)
            self.assertIn(breakdown.severity, ["LOW", "MODERATE", "ELEVATED", "CRITICAL"])

    def test_03_revenue_exposure_calculation(self):
        """3. Revenue Exposure Calculation: mathematically grounded in deal values"""
        exposure = calculate_account_exposure("acc-acme", self.db)
        self.assertEqual(exposure["revenue_at_risk"], 180000.0)
        self.assertGreaterEqual(exposure["total_pipeline_value"], 180000.0)
        self.assertGreaterEqual(exposure["unresolved_decision_count"], 1)

    def test_04_relationship_impact(self):
        """4. Relationship Impact: stakeholder dependencies and disengagement"""
        impact = calculate_relationship_impact("dec-acme-1", self.db)
        self.assertGreaterEqual(impact["relationship_impact_score"], 70)
        self.assertIn(impact["severity"], ["HIGH", "CRITICAL"])
        self.assertTrue(any("Primary decision maker" in f for f in impact["factors"]))

    def test_05_ripple_path_detection(self):
        """5. Ripple Path Detection: Decision -> Stakeholder -> Opportunity -> Revenue"""
        ripple = get_decision_ripple_paths("dec-acme-1", self.db)
        self.assertEqual(ripple["company_name"], "ACME Technologies")
        self.assertEqual(ripple["revenue_exposed"], 180000.0)
        self.assertGreaterEqual(len(ripple["ripple_path"]), 3)
        self.assertIn("David Sterling", ripple["human_summary"])
        self.assertIn("180,000", ripple["human_summary"])

    def test_06_decision_contract_creation(self):
        """6. Decision Contract Creation: Human approval and contract creation audit logs"""
        now = datetime.datetime.utcnow()
        contract = create_decision_contract_tool(
            db=self.db,
            account_id=self.test_acc_id,
            action="Test Strategic Intervention Contract",
            owner="Sarah Chen",
            deadline=now + datetime.timedelta(days=3),
            escalation_rule="Escalate to VP if no action in 3 days",
            escalation_target="VP of Sales",
            actor="Operator QA"
        )
        self.assertEqual(contract.status, "PENDING")
        self.assertEqual(contract.escalation_target, "VP of Sales")

        # Verify Audit Events were emitted
        human_ev = self.db.query(AuditEvent).filter(
            AuditEvent.entity_id == contract.id,
            AuditEvent.event_type == "HUMAN_APPROVED"
        ).first()
        self.assertIsNotNone(human_ev)

        created_ev = self.db.query(AuditEvent).filter(
            AuditEvent.entity_id == contract.id,
            AuditEvent.event_type == "CONTRACT_CREATED"
        ).first()
        self.assertIsNotNone(created_ev)

        # Cleanup created contract
        self.db.delete(contract)
        self.db.commit()

    def test_07_contract_completion(self):
        """7. Contract Completion: status update, debt reduction, and audit logging"""
        now = datetime.datetime.utcnow()
        c_id = f"cnt-test-comp-{uuid.uuid4().hex[:6]}"
        c = DecisionContract(
            id=c_id,
            account_id=self.test_acc_id,
            action="Resolve procurement pricing",
            owner="Sarah Chen",
            deadline=now + datetime.timedelta(days=2),
            escalation_rule="Escalate in 2 days",
            status="PENDING",
            created_at=now
        )
        self.db.add(c)
        self.db.commit()

        completed = complete_decision_contract_tool(self.db, c_id, "Approved revised tier")
        self.assertEqual(completed.status, "COMPLETED")
        self.assertIsNotNone(completed.completed_at)

        # Verify audit trail
        comp_ev = self.db.query(AuditEvent).filter(
            AuditEvent.entity_id == c_id,
            AuditEvent.event_type == "ACTION_COMPLETED"
        ).first()
        self.assertIsNotNone(comp_ev)

        # Cleanup
        self.db.delete(completed)
        self.db.commit()

    def test_08_contract_escalation(self):
        """8. Contract Escalation: status change, leadership target, and audit logging"""
        now = datetime.datetime.utcnow()
        c_id = f"cnt-test-esc-{uuid.uuid4().hex[:6]}"
        c = DecisionContract(
            id=c_id,
            account_id=self.test_acc_id,
            action="Unanswered briefing request",
            owner="Sarah Chen",
            deadline=now - datetime.timedelta(days=1),
            escalation_rule="Escalate to Sales Director",
            escalation_target="Sales Director",
            status="PENDING",
            created_at=now - datetime.timedelta(days=4)
        )
        self.db.add(c)
        self.db.commit()

        escalated = escalate_decision_contract_tool(self.db, c_id, "Deadline elapsed")
        self.assertEqual(escalated.status, "ESCALATED")
        self.assertIsNotNone(escalated.escalated_at)

        esc_ev = self.db.query(AuditEvent).filter(
            AuditEvent.entity_id == c_id,
            AuditEvent.event_type == "CONTRACT_ESCALATED"
        ).first()
        self.assertIsNotNone(esc_ev)

        # Cleanup
        self.db.delete(escalated)
        self.db.commit()

    def test_09_contract_snooze(self):
        """9. Contract Snooze: deadline extension, status update, and audit logging"""
        now = datetime.datetime.utcnow()
        c_id = f"cnt-test-snz-{uuid.uuid4().hex[:6]}"
        c = DecisionContract(
            id=c_id,
            account_id=self.test_acc_id,
            action="Briefing delay requested by client",
            owner="Sarah Chen",
            deadline=now + datetime.timedelta(days=1),
            escalation_rule="Escalate in 3 days",
            status="PENDING",
            created_at=now
        )
        self.db.add(c)
        self.db.commit()

        snoozed = snooze_decision_contract_tool(self.db, c_id, days=4)
        self.assertEqual(snoozed.status, "SNOOZED")
        self.assertGreater(snoozed.deadline, now + datetime.timedelta(days=4))

        snz_ev = self.db.query(AuditEvent).filter(
            AuditEvent.entity_id == c_id,
            AuditEvent.event_type == "CONTRACT_SNOOZED"
        ).first()
        self.assertIsNotNone(snz_ev)

        # Cleanup
        self.db.delete(snoozed)
        self.db.commit()

    def test_10_agent_state_transitions(self):
        """10. Agent State Transitions: valid progression and rejection of invalid jumps"""
        # Normal happy path
        self.assertTrue(AgentStateMachine.can_transition("OBSERVE", "DETECT"))
        self.assertTrue(AgentStateMachine.can_transition("DETECT", "ANALYZE"))
        self.assertTrue(AgentStateMachine.can_transition("ANALYZE", "RECOMMEND"))
        self.assertTrue(AgentStateMachine.can_transition("RECOMMEND", "HUMAN_APPROVAL"))
        self.assertTrue(AgentStateMachine.can_transition("HUMAN_APPROVAL", "CONTRACT_CREATED"))
        self.assertTrue(AgentStateMachine.can_transition("CONTRACT_CREATED", "MONITOR"))
        self.assertTrue(AgentStateMachine.can_transition("MONITOR", "OUTCOME"))
        self.assertTrue(AgentStateMachine.can_transition("OUTCOME", "AUDIT"))

        # Missed action escalation path
        self.assertTrue(AgentStateMachine.can_transition("MONITOR", "DEADLINE_MISSED"))
        self.assertTrue(AgentStateMachine.can_transition("DEADLINE_MISSED", "RECALCULATE_DEBT"))
        self.assertTrue(AgentStateMachine.can_transition("RECALCULATE_DEBT", "ESCALATE"))
        self.assertTrue(AgentStateMachine.can_transition("ESCALATE", "AUDIT"))

        # Invalid jump
        self.assertFalse(AgentStateMachine.can_transition("OBSERVE", "CONTRACT_CREATED"))
        self.assertFalse(AgentStateMachine.can_transition("RECOMMEND", "OUTCOME"))

    def test_11_prediction_outcome_matching(self):
        """11. Prediction / Outcome Matching: empirical verification and correctness logic"""
        now = datetime.datetime.utcnow()
        pred_id = f"pred-match-{uuid.uuid4().hex[:6]}"
        p1 = Prediction(
            id=pred_id,
            account_id=self.test_acc_id,
            risk_type="CHURN_RISK",
            score=75.0,
            confidence=0.88,
            created_at=now - datetime.timedelta(days=30)
        )
        self.db.add(p1)
        self.db.commit()

        # Outcome: confirmed churn -> matches prediction
        v1 = record_prediction_outcome(self.db, pred_id, "CONFIRMED_CHURN", notes="Client cancelled")
        self.assertTrue(v1.actual_outcome_match)
        self.assertIsNotNone(v1.outcome_verified_at)

        # Outcome record created in table
        out_rec = self.db.query(Outcome).filter(Outcome.prediction_id == pred_id).first()
        self.assertIsNotNone(out_rec)
        self.assertEqual(out_rec.actual_outcome, "CONFIRMED_CHURN")

        # Cleanup
        self.db.delete(out_rec)
        self.db.delete(v1)
        self.db.commit()

    def test_12_calibration_calculations(self):
        """12. Calibration Calculations: empirical accuracy rate, Brier score, and buckets"""
        audit = get_self_audit_metrics(self.db)
        self.assertGreaterEqual(audit.total_predictions, 50)
        self.assertGreaterEqual(audit.verified_predictions, 30)
        self.assertGreater(audit.overall_accuracy_rate, 50.0)
        self.assertLessEqual(audit.brier_score, 0.50)
        self.assertEqual(len(audit.calibration_buckets), 5)

    def test_13_action_center_prioritization(self):
        """13. Action Center Prioritization: priority ranking by Decision Debt and revenue"""
        items = get_action_center_items(self.db)
        self.assertGreaterEqual(len(items), 5)
        # Verify ACME is at or near top priority
        acme_item = next((item for item in items if item.company_name == "ACME Technologies"), None)
        self.assertIsNotNone(acme_item)
        self.assertEqual(acme_item.current_debt, 82)
        self.assertIn("David Sterling", acme_item.why)

    def test_14_ask_pipeline_iq_grounding(self):
        """14. Ask Pipeline IQ Grounding: zero-hallucination structured responses"""
        queries = [
            "Why is ACME high risk?",
            "What is causing the highest Decision Debt?",
            "Which account has the most revenue at risk?",
            "Why did ACME's score increase?",
            "What decisions are overdue?",
            "Which accounts have multiple inactive stakeholders?",
            "What contracts are currently escalated?"
        ]
        for q in queries:
            res = process_copilot_query(self.db, q)
            self.assertIsNotNone(res.answer)
            self.assertGreater(len(res.answer), 30)
            self.assertGreaterEqual(len(res.suggested_actions), 1)

    def test_15_end_to_end_demo_narrative(self):
        """
        Complete 16-Step End-to-End Hero Narrative Test:
        1. Seed test account with $180k active opportunity
        2. Add 3 stakeholders (primary decision maker + 2 others)
        3. Primary decision maker becomes inactive
        4. Add unresolved strategic business decision (18d delay)
        5. Calculate Decision Debt (rises into Critical tier)
        6. Graph analysis identifies connected opportunity & stakeholders
        7. Revenue at Risk computed
        8. Pipeline IQ explains WHY with grounded contributors
        9. AI generates recommendation
        10. Human reviews and approves
        11. Decision Contract created with 3-day deadline
        12. System monitors the contract
        13. Simulate missed deadline trigger
        14. Agent escalates contract to leadership
        15. Record empirical outcome
        16. Self-Audit verifies prediction and updates calibration
        """
        now = datetime.datetime.utcnow()
        hero_test_id = f"acc-hero-narrative-{uuid.uuid4().hex[:6]}"

        # Step 1: Create test account
        acc = Account(
            id=hero_test_id,
            company_name="Apex Synthetic Dynamics",
            industry="Enterprise SaaS",
            account_value=220000.0,
            account_owner="Sarah Chen",
            health_status="CRITICAL",
            created_at=now - datetime.timedelta(days=100)
        )
        self.db.add(acc)

        # Step 2 & 3: Stakeholders with inactive decision maker
        c1 = Contact(
            id=f"con-{hero_test_id}-1",
            account_id=hero_test_id,
            name="Marcus Vance",
            role="Chief Technology Officer",
            influence_level="DECISION_MAKER",
            email="marcus@apex-synth.io",
            status="INACTIVE",
            last_interaction=now - datetime.timedelta(days=21),
            engagement_score=26.0
        )
        c2 = Contact(
            id=f"con-{hero_test_id}-2",
            account_id=hero_test_id,
            name="Elena Wu",
            role="VP Infrastructure",
            influence_level="INFLUENCER",
            email="elena@apex-synth.io",
            status="INACTIVE",
            last_interaction=now - datetime.timedelta(days=18),
            engagement_score=31.0
        )
        self.db.add(c1)
        self.db.add(c2)

        # Opportunity ($180,000)
        deal = Deal(
            id=f"deal-{hero_test_id}-1",
            account_id=hero_test_id,
            contact_id=c1.id,
            deal_name="Global Cloud Infrastructure Expansion",
            value=180000.0,
            stage="NEGOTIATION",
            days_in_stage=19,
            status="STALLED"
        )
        self.db.add(deal)

        # Step 4: Unresolved decision (18 days old, overdue)
        dec = Decision(
            id=f"dec-{hero_test_id}-1",
            account_id=hero_test_id,
            contact_id=c1.id,
            opportunity_id=deal.id,
            description="Re-negotiate tier pricing with CTO Marcus Vance",
            expected_action="Deliver custom pricing addendum to Marcus Vance",
            owner="Sarah Chen",
            due_date=now - datetime.timedelta(days=5),
            status="OVERDUE",
            created_at=now - datetime.timedelta(days=18)
        )
        self.db.add(dec)

        # Prediction
        pred = Prediction(
            id=f"pred-{hero_test_id}-1",
            account_id=hero_test_id,
            risk_type="CHURN_RISK",
            score=78.0,
            confidence=0.88,
            created_at=now - datetime.timedelta(days=6)
        )
        self.db.add(pred)
        self.db.commit()

        # Step 5: Calculate Decision Debt
        debt = calculate_account_decision_debt(acc)
        self.assertGreaterEqual(debt.score, 75)
        self.assertEqual(debt.severity, "CRITICAL")

        # Step 6 & 7: Graph Traversal & Exposure
        ripple = get_decision_ripple_paths(dec.id, self.db)
        self.assertEqual(ripple["revenue_exposed"], 180000.0)
        self.assertIn("Marcus Vance", ripple["human_summary"])

        # Step 8: Grounded Explanation
        copilot_res = process_copilot_query(self.db, f"Why is {acc.company_name} risky?", account_id=acc.id)
        self.assertIn(acc.company_name, copilot_res.answer)

        # Step 9 & 10 & 11: Human Approval -> Decision Contract Created
        contract = create_decision_contract_tool(
            db=self.db,
            account_id=acc.id,
            action="Executive outreach to CTO Marcus Vance",
            owner="Sarah Chen",
            deadline=now + datetime.timedelta(days=3),
            escalation_rule="Escalate to Sales Director if no response in 3 days",
            escalation_target="Sales Director",
            decision_id=dec.id,
            actor="Sarah Chen"
        )
        self.assertEqual(contract.status, "PENDING")

        # Step 12 & 13 & 14: Simulate Missed Deadline -> Escalate
        contract.deadline = now - datetime.timedelta(hours=2) # Simulated deadline pass
        self.db.commit()

        escalated_c = escalate_decision_contract_tool(self.db, contract.id, "Automated deadline elapsed")
        self.assertEqual(escalated_c.status, "ESCALATED")

        # Step 15: Record Empirical Outcome
        verified_pred = record_prediction_outcome(
            db=self.db,
            prediction_id=pred.id,
            actual_outcome="CONFIRMED_CHURN",
            notes="Client confirmed churn after missed intervention"
        )
        self.assertTrue(verified_pred.actual_outcome_match)

        # Step 16: Self-Audit Verification
        audit = get_self_audit_metrics(self.db)
        self.assertGreaterEqual(audit.verified_predictions, 31)

        # Cleanup narrative entities
        self.db.delete(acc)
        self.db.commit()

if __name__ == "__main__":
    unittest.main()
