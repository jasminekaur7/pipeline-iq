from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models.database import Account, Contact, Deal, Activity, Decision, Interaction
from backend.models.schemas import GraphData, GraphNode, GraphEdge

def build_account_relationship_graph(account: Account) -> GraphData:
    """
    Constructs an explainable relationship graph showing the Account,
    its Contacts (with influence level), Deals, Activities, Decisions, and Interactions,
    and highlights the deterministic ripple-effect path causing Decision Debt and Revenue at Risk.
    """
    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []
    critical_path: List[str] = []
    affected_stakeholders: List[str] = []

    # 1. Root Node: Account
    acc_risk_level = "CRITICAL" if account.risk_score >= 70 else ("WARNING" if account.risk_score >= 40 else "NORMAL")
    nodes.append(GraphNode(
        id=f"acc-{account.id}",
        label=account.company_name,
        type="ACCOUNT",
        status=account.health_status,
        value=account.account_value,
        risk_level=acc_risk_level,
        details={
            "industry": account.industry,
            "owner": account.account_owner,
            "decision_debt": account.decision_debt_score,
            "revenue_at_risk": account.revenue_at_risk
        }
    ))
    critical_path.append(f"acc-{account.id}")

    # 2. Contact Nodes & Edges
    primary_inactive_contact_id = None
    for c in account.contacts or []:
        is_dm = getattr(c, "influence_level", "") == "DECISION_MAKER"
        is_at_risk = c.status in ["INACTIVE", "AT_RISK"] or c.engagement_score < 45
        c_risk_level = "CRITICAL" if (is_dm and is_at_risk) else ("WARNING" if is_at_risk else "NORMAL")
        node_id = f"con-{c.id}"
        
        influence_display = f" [{c.influence_level}]" if getattr(c, "influence_level", None) else ""
        nodes.append(GraphNode(
            id=node_id,
            label=f"{c.name} ({c.role}){influence_display}",
            type="CONTACT",
            status=c.status,
            risk_level=c_risk_level,
            details={
                "email": c.email,
                "phone": c.phone,
                "role": c.role,
                "influence_level": getattr(c, "influence_level", "STAKEHOLDER"),
                "engagement_score": c.engagement_score,
                "status": c.status
            }
        ))
        
        if is_at_risk:
            affected_stakeholders.append(f"{c.name} ({c.role})")

        if is_at_risk and not primary_inactive_contact_id:
            primary_inactive_contact_id = node_id

        edges.append(GraphEdge(
            source=f"acc-{account.id}",
            target=node_id,
            relationship="HAS_CONTACT",
            is_risk_path=is_at_risk
        ))

    # 3. Deal / Opportunity Nodes & Edges
    primary_stalled_deal_id = None
    for d in account.deals or []:
        is_stalled = d.status == "STALLED" or d.days_in_stage >= 14
        d_risk_level = "CRITICAL" if d.days_in_stage >= 18 else ("WARNING" if is_stalled else "NORMAL")
        node_id = f"deal-{d.id}"
        nodes.append(GraphNode(
            id=node_id,
            label=f"{d.deal_name} (${d.value:,.0f})",
            type="DEAL",
            status=d.stage,
            value=d.value,
            risk_level=d_risk_level,
            details={
                "value": d.value,
                "stage": d.stage,
                "days_in_stage": d.days_in_stage,
                "probability": d.probability,
                "owner": d.owner
            }
        ))
        if is_stalled and not primary_stalled_deal_id:
            primary_stalled_deal_id = node_id

        edges.append(GraphEdge(
            source=f"acc-{account.id}",
            target=node_id,
            relationship="HAS_DEAL",
            is_risk_path=is_stalled
        ))

        # Influence edge from primary contact to deal
        if account.contacts:
            edges.append(GraphEdge(
                source=f"con-{account.contacts[0].id}",
                target=node_id,
                relationship="INFLUENCES",
                is_risk_path=is_stalled
            ))

    # 4. Decision Nodes & Edges
    primary_unresolved_dec_id = None
    for dec in account.decisions or []:
        is_unresolved = dec.status in ["OVERDUE", "PENDING"]
        dec_risk = "CRITICAL" if dec.status == "OVERDUE" else ("WARNING" if dec.status == "PENDING" else "NORMAL")
        node_id = f"dec-{dec.id}"
        nodes.append(GraphNode(
            id=node_id,
            label=f"Decision: {dec.expected_action[:30]}...",
            type="DECISION",
            status=dec.status,
            risk_level=dec_risk,
            details={
                "description": dec.description,
                "action": dec.expected_action,
                "owner": dec.owner,
                "status": dec.status
            }
        ))
        if is_unresolved and not primary_unresolved_dec_id:
            primary_unresolved_dec_id = node_id

        edges.append(GraphEdge(
            source=f"acc-{account.id}",
            target=node_id,
            relationship="HAS_DECISION",
            is_risk_path=is_unresolved
        ))

        # Link decision to associated contact if present
        if dec.contact_id:
            edges.append(GraphEdge(
                source=f"con-{dec.contact_id}",
                target=node_id,
                relationship="STAKEHOLDER_ON",
                is_risk_path=is_unresolved
            ))

        # Link decision to associated deal/opportunity if present
        if dec.opportunity_id:
            edges.append(GraphEdge(
                source=node_id,
                target=f"deal-{dec.opportunity_id}",
                relationship="AFFECTS_OPPORTUNITY",
                is_risk_path=is_stalled
            ))

    # 5. Activity Nodes & Edges (up to 3 recent)
    for a in (account.activities or [])[:3]:
        is_overdue = a.status in ["PENDING", "OVERDUE"]
        act_risk = "CRITICAL" if a.status == "OVERDUE" else ("WARNING" if is_overdue else "NORMAL")
        node_id = f"act-{a.id}"
        nodes.append(GraphNode(
            id=node_id,
            label=f"{a.activity_type.replace('_', ' ').title()}",
            type="ACTIVITY",
            status=a.status,
            risk_level=act_risk,
            details={
                "assigned_to": a.assigned_to,
                "due_date": a.due_date.isoformat() if a.due_date else None,
                "status": a.status
            }
        ))
        edges.append(GraphEdge(
            source=f"acc-{account.id}",
            target=node_id,
            relationship="RELATES_TO",
            is_risk_path=a.status == "OVERDUE"
        ))

    # 6. Interaction Nodes (up to 2 recent touchpoints)
    for i in (sorted(account.interactions or [], key=lambda x: x.timestamp, reverse=True))[:2]:
        node_id = f"int-{i.id}"
        nodes.append(GraphNode(
            id=node_id,
            label=f"{i.type} ({i.direction or 'OUTBOUND'})",
            type="INTERACTION",
            status=i.sentiment,
            risk_level="WARNING" if i.sentiment == "NEGATIVE" else "NORMAL",
            details={
                "summary": i.summary,
                "timestamp": i.timestamp.isoformat() if i.timestamp else None,
                "outcome": i.outcome
            }
        ))
        edges.append(GraphEdge(
            source=f"acc-{account.id}",
            target=node_id,
            relationship="HAS_INTERACTION",
            is_risk_path=False
        ))
        if i.contact_id:
            edges.append(GraphEdge(
                source=node_id,
                target=f"con-{i.contact_id}",
                relationship="WITH_CONTACT",
                is_risk_path=False
            ))

    # 7. Trace Critical Ripple Path
    ripple_elements = []
    if primary_unresolved_dec_id:
        critical_path.append(primary_unresolved_dec_id)
        ripple_elements.append("Unresolved Business Decision")

    if primary_inactive_contact_id:
        critical_path.append(primary_inactive_contact_id)
        ripple_elements.append("Inactive Stakeholder Disengagement")

    ripple_elements.append("Account Engagement Velocity Drop")

    if primary_stalled_deal_id:
        critical_path.append(primary_stalled_deal_id)
        ripple_elements.append("Pipeline Deal Deadlock")

    ripple_elements.append(f"${account.revenue_at_risk:,.0f} Revenue at Risk")
    ripple_summary = " -> ".join(ripple_elements)

    return GraphData(
        nodes=nodes,
        edges=edges,
        ripple_summary=ripple_summary,
        critical_path=critical_path,
        downstream_exposure=account.revenue_at_risk,
        affected_stakeholders=affected_stakeholders
    )

