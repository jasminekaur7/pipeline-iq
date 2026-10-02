export interface Contact {
  id: string;
  account_id: string;
  name: string;
  role: string;
  influence_level?: 'DECISION_MAKER' | 'INFLUENCER' | 'STAKEHOLDER' | 'GATEKEEPER' | 'OPERATOR' | string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'AT_RISK';
  last_interaction: string;
  engagement_score: number;
}

export interface Deal {
  id: string;
  account_id: string;
  contact_id?: string;
  deal_name: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date: string;
  owner: string;
  days_in_stage: number;
  status: 'ACTIVE' | 'STALLED' | 'WON' | 'LOST';
}

export interface Interaction {
  id: string;
  account_id: string;
  contact_id?: string;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE';
  direction?: 'INBOUND' | 'OUTBOUND';
  timestamp: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  summary: string;
  outcome: string;
}

export interface Activity {
  id: string;
  account_id: string;
  assigned_to: string;
  activity_type: string;
  due_date: string;
  completed_at?: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
}

export interface Decision {
  id: string;
  account_id: string;
  contact_id?: string;
  opportunity_id?: string;
  description: string;
  expected_action: string;
  owner: string;
  due_date: string;
  due_at?: string;
  completed_at?: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'ESCALATED';
  created_at: string;
}

export interface DecisionContract {
  id: string;
  account_id: string;
  decision_id?: string;
  company_name?: string;
  action: string;
  owner: string;
  deadline: string;
  escalation_rule: string;
  escalation_target?: string;
  status: 'PENDING' | 'DUE_SOON' | 'OVERDUE' | 'ESCALATED' | 'COMPLETED' | 'SNOOZED';
  expected_impact: string;
  reason: string;
  created_at: string;
  completed_at?: string;
  escalated_at?: string;
  outcome?: string;
}

export interface Evidence {
  id: string;
  related_entity: string;
  account_id: string;
  evidence_type: string;
  source: string;
  description: string;
  timestamp: string;
  weight: number;
}

export interface Outcome {
  id: string;
  prediction_id: string;
  actual_outcome: string;
  verified_at: string;
  verification_source: string;
  notes?: string;
}

export interface AuditEvent {
  id: string;
  account_id?: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  timestamp: string;
  actor: string;
  metadata_json?: string;
}

export interface TimelineItem {
  id: string;
  item_type: 'INTERACTION' | 'DECISION' | 'ACTIVITY' | 'CONTRACT' | 'AUDIT_EVENT';
  timestamp: string;
  title: string;
  description: string;
  actor_or_owner: string;
  status?: string;
  sentiment?: string;
}

export interface Prediction {
  id: string;
  account_id: string;
  risk_type: string;
  score: number;
  confidence: number;
  created_at: string;
  outcome?: string;
  outcome_verified_at?: string;
  actual_outcome_match?: boolean;
  audit_notes?: string;
}

export interface DecisionDebtContributor {
  category: string;
  points: number;
  description: string;
  entity_id?: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface DecisionDebtBreakdown {
  score: number;
  severity: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  contributors: DecisionDebtContributor[];
  revenue_impact: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

export interface RiskBreakdown {
  churn_risk_score: number;
  deal_loss_risk_score: number;
  stalled_pipeline_score: number;
  overall_risk_score: number;
  confidence: number;
  revenue_at_risk: number;
  primary_threat: string;
}

export interface Account {
  id: string;
  company_name: string;
  industry: string;
  account_value: number;
  account_owner: string;
  health_status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  created_at: string;
  updated_at?: string;
  decision_debt_score: number;
  risk_score: number;
  revenue_at_risk: number;
  deal_count?: number;
  contact_count?: number;
  overdue_count?: number;
}

export interface AccountDetail {
  account: Account;
  contacts: Contact[];
  deals: Deal[];
  interactions: Interaction[];
  activities: Activity[];
  decisions: Decision[];
  contracts: DecisionContract[];
  predictions: Prediction[];
  evidences: Evidence[];
  audit_events?: AuditEvent[];
  decision_debt: DecisionDebtBreakdown;
  risk_analysis: RiskBreakdown;
  ai_reasoning: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'ACCOUNT' | 'CONTACT' | 'DEAL' | 'ACTIVITY' | 'DECISION' | 'INTERACTION';
  status?: string;
  value?: number;
  risk_level?: 'NORMAL' | 'WARNING' | 'CRITICAL';
  details?: Record<string, any>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  is_risk_path?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  ripple_summary?: string;
  critical_path?: string[];
  downstream_exposure?: number;
  affected_stakeholders?: string[];
}

export interface DashboardMetrics {
  total_decision_debt: number;
  total_revenue_at_risk: number;
  critical_decisions_count: number;
  overdue_actions_count: number;
  high_risk_accounts_count: number;
  prediction_accuracy_rate: number;
  debt_trend_data: Array<{ week: string; debt: number; revenue_risk: number }>;
  risk_distribution: {
    CRITICAL: number;
    WARNING: number;
    HEALTHY: number;
  };
  attention_accounts: Account[];
  recent_contracts: DecisionContract[];
}

export interface ActionCenterItem {
  id: string;
  account_id: string;
  company_name: string;
  account_owner: string;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  action_type: string;
  deadline?: string;
  revenue_at_risk: number;
  current_debt?: number;
  evidence_count: number;
  recommended_action: string;
  why: string;
  contract_id?: string;
  requires_approval: boolean;
  approval_status?: 'RECOMMENDATION' | 'APPROVED' | 'COMPLETED';
}

export interface CalibrationBucket {
  bucket_range: string;
  predicted_count: number;
  actual_positive_count: number;
  accuracy_rate: number;
}

export interface SelfAuditSummary {
  total_predictions: number;
  verified_predictions: number;
  correct_predictions: number;
  incorrect_predictions: number;
  overall_accuracy_rate: number;
  brier_score: number;
  calibration_buckets: CalibrationBucket[];
  false_positives: number;
  false_negatives: number;
  recent_audits: Prediction[];
}

export interface CopilotQueryResponse {
  answer: string;
  intent: string;
  cited_accounts: Array<{
    id: string;
    name: string;
    debt_score: number;
    risk_score: number;
    revenue_at_risk: number;
    owner: string;
  }>;
  cited_evidence: Array<{
    id: string;
    source: string;
    type: string;
    description: string;
    weight: number;
  }>;
  suggested_actions: string[];
}
