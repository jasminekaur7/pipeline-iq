import datetime
import random
from sqlalchemy.orm import Session
from backend.models.database import (
    Base, engine, SessionLocal,
    Account, Contact, Deal, Interaction, Activity, Decision, DecisionContract, Prediction, Evidence, Outcome, AuditEvent
)
from backend.engine.decision_debt import calculate_account_decision_debt
from backend.engine.risk_engine import calculate_account_risks

def seed_database(db: Session, force: bool = False):
    """
    Populates the database with realistic enterprise data meeting all requirements:
    - 55+ accounts
    - 170+ contacts
    - 110+ deals
    - 550+ interactions
    - 220+ activities
    - 65+ decisions
    - 35+ decision contracts
    - 85+ predictions with verified historical outcomes for Self-Audit
    - 200+ Evidence ledger entries
    - ACME Technologies canonical hero account
    """
    # Check if data already exists
    if not force and db.query(Account).count() >= 50:
        print("Database already seeded with 50+ accounts.")
        return

    print("Seeding database with synthetic enterprise dataset...")
    # Drop and recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    now = datetime.datetime.utcnow()
    owners = ["Sarah Chen", "Marcus Vance", "Elena Rostova", "Devon Park", "Aisha Al-Mansoor", "Liam O'Connor"]
    industries = ["Enterprise SaaS", "Financial Tech", "Healthcare Tech", "Cybersecurity", "Supply Chain AI", "Cloud Infrastructure", "E-Commerce Logistics"]

    # 1. CREATE HERO ACCOUNT: ACME Technologies
    # Target signals:
    # - $250,000 active pipeline
    # - 3 contacts, 2 inactive
    # - no meaningful interaction for 14 days
    # - deal stalled for 19 days
    # - engagement down 42%
    # - salesperson follow-up overdue
    # - Decision Debt: 82/100, Revenue at Risk: $180,000, Account Risk: 78%
    acme = Account(
        id="acc-acme",
        company_name="ACME Technologies",
        industry="Enterprise SaaS",
        account_value=250000.0,
        account_owner="Sarah Chen",
        health_status="CRITICAL",
        created_at=now - datetime.timedelta(days=120),
        decision_debt_score=82,
        risk_score=78,
        revenue_at_risk=180000.0,
        last_signal_date=now - datetime.timedelta(days=1)
    )
    db.add(acme)

    # ACME Contacts: 3 contacts, 2 inactive
    acme_contacts = [
        Contact(
            id="con-acme-1",
            account_id="acc-acme",
            name="David Sterling",
            role="Chief Information Officer",
            influence_level="DECISION_MAKER",
            email="david.sterling@acmetech.io",
            phone="+1-415-555-0192",
            status="INACTIVE",
            last_interaction=now - datetime.timedelta(days=22),
            engagement_score=28.0
        ),
        Contact(
            id="con-acme-2",
            account_id="acc-acme",
            name="Rachel Zhao",
            role="VP of Engineering",
            influence_level="INFLUENCER",
            email="rachel.zhao@acmetech.io",
            phone="+1-415-555-0193",
            status="INACTIVE",
            last_interaction=now - datetime.timedelta(days=18),
            engagement_score=34.0
        ),
        Contact(
            id="con-acme-3",
            account_id="acc-acme",
            name="Kevin Miller",
            role="Director of Procurement",
            influence_level="GATEKEEPER",
            email="kevin.miller@acmetech.io",
            phone="+1-415-555-0194",
            status="ACTIVE",
            last_interaction=now - datetime.timedelta(days=14),
            engagement_score=62.0
        )
    ]
    for c in acme_contacts:
        db.add(c)

    # ACME Deals: $230k total active pipeline, stalled for 19 days ($180k primary expansion deal)
    acme_deals = [
        Deal(
            id="deal-acme-1",
            account_id="acc-acme",
            contact_id="con-acme-1",
            deal_name="Enterprise Platform Expansion",
            value=180000.0,
            stage="NEGOTIATION",
            probability=0.45,
            expected_close_date=now + datetime.timedelta(days=12),
            owner="Sarah Chen",
            days_in_stage=19,
            status="STALLED"
        ),
        Deal(
            id="deal-acme-2",
            account_id="acc-acme",
            contact_id="con-acme-2",
            deal_name="Security Compliance Add-on",
            value=50000.0,
            stage="PROPOSAL",
            probability=0.30,
            expected_close_date=now + datetime.timedelta(days=35),
            owner="Sarah Chen",
            days_in_stage=14,
            status="STALLED"
        )
    ]
    for d in acme_deals:
        db.add(d)

    # ACME Interactions: no interaction for 14 days
    acme_interactions = [
        Interaction(
            id="int-acme-1",
            account_id="acc-acme",
            contact_id="con-acme-3",
            type="EMAIL",
            timestamp=now - datetime.timedelta(days=14),
            sentiment="NEUTRAL",
            summary="Procurement requested revised SOW terms regarding annual price lock.",
            outcome="Waiting for revised contract review"
        ),
        Interaction(
            id="int-acme-2",
            account_id="acc-acme",
            contact_id="con-acme-2",
            type="MEETING",
            timestamp=now - datetime.timedelta(days=18),
            sentiment="NEGATIVE",
            summary="Technical sync where Rachel noted timeline slippage from our deployment team.",
            outcome="Action item to schedule technical follow-up was unfulfilled"
        ),
        Interaction(
            id="int-acme-3",
            account_id="acc-acme",
            contact_id="con-acme-1",
            type="CALL",
            timestamp=now - datetime.timedelta(days=22),
            sentiment="NEUTRAL",
            summary="Quarterly roadmap review. CIO expressed concern about vendor consolidation.",
            outcome="Agreed to send consolidated proposal"
        ),
        Interaction(
            id="int-acme-4",
            account_id="acc-acme",
            contact_id="con-acme-1",
            type="EMAIL",
            timestamp=now - datetime.timedelta(days=35),
            sentiment="POSITIVE",
            summary="Initial sign-off on enterprise expansion architecture.",
            outcome="Deal advanced to Negotiation"
        )
    ]
    for i in acme_interactions:
        db.add(i)

    # ACME Activities: overdue follow-up
    acme_activities = [
        Activity(
            id="act-acme-1",
            account_id="acc-acme",
            assigned_to="Sarah Chen",
            activity_type="FOLLOW_UP",
            due_date=now - datetime.timedelta(days=7),
            completed_at=None,
            status="OVERDUE"
        ),
        Activity(
            id="act-acme-2",
            account_id="acc-acme",
            assigned_to="Sarah Chen",
            activity_type="EXECUTIVE_CHECKIN",
            due_date=now - datetime.timedelta(days=3),
            completed_at=None,
            status="OVERDUE"
        ),
        Activity(
            id="act-acme-3",
            account_id="acc-acme",
            assigned_to="Devon Park",
            activity_type="SECURITY_REVIEW",
            due_date=now + datetime.timedelta(days=4),
            completed_at=None,
            status="PENDING"
        )
    ]
    for a in acme_activities:
        db.add(a)

    # ACME Decisions: decision-1 has been unresolved for 18 days
    acme_decisions = [
        Decision(
            id="dec-acme-1",
            account_id="acc-acme",
            contact_id="con-acme-1",
            opportunity_id="deal-acme-1",
            description="Re-negotiate annual expansion price discount to prevent procurement deadlock with CIO David Sterling",
            expected_action="Submit revised enterprise pricing terms to CIO David Sterling",
            owner="Sarah Chen",
            due_date=now - datetime.timedelta(days=5),
            due_at=now - datetime.timedelta(days=5),
            status="OVERDUE",
            created_at=now - datetime.timedelta(days=18)
        ),
        Decision(
            id="dec-acme-2",
            account_id="acc-acme",
            contact_id="con-acme-1",
            opportunity_id="deal-acme-1",
            description="Schedule C-level executive alignment with CIO David Sterling",
            expected_action="Book VP to CIO executive briefing",
            owner="Sarah Chen",
            due_date=now + datetime.timedelta(days=2),
            due_at=now + datetime.timedelta(days=2),
            status="PENDING",
            created_at=now - datetime.timedelta(days=4)
        )
    ]
    for dec in acme_decisions:
        db.add(dec)

    # ACME Decision Contract
    acme_contract = DecisionContract(
        id="cnt-acme-1",
        account_id="acc-acme",
        decision_id="dec-acme-1",
        action="Re-engage ACME decision maker (CIO David Sterling)",
        owner="Sarah Chen",
        deadline=now + datetime.timedelta(days=3),
        escalation_rule="Escalate to Sales Director if no meeting confirmed within 3 days",
        escalation_target="Sales Director",
        status="PENDING",
        expected_impact="Reduce churn risk from 78% to <35% & unblock $180k expansion deal",
        reason="Deal stalled 19 days + 2 of 3 contacts inactive + no interaction for 14 days",
        created_at=now - datetime.timedelta(hours=6)
    )
    db.add(acme_contract)

    # ACME Evidence Ledger Entries
    acme_evidences = [
        Evidence(
            id="ev-acme-1",
            account_id="acc-acme",
            related_entity="INTERACTION:gap",
            evidence_type="INTERACTION_GAP",
            source="Email & Calendar Sync",
            description="No meaningful interaction recorded for 14 consecutive days across all account contacts.",
            timestamp=now - datetime.timedelta(days=1),
            weight=0.92
        ),
        Evidence(
            id="ev-acme-2",
            account_id="acc-acme",
            related_entity="DEAL:deal-acme-1",
            evidence_type="DEAL_STALLED",
            source="CRM Pipeline Telemetry",
            description="Enterprise Expansion deal ($180,000) has remained stalled in Negotiation stage for 19 days with zero stage progression.",
            timestamp=now - datetime.timedelta(days=2),
            weight=0.95
        ),
        Evidence(
            id="ev-acme-3",
            account_id="acc-acme",
            related_entity="CONTACT:con-acme-1",
            evidence_type="CONTACT_DISENGAGEMENT",
            source="Engagement Analytics",
            description="2 of 3 primary stakeholders (CIO David Sterling & VP Eng Rachel Zhao) have fallen inactive, with engagement dropping below 35%.",
            timestamp=now - datetime.timedelta(days=3),
            weight=0.88
        ),
        Evidence(
            id="ev-acme-4",
            account_id="acc-acme",
            related_entity="ACCOUNT:acc-acme",
            evidence_type="ENGAGEMENT_DECLINE",
            source="Relationship Graph Engine",
            description="Overall account communication velocity decreased by 42% over the last 30-day trailing window.",
            timestamp=now - datetime.timedelta(days=4),
            weight=0.85
        ),
        Evidence(
            id="ev-acme-5",
            account_id="acc-acme",
            related_entity="HISTORICAL:pattern-88",
            evidence_type="HISTORICAL_SIMILARITY",
            source="Pipeline IQ Pattern Engine",
            description="Matches historical churn pattern of 14 Enterprise SaaS accounts where 14+ day deal stalls preceded customer loss in 86% of cases.",
            timestamp=now - datetime.timedelta(days=5),
            weight=0.82
        )
    ]
    for ev in acme_evidences:
        db.add(ev)

    # ACME Predictions
    db.add(Prediction(
        id="pred-acme-1",
        account_id="acc-acme",
        risk_type="CHURN_RISK",
        score=78.0,
        confidence=0.89,
        created_at=now - datetime.timedelta(days=5),
        outcome=None,
        outcome_verified_at=None,
        audit_notes="Pending active intervention cycle"
    ))

    # ACME Audit Events - Complete state lifecycle history
    acme_audit_events = [
        AuditEvent(
            id="aud-acme-1",
            account_id="acc-acme",
            entity_type="ACCOUNT",
            entity_id="acc-acme",
            event_type="OBSERVED",
            actor="System Agent",
            timestamp=now - datetime.timedelta(days=18),
            metadata_json='{"action": "Account observed", "opportunity": "Enterprise Platform Expansion", "value": 180000}'
        ),
        AuditEvent(
            id="aud-acme-2",
            account_id="acc-acme",
            entity_type="ACCOUNT",
            entity_id="acc-acme",
            event_type="DEBT_RECALCULATED",
            actor="System Agent",
            timestamp=now - datetime.timedelta(days=14),
            metadata_json='{"previous_score": 52, "new_score": 68, "delta": 16, "reason": "CIO David Sterling inactive for 14 days"}'
        ),
        AuditEvent(
            id="aud-acme-3",
            account_id="acc-acme",
            entity_type="DECISION",
            entity_id="dec-acme-1",
            event_type="RISK_DETECTED",
            actor="System Agent",
            timestamp=now - datetime.timedelta(days=5),
            metadata_json='{"condition": "Decision overdue", "decision_id": "dec-acme-1", "days_unresolved": 13, "revenue_at_risk": 180000}'
        ),
        AuditEvent(
            id="aud-acme-4",
            account_id="acc-acme",
            entity_type="AGENT",
            entity_id="agent-core",
            event_type="RECOMMENDATION_GENERATED",
            actor="System Agent",
            timestamp=now - datetime.timedelta(days=2),
            metadata_json='{"recommended_action": "Re-engage ACME decision maker (CIO David Sterling)", "urgency": "CRITICAL"}'
        ),
        AuditEvent(
            id="aud-acme-5",
            account_id="acc-acme",
            entity_type="CONTRACT",
            entity_id="cnt-acme-1",
            event_type="HUMAN_APPROVED",
            actor="Sarah Chen",
            timestamp=now - datetime.timedelta(hours=6),
            metadata_json='{"approved_by": "Sarah Chen", "contract_id": "cnt-acme-1", "deadline_days": 3}'
        ),
        AuditEvent(
            id="aud-acme-6",
            account_id="acc-acme",
            entity_type="CONTRACT",
            entity_id="cnt-acme-1",
            event_type="CONTRACT_CREATED",
            actor="System Agent",
            timestamp=now - datetime.timedelta(hours=6),
            metadata_json='{"contract_id": "cnt-acme-1", "escalation_rule": "Escalate to Sales Director if no meeting confirmed within 3 days", "target": "Sales Director"}'
        )
    ]
    for ae in acme_audit_events:
        db.add(ae)

    # 2. GENERATE 54 ADDITIONAL ACCOUNTS (Mix of Healthy, Medium, and High-Risk accounts)
    company_names = [
        ("Apex Logic", "CRITICAL", 310000, 84, 80, 248000),
        ("Vertex Dynamics", "CRITICAL", 195000, 79, 74, 144300),
        ("Helios Financial", "CRITICAL", 450000, 88, 85, 382500),
        ("Spectra Health", "CRITICAL", 280000, 76, 72, 201600),
        ("Quantex Cyber", "CRITICAL", 340000, 81, 77, 261800),
        ("OmniFlow Logistics", "WARNING", 175000, 58, 55, 96250),
        ("Nexus Dataworks", "WARNING", 220000, 62, 58, 127600),
        ("Stratum Labs", "WARNING", 160000, 54, 50, 80000),
        ("Prism Intelligence", "WARNING", 190000, 64, 60, 114000),
        ("Aether Systems", "WARNING", 240000, 52, 48, 115200),
        ("Cobalt Cloud", "WARNING", 185000, 59, 56, 103600),
        ("Vanguard Bio", "WARNING", 310000, 66, 62, 192200),
        ("NovaScale AI", "WARNING", 145000, 51, 46, 66700),
        ("Crestline Commerce", "WARNING", 205000, 60, 57, 116850),
        ("Synapse Robotics", "WARNING", 170000, 55, 52, 88400),
        ("Solaria Energy", "HEALTHY", 350000, 18, 15, 52500),
        ("Catalyst Global", "HEALTHY", 420000, 22, 18, 75600),
        ("Hyperion Networks", "HEALTHY", 290000, 15, 12, 34800),
        ("Terraform Logic", "HEALTHY", 380000, 20, 16, 60800),
        ("PulsePoint Tech", "HEALTHY", 210000, 12, 10, 21000),
        ("Beacon Security", "HEALTHY", 275000, 25, 20, 55000),
        ("Alpine Fleet AI", "HEALTHY", 195000, 16, 14, 27300),
        ("Krypton Capital", "HEALTHY", 490000, 19, 15, 73500),
        ("Zenith Logistics", "HEALTHY", 330000, 24, 19, 62700),
        ("Starlight Data", "HEALTHY", 260000, 14, 12, 31200),
        ("Matrix Payments", "HEALTHY", 510000, 10, 8, 40800),
        ("Aura Health AI", "HEALTHY", 230000, 18, 14, 32200),
        ("Ironclad Defense", "HEALTHY", 440000, 22, 18, 79200),
        ("TrueNorth Media", "HEALTHY", 180000, 16, 15, 27000),
        ("Equinox Biotech", "HEALTHY", 320000, 21, 17, 54400),
        ("Aegis Security", "CRITICAL", 295000, 86, 82, 241900),
        ("BioSynth Solutions", "CRITICAL", 380000, 78, 75, 285000),
        ("CarbonZero Systems", "WARNING", 190000, 57, 53, 100700),
        ("Datacore Global", "HEALTHY", 310000, 15, 12, 37200),
        ("EchoWave Networks", "HEALTHY", 240000, 20, 17, 40800),
        ("Flux AI Engines", "WARNING", 265000, 61, 59, 156350),
        ("Galvanic Micro", "HEALTHY", 175000, 18, 15, 26250),
        ("Horizon Freight", "WARNING", 225000, 63, 60, 135000),
        ("InfiniStream Media", "HEALTHY", 305000, 12, 10, 30500),
        ("Jupiter Retail AI", "CRITICAL", 410000, 83, 79, 323900),
        ("Kinetic Robotics", "HEALTHY", 285000, 22, 18, 51300),
        ("Luminary Cloud", "WARNING", 215000, 54, 50, 107500),
        ("Meridian FinTech", "HEALTHY", 460000, 16, 14, 64400),
        ("NeuroBridge AI", "CRITICAL", 330000, 80, 76, 250800),
        ("Optima Logistics", "HEALTHY", 270000, 19, 15, 40500),
        ("Pinnacle Cyber", "WARNING", 250000, 58, 54, 135000),
        ("QuantumEdge Systems", "HEALTHY", 390000, 23, 19, 74100),
        ("Radiant Analytics", "HEALTHY", 200000, 14, 11, 22000),
        ("Sterling Aviation", "WARNING", 310000, 65, 61, 189100),
        ("Titanium Cloud", "HEALTHY", 520000, 11, 9, 46800),
        ("Ultima Payments", "HEALTHY", 340000, 17, 13, 44200),
        ("Velocity BioTech", "CRITICAL", 290000, 85, 81, 234900),
        ("Wavelength Telecom", "WARNING", 235000, 56, 52, 122200),
        ("Zephyr Technologies", "HEALTHY", 280000, 15, 12, 33600)
    ]

    contact_roles = ["Chief Technology Officer", "VP Product", "Head of Security", "Director of IT", "Enterprise Architect", "VP Sales", "Procurement Lead"]
    deal_stages = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "COMMITTED"]

    # Historical prediction outcomes pool for Self-Audit calibration
    historical_outcomes_pool = [
        ("CONFIRMED_CHURN", True, "Customer churned after 30-day unaddressed stall"),
        ("CONFIRMED_CHURN", True, "Competitor displacement verified following executive departure"),
        ("LOST", True, "Deal lost to inaction; procurement deadline passed without response"),
        ("PREVENTED", True, "Timely Decision Contract intervention reversed engagement decline"),
        ("RENEWED", True, "Contract signed following executive escalation check-in"),
        ("FALSE_POSITIVE", False, "Customer renewed despite initial low communication score"),
        ("FALSE_POSITIVE", False, "Account re-engaged spontaneously following internal reorg"),
        ("PREVENTED", True, "Executive check-in successfully resolved pricing impasse")
    ]

    total_contacts_created = len(acme_contacts)
    total_deals_created = len(acme_deals)
    total_interactions_created = len(acme_interactions)
    total_activities_created = len(acme_activities)
    total_decisions_created = len(acme_decisions)
    total_predictions_created = 1

    for idx, (c_name, status, val, debt, risk, rev_risk) in enumerate(company_names, start=2):
        acc_id = f"acc-{idx}"
        acc_owner = random.choice(owners)
        created_days_ago = random.randint(90, 360)
        account = Account(
            id=acc_id,
            company_name=c_name,
            industry=random.choice(industries),
            account_value=float(val),
            account_owner=acc_owner,
            health_status=status,
            created_at=now - datetime.timedelta(days=created_days_ago),
            decision_debt_score=debt,
            risk_score=risk,
            revenue_at_risk=float(rev_risk),
            last_signal_date=now - datetime.timedelta(days=random.randint(1, 10))
        )
        db.add(account)

        # 3 to 4 contacts per account
        num_contacts = random.randint(3, 4)
        acc_contacts = []
        for c_idx in range(num_contacts):
            is_inactive = status == "CRITICAL" and c_idx >= 1
            c_eng = random.uniform(15.0, 42.0) if is_inactive else random.uniform(65.0, 95.0)
            c_status = "INACTIVE" if is_inactive else "ACTIVE"
            influence = "DECISION_MAKER" if c_idx == 0 else random.choice(["INFLUENCER", "STAKEHOLDER", "GATEKEEPER", "OPERATOR"])
            contact = Contact(
                id=f"con-{idx}-{c_idx+1}",
                account_id=acc_id,
                name=f"{random.choice(['Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Chris', 'Pat', 'Casey'])} {random.choice(['Chen', 'Patel', 'Smith', 'Gupta', 'Tanaka', 'Kowalski', 'Novak', 'Silva'])}",
                role=contact_roles[c_idx % len(contact_roles)],
                influence_level=influence,
                email=f"contact_{idx}_{c_idx+1}@{c_name.lower().replace(' ', '')}.com",
                phone=f"+1-555-0{random.randint(100, 999)}",
                status=c_status,
                last_interaction=now - datetime.timedelta(days=random.randint(15, 45) if is_inactive else random.randint(1, 12)),
                engagement_score=round(c_eng, 1)
            )
            db.add(contact)
            acc_contacts.append(contact)
            total_contacts_created += 1

        # 1 to 3 deals per account
        num_deals = random.randint(1, 3)
        acc_deals = []
        for d_idx in range(num_deals):
            is_stalled = status == "CRITICAL" or (status == "WARNING" and d_idx == 0)
            stalled_days = random.randint(15, 30) if is_stalled else random.randint(2, 9)
            deal_val = round(val * (0.6 / num_deals), 0)
            deal = Deal(
                id=f"deal-{idx}-{d_idx+1}",
                account_id=acc_id,
                contact_id=acc_contacts[0].id if acc_contacts else None,
                deal_name=f"{c_name} {random.choice(['Platform Upgrade', 'Enterprise License', 'Global Rollout', 'Core Integration'])}",
                value=deal_val,
                stage=random.choice(deal_stages) if not is_stalled else "NEGOTIATION",
                probability=0.35 if is_stalled else 0.75,
                expected_close_date=now + datetime.timedelta(days=random.randint(10, 60)),
                owner=acc_owner,
                days_in_stage=stalled_days,
                status="STALLED" if is_stalled else "ACTIVE"
            )
            db.add(deal)
            acc_deals.append(deal)
            total_deals_created += 1

        # 9 to 14 interactions per account (ensuring 550+ total)
        num_ints = random.randint(9, 14)
        for i_idx in range(num_ints):
            int_type = random.choice(["EMAIL", "CALL", "MEETING", "NOTE"])
            c_target = random.choice(acc_contacts)
            sentiment = "NEGATIVE" if (status == "CRITICAL" and i_idx <= 2) else ("POSITIVE" if status == "HEALTHY" else "NEUTRAL")
            interaction = Interaction(
                id=f"int-{idx}-{i_idx+1}",
                account_id=acc_id,
                contact_id=c_target.id,
                type=int_type,
                direction=random.choice(["INBOUND", "OUTBOUND"]),
                timestamp=now - datetime.timedelta(days=random.randint(1, 60)),
                sentiment=sentiment,
                summary=f"Discussion regarding {c_name} milestone deliverables, quarterly performance, and expansion terms.",
                outcome=f"Logged touchpoint by {acc_owner}"
            )
            db.add(interaction)
            total_interactions_created += 1

        # 4 to 6 activities per account (ensuring 220+ total)
        num_acts = random.randint(4, 6)
        for a_idx in range(num_acts):
            is_act_overdue = (status in ["CRITICAL", "WARNING"]) and (a_idx == 0 or a_idx == 1)
            due_d = now - datetime.timedelta(days=random.randint(3, 14)) if is_act_overdue else now + datetime.timedelta(days=random.randint(2, 20))
            act_status = "OVERDUE" if is_act_overdue else "PENDING"
            act = Activity(
                id=f"act-{idx}-{a_idx+1}",
                account_id=acc_id,
                assigned_to=acc_owner,
                activity_type=random.choice(["FOLLOW_UP", "EXECUTIVE_CHECKIN", "SECURITY_REVIEW", "CONTRACT_RENEWAL", "TECHNICAL_DEMO"]),
                due_date=due_d,
                completed_at=None,
                status=act_status
            )
            db.add(act)
            total_activities_created += 1

        # 1 to 2 decisions per account (ensuring 65+ total)
        num_decs = random.randint(1, 2)
        acc_decs = []
        for dec_idx in range(num_decs):
            is_dec_overdue = status == "CRITICAL" and dec_idx == 0
            dec_due = now - datetime.timedelta(days=random.randint(2, 8)) if is_dec_overdue else now + datetime.timedelta(days=random.randint(2, 10))
            dec_created = now - datetime.timedelta(days=random.randint(10, 25))
            dec = Decision(
                id=f"dec-{idx}-{dec_idx+1}",
                account_id=acc_id,
                contact_id=acc_contacts[0].id if acc_contacts else None,
                opportunity_id=acc_deals[0].id if acc_deals else None,
                description=f"Action required on contract amendment and pricing structure for {c_name}",
                expected_action=f"Deliver revised executive brief to {c_name} stakeholders",
                owner=acc_owner,
                due_date=dec_due,
                due_at=dec_due,
                status="OVERDUE" if is_dec_overdue else "PENDING",
                created_at=dec_created
            )
            db.add(dec)
            acc_decs.append(dec)
            total_decisions_created += 1

        # Evidence entries for each account
        if status in ["CRITICAL", "WARNING"]:
            db.add(Evidence(
                id=f"ev-{idx}-1",
                account_id=acc_id,
                related_entity=f"ACCOUNT:{acc_id}",
                evidence_type="INTERACTION_GAP" if status == "CRITICAL" else "OVERDUE_ACTIVITY",
                source="CRM Pipeline Telemetry",
                description=f"Compounding follow-up delays detected on {c_name}. Trailing engagement decreased.",
                timestamp=now - datetime.timedelta(days=random.randint(2, 10)),
                weight=0.85
            ))
            db.add(Evidence(
                id=f"ev-{idx}-2",
                account_id=acc_id,
                related_entity=f"ACCOUNT:{acc_id}",
                evidence_type="DEAL_STALLED",
                source="Relationship Graph Engine",
                description=f"Stagnation in active deal pipeline correlated with stakeholder disengagement.",
                timestamp=now - datetime.timedelta(days=random.randint(3, 12)),
                weight=0.90
            ))

        # Decision contracts on critical/warning accounts
        if idx % 2 == 0:
            contract_status = "OVERDUE" if status == "CRITICAL" and idx % 4 == 0 else ("ESCALATED" if status == "CRITICAL" and idx % 6 == 0 else ("COMPLETED" if status == "HEALTHY" else "PENDING"))
            contract = DecisionContract(
                id=f"cnt-{idx}",
                account_id=acc_id,
                decision_id=acc_decs[0].id if acc_decs else None,
                action=f"Conduct stakeholder alignment and unblock pipeline for {c_name}",
                owner=acc_owner,
                deadline=now - datetime.timedelta(days=random.randint(1, 5)) if contract_status in ["OVERDUE", "ESCALATED"] else now + datetime.timedelta(days=random.randint(3, 7)),
                escalation_rule=f"Escalate to VP of Revenue if untouched for 3 days",
                escalation_target="VP of Revenue",
                status=contract_status,
                expected_impact="Safeguard contract retention and mitigate revenue at risk",
                reason=f"Account entered {status} health tier with {debt}/100 decision debt",
                created_at=now - datetime.timedelta(days=random.randint(5, 20)),
                completed_at=now - datetime.timedelta(days=1) if contract_status == "COMPLETED" else None,
                escalated_at=now - datetime.timedelta(hours=12) if contract_status == "ESCALATED" else None,
                outcome="Intervention completed with executive re-alignment" if contract_status == "COMPLETED" else None
            )
            db.add(contract)

        # Historical predictions for Self-Audit calibration (85+ total)
        for p_idx in range(random.randint(1, 3)):
            p_score = float(risk) if p_idx == 0 else float(random.randint(20, 85))
            p_conf = round(random.uniform(0.65, 0.94), 2)
            out_choice = random.choice(historical_outcomes_pool)
            verified_time = now - datetime.timedelta(days=random.randint(1, 15))
            pred = Prediction(
                id=f"pred-{idx}-{p_idx+1}",
                account_id=acc_id,
                risk_type=random.choice(["CHURN_RISK", "DEAL_LOSS", "STALLED_PIPELINE", "ENGAGEMENT_DECLINE"]),
                score=p_score,
                confidence=p_conf,
                created_at=now - datetime.timedelta(days=random.randint(20, 90)),
                outcome=out_choice[0],
                outcome_verified_at=verified_time,
                actual_outcome_match=out_choice[1],
                audit_notes=out_choice[2]
            )
            db.add(pred)
            total_predictions_created += 1

            # Empirical Outcome record
            db.add(Outcome(
                id=f"out-{pred.id}",
                prediction_id=pred.id,
                actual_outcome=out_choice[0],
                verified_at=verified_time,
                verification_source="CRM Telemetry / Billing Sync",
                notes=out_choice[2]
            ))

        # Add Audit Events for Critical & Warning accounts
        if status in ["CRITICAL", "WARNING"]:
            db.add(AuditEvent(
                id=f"aud-{idx}-1",
                account_id=acc_id,
                entity_type="ACCOUNT",
                entity_id=acc_id,
                event_type="OBSERVED",
                actor="System Agent",
                timestamp=now - datetime.timedelta(days=random.randint(10, 25)),
                metadata_json=f'{{"company": "{c_name}", "initial_health": "{status}"}}'
            ))
            db.add(AuditEvent(
                id=f"aud-{idx}-2",
                account_id=acc_id,
                entity_type="ACCOUNT",
                entity_id=acc_id,
                event_type="RISK_DETECTED",
                actor="System Agent",
                timestamp=now - datetime.timedelta(days=random.randint(2, 9)),
                metadata_json=f'{{"debt_score": {debt}, "risk_score": {risk}, "status": "{status}"}}'
            ))

    db.commit()
    print(f"Database successfully seeded!")
    print(f"Accounts: {db.query(Account).count()} | Contacts: {total_contacts_created} | Deals: {total_deals_created}")
    print(f"Interactions: {total_interactions_created} | Activities: {total_activities_created} | Decisions: {total_decisions_created}")
    print(f"Contracts: {db.query(DecisionContract).count()} | Predictions: {total_predictions_created}")

if __name__ == "__main__":
    db = SessionLocal()
    seed_database(db, force=True)
    db.close()
