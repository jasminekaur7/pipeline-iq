import {
  DashboardMetrics, Account, AccountDetail, GraphData,
  DecisionContract, ActionCenterItem, SelfAuditSummary,
  CopilotQueryResponse, Evidence, AuditEvent, TimelineItem,
  Decision, Prediction
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${BASE_URL}${url}`;
  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `API request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.detail || message;
    } catch {
      message = errorText || message;
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboard: () => fetchJson<DashboardMetrics>('/api/dashboard'),

  // Accounts
  getAccounts: (params?: { search?: string; status?: string; sort_by?: string; order?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.order) query.append('order', params.order);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<Account[]>(`/api/accounts${queryString}`);
  },

  getAccountDetail: (id: string) => fetchJson<AccountDetail>(`/api/accounts/${id}`),

  getAccountGraph: (id: string) => fetchJson<GraphData>(`/api/accounts/${id}/graph`),

  getAccountEvidence: (id: string) => fetchJson<Evidence[]>(`/api/accounts/${id}/evidence`),

  getAccountTimeline: (id: string) => fetchJson<TimelineItem[]>(`/api/accounts/${id}/timeline`),

  getAccountAuditEvents: (id: string) => fetchJson<AuditEvent[]>(`/api/accounts/${id}/audit-events`),

  // Decisions
  getDecisions: (params?: { status?: string; account_id?: string; owner?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.account_id) query.append('account_id', params.account_id);
    if (params?.owner) query.append('owner', params.owner);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<Decision[]>(`/api/decisions${queryString}`);
  },

  getDecisionRipple: (decisionId: string) => fetchJson<{ ripple: any; impact: any }>(`/api/decisions/${decisionId}/ripple`),

  // Decision Debt Overview
  getDecisionDebt: (params?: { severity?: string; owner?: string }) => {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.owner) query.append('owner', params.owner);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<any>(`/api/decision-debt${queryString}`);
  },

  // Decision Contracts
  getContracts: (params?: { status?: string; owner?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.owner) query.append('owner', params.owner);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<DecisionContract[]>(`/api/decision-contracts${queryString}`);
  },

  createContract: (data: {
    account_id: string;
    decision_id?: string;
    action: string;
    owner: string;
    deadline: string;
    escalation_rule: string;
    escalation_target?: string;
    expected_impact?: string;
    reason?: string;
  }) => fetchJson<DecisionContract>('/api/decision-contracts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  completeContract: (id: string, notes?: string) => fetchJson<DecisionContract>(`/api/decision-contracts/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || 'Completed successfully by account owner' }),
  }),

  escalateContract: (id: string, reason?: string) => fetchJson<DecisionContract>(`/api/decision-contracts/${id}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'Missed deadline triggered auto-escalation' }),
  }),

  snoozeContract: (id: string, days: number = 3) => fetchJson<DecisionContract>(`/api/decision-contracts/${id}/snooze`, {
    method: 'POST',
    body: JSON.stringify({ days }),
  }),

  // Action Center
  getActionCenter: () => fetchJson<ActionCenterItem[]>('/api/actions/center'),

  // Self Audit & Verification
  getSelfAudit: () => fetchJson<SelfAuditSummary>('/api/self-audit'),

  recordOutcome: (predictionId: string, actualOutcome: string, notes?: string, verificationSource: string = 'CRM Telemetry / Billing Sync') =>
    fetchJson<Prediction>(`/api/predictions/${predictionId}/outcome`, {
      method: 'POST',
      body: JSON.stringify({
        actual_outcome: actualOutcome,
        verification_source: verificationSource,
        notes: notes || ''
      }),
    }),

  // AI Copilot & Ask Pipeline IQ
  queryCopilot: (query: string, account_id?: string) => fetchJson<CopilotQueryResponse>('/api/ai/query', {
    method: 'POST',
    body: JSON.stringify({ query, account_id }),
  }),

  askPipelineIq: (query: string, account_id?: string) => fetchJson<CopilotQueryResponse>('/api/ask', {
    method: 'POST',
    body: JSON.stringify({ query, account_id }),
  }),
};