def get_account_graph(account_id: str, db: Session) -> GraphData:
    """Retrieves account and returns its full relationship graph."""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise ValueError(f"Account {account_id} not found")
    return build_account_relationship_graph(account)

def get_connected_stakeholders(account_id: str, db: Session) -> List[Dict[str, Any]]:
    """
    Returns structured list of stakeholders connected to the account,
    identifying primary decision makers, engagement scores, and disengagement flags.
    """
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return []

    stakeholders = []
    for c in account.contacts or []:
        is_dm = getattr(c, "influence_level", "") == "DECISION_MAKER" or "CIO" in (c.role or "") or "VP" in (c.role or "")
        is_inactive = c.status in ["INACTIVE", "AT_RISK"] or c.engagement_score < 45
        days_since_interaction = (datetime.utcnow() - c.last_interaction).days if c.last_interaction else 999

        stakeholders.append({
            "id": c.id,
            "name": c.name,
            "role": c.role,
            "influence_level": getattr(c, "influence_level", "STAKEHOLDER"),
            "email": c.email,
            "phone": c.phone,
            "status": c.status,
            "engagement_score": c.engagement_score,
            "is_decision_maker": is_dm,
            "is_inactive": is_inactive,
            "days_since_last_interaction": days_since_interaction,
            "influenced_deal_count": len(account.deals) if is_dm else 1
        })
    return stakeholders

