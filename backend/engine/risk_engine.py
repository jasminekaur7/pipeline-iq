from datetime import datetime
from typing import Dict, Any, List
from backend.models.database import Account, Deal, Contact, Interaction, Activity
from backend.models.schemas import RiskBreakdown

def calculate_account_risks(account: Account, current_time: datetime = None) -> RiskBreakdown:
    """
    Computes grounded business risks:
    - churn_risk_score (0-100)
    - deal_loss_risk_score (0-100)
    - stalled_pipeline_score (0-100)
    - revenue_at_risk ($)
    - confidence (0.0 - 1.0)
    """
    if current_time is None:
        current_time = datetime.utcnow()

    # 1. Churn Risk
    # Based on engagement score of contacts, days since last interaction, sentiment
    churn_factors = []
    
    contacts = account.contacts or []
    if contacts:
        avg_engagement = sum(c.engagement_score for c in contacts) / len(contacts)
        churn_factors.append(max(0.0, (100.0 - avg_engagement) * 0.45))
    else:
        churn_factors.append(50.0)

    interactions = sorted(account.interactions or [], key=lambda i: i.timestamp, reverse=True)
    if interactions:
        gap_days = (current_time - interactions[0].timestamp).days
        churn_factors.append(min(35.0, gap_days * 1.5))
        
        # Check negative sentiment in last 3 interactions
        recent_negative = sum(1 for i in interactions[:3] if i.sentiment == "NEGATIVE")
        churn_factors.append(recent_negative * 10.0)
    else:
        churn_factors.append(30.0)

    churn_score = int(min(100, sum(churn_factors)))

    # 2. Deal Loss Risk & Stalled Pipeline
    deals = [d for d in account.deals or [] if d.status in ["ACTIVE", "STALLED"]]
    if deals:
        max_stalled_days = max(d.days_in_stage for d in deals)
        stalled_pipeline_score = int(min(100, max_stalled_days * 3.5 + (15 if any(d.status == "STALLED" for d in deals) else 0)))
        
        # Deal loss risk incorporates probability, days stalled, and contact health
        avg_prob = sum(d.probability for d in deals) / len(deals)
        deal_loss_risk_score = int(min(100, (1.0 - avg_prob) * 50 + stalled_pipeline_score * 0.4))
    else:
        stalled_pipeline_score = 0
        deal_loss_risk_score = 15

    # 3. Overall Risk Score
    overall_risk_score = int(min(100, round(
        churn_score * 0.45 + 
        deal_loss_risk_score * 0.35 + 
        stalled_pipeline_score * 0.20
    )))

    # 4. Revenue at Risk ($)
    # Total active pipeline value weighted by risk score
    total_pipeline = sum(d.value for d in deals)
    revenue_at_risk = round(total_pipeline * (overall_risk_score / 100.0), 2)

    # 5. Confidence Calculation
    # High confidence when we have multiple contacts, logged interactions, and active deals
    data_points = len(contacts) + len(interactions) + len(deals) + len(account.activities or [])
    confidence = min(0.95, max(0.60, 0.60 + (data_points / 30.0) * 0.35))

    # Determine primary threat
    threats = [
        ("High Churn Risk from Stakeholder Disengagement", churn_score),
        ("High Deal Loss Probability on Pipeline Opportunities", deal_loss_risk_score),
        ("Stalled Pipeline & Delayed Decision Velocity", stalled_pipeline_score)
    ]
    primary_threat = max(threats, key=lambda t: t[1])[0]

    return RiskBreakdown(
        churn_risk_score=churn_score,
        deal_loss_risk_score=deal_loss_risk_score,
        stalled_pipeline_score=stalled_pipeline_score,
        overall_risk_score=overall_risk_score,
        confidence=round(confidence, 2),
        revenue_at_risk=revenue_at_risk,
        primary_threat=primary_threat
    )