def get_decision_ripple_paths(decision_id: str, db: Session) -> Dict[str, Any]:
    """
    Traces the downstream ripple impact of a specific business decision:
    Decision -> Stakeholder -> Opportunity -> Account Exposure -> Escalation Urgency.
    """
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise ValueError(f"Decision {decision_id} not found")

    account = decision.account
    now = datetime.utcnow()
    created_at = decision.created_at or (account.created_at if account else now)
    days_unresolved = (now - created_at).days

    # Identify connected contact / stakeholder
    contact = decision.contact
    if not contact and account and account.contacts:
        contact = account.contacts[0]

    # Identify connected opportunity / deal
    deal = decision.deal
    if not deal and account and account.deals:
        deal = max(account.deals, key=lambda d: d.value)

    revenue_exposed = deal.value if deal else (account.revenue_at_risk if account else 0.0)
    
    # Calculate relationship impact metrics
    contact_name = contact.name if contact else "Primary Lead"
    contact_role = contact.role if contact else "Decision Maker"
    contact_inactive_days = (now - contact.last_interaction).days if (contact and contact.last_interaction) else days_unresolved

    affected_stakeholders_list = [f"{c.name} ({c.role})" for c in (account.contacts or [])] if account else []
    
    is_overdue = decision.status == "OVERDUE" or (decision.due_date and decision.due_date < now)
    escalation_urgency = "IMMEDIATE" if is_overdue or days_unresolved >= 14 else ("HIGH" if days_unresolved >= 7 else "MODERATE")

    ripple_path = [
        f"Unresolved Decision: {decision.expected_action}",
        f"Stakeholder Dependency: {contact_name} ({contact_role}) - {contact_inactive_days}d inactive",
        f"Connected Opportunity: {deal.deal_name if deal else 'Pipeline'} (${revenue_exposed:,.0f})",
        f"Downstream Exposure: ${revenue_exposed:,.0f} Revenue at Risk"
    ]

    human_summary = (
        f"{account.company_name if account else 'Account'}'s unresolved decision ('{decision.expected_action}') "
        f"is connected to {len(affected_stakeholders_list)} stakeholder{'s' if len(affected_stakeholders_list) != 1 else ''} "
        f"and a ${revenue_exposed:,.0f} opportunity. "
        f"The primary decision maker ({contact_name}) has been inactive for {contact_inactive_days} days, "
        f"increasing downstream pipeline exposure."
    )

    return {
        "decision_id": decision.id,
        "account_id": account.id if account else None,
        "company_name": account.company_name if account else "Unknown",
        "description": decision.description,
        "expected_action": decision.expected_action,
        "owner": decision.owner,
        "status": decision.status,
        "days_unresolved": days_unresolved,
        "is_overdue": is_overdue,
        "escalation_urgency": escalation_urgency,
        "revenue_exposed": revenue_exposed,
        "affected_stakeholders": affected_stakeholders_list,
        "ripple_path": ripple_path,
        "human_summary": human_summary
    }

def calculate_relationship_impact(decision_id: str, db: Session) -> Dict[str, Any]:
    """
    Deterministically computes relationship impact score (0-100) based on:
    - Number of affected stakeholders
    - Inactivity of primary decision maker
    - Interaction communication drop
    - Compounding delay
    """
    ripple = get_decision_ripple_paths(decision_id, db)
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    account = decision.account if decision else None

    score = 0
    factors = []

    if account:
        contacts = account.contacts or []
        inactive_contacts = [c for c in contacts if c.status in ["INACTIVE", "AT_RISK"] or c.engagement_score < 45]
        
        # Primary decision maker inactive: +35 pts
        dm_inactive = any(
            (getattr(c, "influence_level", "") == "DECISION_MAKER" or "CIO" in (c.role or "") or "VP" in (c.role or ""))
            and (c.status in ["INACTIVE", "AT_RISK"] or c.engagement_score < 45)
            for c in contacts
        )
        if dm_inactive:
            score += 35
            factors.append("Primary decision maker inactive (+35 pts)")

        # Additional inactive stakeholders: +20 pts
        if len(inactive_contacts) >= 2:
            score += 20
            factors.append(f"{len(inactive_contacts)} key stakeholders disengaged (+20 pts)")

        # Days unresolved: up to +25 pts
        if ripple["days_unresolved"] >= 14:
            score += 25
            factors.append(f"{ripple['days_unresolved']} days unresolved (+25 pts)")
        else:
            pts = int(ripple["days_unresolved"] * 1.5)
            score += pts
            factors.append(f"{ripple['days_unresolved']} days unresolved (+{pts} pts)")

        # Overdue deadline: +20 pts
        if ripple["is_overdue"]:
            score += 20
            factors.append("Deadline overdue (+20 pts)")

    final_score = min(100, score)
    severity = "CRITICAL" if final_score >= 70 else ("HIGH" if final_score >= 45 else ("MODERATE" if final_score >= 25 else "LOW"))

    return {
        "decision_id": decision_id,
        "relationship_impact_score": final_score,
        "severity": severity,
        "factors": factors,
        "summary": f"Relationship impact is {severity} ({final_score}/100) due to {len(factors)} compounding disengagement factors."
    }

def calculate_account_exposure(account_id: str, db: Session) -> Dict[str, Any]:
    """
    Calculates aggregate downstream pipeline exposure, unresolved decisions count,
    inactive stakeholders count, and identifies the highest risk decision for the account.
    """
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise ValueError(f"Account {account_id} not found")

    unresolved_decisions = [d for d in (account.decisions or []) if d.status in ["PENDING", "OVERDUE"]]
    inactive_contacts = [c for c in (account.contacts or []) if c.status in ["INACTIVE", "AT_RISK"] or c.engagement_score < 45]
    total_pipeline = sum(d.value for d in (account.deals or []) if d.status in ["ACTIVE", "STALLED"])

    highest_exposure_decision = None
    if unresolved_decisions:
        # Sort by overdue status, then creation age
        sorted_decs = sorted(unresolved_decisions, key=lambda d: (1 if d.status == "OVERDUE" else 0, -(d.created_at.timestamp() if d.created_at else 0)), reverse=True)
        highest_exposure_decision = {
            "id": sorted_decs[0].id,
            "action": sorted_decs[0].expected_action,
            "status": sorted_decs[0].status,
            "due_date": sorted_decs[0].due_date.isoformat() if sorted_decs[0].due_date else None
        }

    return {
        "account_id": account.id,
        "company_name": account.company_name,
        "total_pipeline_value": total_pipeline,
        "revenue_at_risk": account.revenue_at_risk,
        "decision_debt_score": account.decision_debt_score,
        "health_status": account.health_status,
        "unresolved_decision_count": len(unresolved_decisions),
        "inactive_stakeholder_count": len(inactive_contacts),
        "total_stakeholder_count": len(account.contacts or []),
        "highest_exposure_decision": highest_exposure_decision
    }

def get_accounts_with_multiple_inactive_stakeholders(db: Session) -> List[Dict[str, Any]]:
    """Returns accounts that have 2 or more inactive/at-risk stakeholders."""
    results = []
    for acc in db.query(Account).all():
        inactives = [c for c in (acc.contacts or []) if c.status in ["INACTIVE", "AT_RISK"] or c.engagement_score < 45]
        if len(inactives) >= 2:
            results.append({
                "account_id": acc.id,
                "company_name": acc.company_name,
                "inactive_count": len(inactives),
                "total_contacts": len(acc.contacts or []),
                "decision_debt_score": acc.decision_debt_score,
                "revenue_at_risk": acc.revenue_at_risk,
                "owner": acc.account_owner
            })
    results.sort(key=lambda x: x["inactive_count"], reverse=True)
    return results

def get_opportunities_connected_to_unresolved_decisions(db: Session) -> List[Dict[str, Any]]:
    """Returns opportunities that are directly tied to unresolved business decisions."""
    results = []
    unresolved_decisions = db.query(Decision).filter(Decision.status.in_(["PENDING", "OVERDUE"])).all()
    for dec in unresolved_decisions:
        acc = dec.account
        deal = dec.deal or (acc.deals[0] if (acc and acc.deals) else None)
        if deal:
            results.append({
                "deal_id": deal.id,
                "deal_name": deal.deal_name,
                "value": deal.value,
                "stage": deal.stage,
                "decision_id": dec.id,
                "decision_action": dec.expected_action,
                "decision_status": dec.status,
                "account_id": acc.id if acc else None,
                "company_name": acc.company_name if acc else "Unknown"
            })
    return results

def get_unresolved_decision_with_highest_exposure(db: Session) -> Optional[Dict[str, Any]]:
    """Finds the unresolved decision with the greatest downstream monetary exposure."""
    unresolved_decisions = db.query(Decision).filter(Decision.status.in_(["PENDING", "OVERDUE"])).all()
    if not unresolved_decisions:
        return None

    def exposure_score(dec):
        acc = dec.account
        deal = dec.deal or (acc.deals[0] if (acc and acc.deals) else None)
        val = deal.value if deal else (acc.revenue_at_risk if acc else 0.0)
        is_overdue = 1.5 if dec.status == "OVERDUE" else 1.0
        return val * is_overdue

    top_dec = max(unresolved_decisions, key=exposure_score)
    return get_decision_ripple_paths(top_dec.id, db)
