import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { AccountDetail, GraphData } from '../types';
import { RelationshipGraph } from '../components/RelationshipGraph';
import { EvidenceLedgerModal } from '../components/EvidenceLedgerModal';
import { DecisionContractModal } from '../components/DecisionContractModal';
import { useToast } from '../context/ToastContext';
import {
  Building2, AlertOctagon, DollarSign, Activity, FileCheck2,
  Calendar, User, ShieldCheck, Mail, Phone, Clock, ArrowRight,
  TrendingUp, CheckCircle2, AlertTriangle, Sparkles, PlusCircle, RefreshCw,
  Target, Bot, History, Check, Shield, Layers
} from 'lucide-react';

interface AccountDetailPageProps {
  accountId: string;
  onBack: () => void;
  openCopilot: () => void;
}

export const AccountDetailPage: React.FC<AccountDetailPageProps> = ({
  accountId,
  onBack,
  openCopilot,
}) => {
  const { addToast } = useToast();
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState<boolean>(false);
  const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);

  const fetchDetails = useCallback(async () => {
    try {
      const [accDetail, gData] = await Promise.all([
        api.getAccountDetail(accountId),
        api.getAccountGraph(accountId),
      ]);
      setDetail(accDetail);
      setGraphData(gData);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error loading account',
        message: err.message || 'Unable to retrieve account telemetry',
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, addToast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Contract actions (Complete, Escalate, Snooze)
  const handleCompleteContract = async (contractId: string) => {
    setIsActionInProgress(true);
    try {
      await api.completeContract(contractId, 'Intervention completed: Executive check-in secured terms');
      addToast({
        type: 'success',
        title: 'Decision Contract Completed',
        message: 'Contract executed. Decision debt has been recalculated and reduced.',
      });
      await fetchDetails();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message,
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleEscalateContract = async (contractId: string) => {
    setIsActionInProgress(true);
    try {
      await api.escalateContract(contractId, 'Missed deadline triggered automated leadership escalation');
      addToast({
        type: 'warning',
        title: 'Decision Contract Escalated',
        message: 'Contract escalated to Sales Director per escalation protocol.',
      });
      await fetchDetails();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Escalation Failed',
        message: err.message,
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleSnoozeContract = async (contractId: string) => {
    setIsActionInProgress(true);
    try {
      await api.snoozeContract(contractId, 3);
      addToast({
        type: 'info',
        title: 'Deadline Snoozed',
        message: 'Contract deadline extended by 3 days with documented reason.',
      });
      await fetchDetails();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message,
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  if (loading || !detail) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4"></div>
        <div className="h-32 bg-slate-900 rounded-xl"></div>
        <div className="h-96 bg-slate-900 rounded-xl"></div>
      </div>
    );
  }

  const {
    account,
    decision_debt,
    risk_analysis,
    contacts,
    deals,
    interactions,
    contracts = [],
    evidences = [],
    predictions = [],
    decisions = [],
    audit_events = [],
    ai_reasoning,
  } = detail;

  const isHero = account.id === 'acc-acme';

  // Determine current agent state machine step
  const currentAccountState = (() => {
    if (contracts.some((c) => c.status === 'ESCALATED')) return 'ESCALATED';
    if (contracts.some((c) => c.status === 'OVERDUE')) return 'DEADLINE MISSED';
    if (contracts.some((c) => c.status === 'PENDING' || c.status === 'DUE_SOON')) return 'MONITORING';
    if (contracts.some((c) => c.status === 'COMPLETED')) return 'ACTION COMPLETED';
    if (decision_debt.score >= 70) return 'RECOMMEND';
    if (decision_debt.score >= 50) return 'DETECT';
    return 'OBSERVE';
  })();

  const agentLifecycleSteps = [
    'OBSERVE',
    'DETECT',
    'ANALYZE',
    'RECOMMEND',
    'HUMAN APPROVAL',
    'CONTRACT CREATED',
    'MONITORING',
    'ACTION COMPLETED',
    'AUDIT',
  ];

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <span>← Back to Accounts</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEvidenceModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Evidence Ledger ({evidences.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsContractModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Decision Contract</span>
          </button>
        </div>
      </div>

      {/* Account Overview Header Card */}
      <div className="p-5 sm:p-6 rounded-xl bg-slate-900/80 border border-slate-800 relative overflow-hidden shadow-lg">
        {isHero && (
          <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 border-b border-l border-emerald-500/30 text-emerald-300 font-mono text-[10px] uppercase font-semibold">
            Primary Demo Case
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {account.company_name}
              </h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${
                  account.health_status === 'CRITICAL'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : account.health_status === 'WARNING'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {account.health_status} Health
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Industry: <strong className="text-slate-300 font-medium">{account.industry}</strong> • Account Owner:{' '}
              <strong className="text-slate-200">{account.account_owner}</strong> • Pipeline Value:{' '}
              <strong className="text-white font-mono">${account.account_value.toLocaleString()}</strong>
            </p>
          </div>

          {/* 3 Core Calculated Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Decision Debt */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-center min-w-[120px]">
              <div className="text-[10px] uppercase font-mono text-slate-400">Decision Debt</div>
              <div className="text-xl font-bold font-mono text-rose-400">
                {decision_debt.score}/100
              </div>
              <div className="text-[9px] text-slate-500 uppercase font-mono">{decision_debt.severity}</div>
            </div>

            {/* Account Risk */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-center min-w-[110px]">
              <div className="text-[10px] uppercase font-mono text-slate-400">Account Risk</div>
              <div className="text-xl font-bold font-mono text-amber-400">
                {risk_analysis.overall_risk_score}%
              </div>
              <div className="text-[9px] text-slate-500 font-mono">Conf: {Math.round(risk_analysis.confidence * 100)}%</div>
            </div>

            {/* Revenue at Risk */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-center min-w-[130px]">
              <div className="text-[10px] uppercase font-mono text-slate-400">Revenue at Risk</div>
              <div className="text-xl font-bold font-mono text-white">
                ${risk_analysis.revenue_at_risk.toLocaleString()}
              </div>
              <div className="text-[9px] text-rose-400 font-mono">Exposed Capital</div>
            </div>
          </div>
        </div>

        {/* AI Grounded Reasoning Card */}
        <div className="mt-5 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-semibold text-slate-200">System Reasoning Synthesis: </span>
            <span className="text-slate-300 leading-relaxed">{ai_reasoning}</span>
          </div>
          <button
            type="button"
            onClick={openCopilot}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium shrink-0 flex items-center gap-1"
          >
            <span>Query Copilot</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Grounded Recommended Action Card */}
        <div className="mt-3 p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Action Plan</span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Requires Human Approval
              </span>
            </div>
            <p className="text-xs text-slate-200">
              {isHero
                ? "Schedule executive intervention meeting between Sarah Chen and CIO David Sterling within 72 hours to resolve the $180,000 contract deadlock before automated leadership escalation."
                : `Deploy priority re-engagement intervention targeting primary inactive stakeholders for ${account.company_name} with defined 3-day escalation deadline.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsContractModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Establish Contract</span>
          </button>
        </div>
      </div>

      {/* Decision Debt Contributor Breakdown Card */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>Decision Debt Score Breakdown: {decision_debt.score}/100</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent attribution formula showing exact points contributed by delayed business actions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEvidenceModalOpen(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            View Correlated Evidence →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {decision_debt.contributors.map((c, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono font-bold text-amber-400 text-sm">
                  +{c.points}
                </span>
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                    c.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {c.category.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-200 leading-snug">{c.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Relationship Graph Section */}
      {graphData && (
        <RelationshipGraph graphData={graphData} accountName={account.company_name} />
      )}

      {/* Open Strategic Decisions & Downstream Ripple Paths */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Open Strategic Decisions ({decisions.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pending pipeline decisions carrying downstream stakeholder and revenue exposure.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {decisions.filter((d) => d.status === 'OVERDUE' || d.status === 'PENDING').length} Unresolved
          </span>
        </div>

        {decisions.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No open decisions pending for this account.
          </div>
        ) : (
          <div className="space-y-3">
            {decisions.map((dec) => {
              const isOverdue = dec.status === 'OVERDUE';
              const isEscalated = dec.status === 'ESCALATED';

              return (
                <div
                  key={dec.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isOverdue
                      ? 'bg-rose-950/20 border-rose-900/40'
                      : isEscalated
                      ? 'bg-amber-950/20 border-amber-900/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                          dec.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isEscalated
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        }`}
                      >
                        {dec.status}
                      </span>
                      <span className="font-semibold text-sm text-slate-100">{dec.description}</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      <strong className="text-slate-400 font-medium">Expected Action:</strong> {dec.expected_action}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>Owner: <strong className="text-slate-200">{dec.owner}</strong></span>
                      <span>
                        Due Date:{' '}
                        <strong className={`font-mono ${isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-300'}`}>
                          {new Date(dec.due_date).toLocaleDateString()}
                        </strong>
                      </span>
                      {dec.opportunity_id && (
                        <span className="text-emerald-400 font-mono">Opp: {dec.opportunity_id}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsContractModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors"
                    >
                      Create Contract
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision Contracts Table & Simulation Controls */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Active Decision Contracts ({contracts.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate actions to observe real-time recalculation of Decision Debt and escalation states.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsContractModalOpen(true)}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            + Add Contract
          </button>
        </div>

        {contracts.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No decision contracts active. Click "Create Decision Contract" to establish one.
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((cnt) => (
              <div
                key={cnt.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                        cnt.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : cnt.status === 'OVERDUE'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : cnt.status === 'ESCALATED'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      }`}
                    >
                      {cnt.status}
                    </span>
                    <span className="font-semibold text-sm text-slate-100">{cnt.action}</span>
                  </div>

                  <p className="text-xs text-slate-300">{cnt.reason}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>Owner: <strong className="text-slate-200">{cnt.owner}</strong></span>
                    <span>Deadline: <strong className="text-amber-400 font-mono">{new Date(cnt.deadline).toLocaleDateString()}</strong></span>
                    <span>Escalation Rule: <strong className="text-slate-300 font-normal">{cnt.escalation_rule}</strong></span>
                  </div>

                  {cnt.outcome && (
                    <div className="text-[11px] text-emerald-400 font-mono mt-1">
                      Outcome: {cnt.outcome}
                    </div>
                  )}
                </div>

                {/* Simulation Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {cnt.status !== 'COMPLETED' && (
                    <>
                      <button
                        type="button"
                        disabled={isActionInProgress}
                        onClick={() => handleCompleteContract(cnt.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors"
                      >
                        Complete Action
                      </button>

                      <button
                        type="button"
                        disabled={isActionInProgress}
                        onClick={() => handleEscalateContract(cnt.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                      >
                        Simulate Escalation
                      </button>

                      <button
                        type="button"
                        disabled={isActionInProgress}
                        onClick={() => handleSnoozeContract(cnt.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                      >
                        Snooze (+3d)
                      </button>
                    </>
                  )}
                  {cnt.status === 'COMPLETED' && (
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Debt Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent State Engine Lifecycle & Audit Trail */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Agent State Machine &amp; Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic state progression monitoring pipeline decisions with immutable transition telemetry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Current State: {currentAccountState}
            </span>
          </div>
        </div>

        {/* Visual State Pipeline Breadcrumb */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 mb-4 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-[700px] text-[11px] font-mono">
            {agentLifecycleSteps.map((step, idx) => {
              const isCurrent = step === currentAccountState;
              const isPast = agentLifecycleSteps.indexOf(currentAccountState) >= idx;

              return (
                <React.Fragment key={step}>
                  <div
                    className={`px-2.5 py-1 rounded border transition-all flex items-center gap-1 ${
                      isCurrent
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm shadow-emerald-500/20'
                        : isPast
                        ? 'bg-slate-900 text-slate-300 border-slate-700'
                        : 'bg-slate-950/40 text-slate-600 border-slate-800/60'
                    }`}
                  >
                    {isPast && !isCurrent && <Check className="w-3 h-3 text-emerald-400" />}
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                    <span>{step}</span>
                  </div>
                  {idx < agentLifecycleSteps.length - 1 && (
                    <span className="text-slate-600">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Audit Events Log */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Immutable Transition Log ({audit_events.length} Events)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Chronological Telemetry</span>
          </div>

          {audit_events.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
              No state engine events logged yet. Creating or executing a contract will record verified transitions.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto pr-2 rounded-lg bg-slate-950 border border-slate-800 p-3">
              {audit_events.map((evt) => (
                <div key={evt.id} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold ${
                          evt.event_type.includes('ESCALAT') || evt.event_type.includes('MISSED')
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : evt.event_type.includes('APPROVED') || evt.event_type.includes('COMPLETED')
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        }`}
                      >
                        {evt.event_type}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{evt.actor}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] font-mono mt-0.5">
                      Entity: {evt.entity_type} ({evt.entity_id})
                      {evt.metadata_json && evt.metadata_json !== '{}' && (
                        <span className="text-slate-400 block font-sans text-[11px]">
                          Payload: {evt.metadata_json}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two columns: Stakeholder Contacts & Deals Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contacts */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" />
              <span>Stakeholder Engagement ({contacts.length})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {contacts.filter((c) => c.status === 'INACTIVE').length} inactive
            </span>
          </div>

          <div className="space-y-2.5">
            {contacts.map((c) => {
              const isInactive = c.status === 'INACTIVE' || c.engagement_score < 45;

              return (
                <div
                  key={c.id}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                    isInactive
                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-200'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <span>{c.name}</span>
                      {c.influence_level && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                            c.influence_level === 'DECISION_MAKER'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                              : c.influence_level === 'INFLUENCER'
                              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {c.influence_level.replace('_', ' ')}
                        </span>
                      )}
                      {isInactive && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{c.role}</span>
                      <span>•</span>
                      <a
                        href={`mailto:${c.email}`}
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        <span>{c.email}</span>
                      </a>
                      <span>•</span>
                      <a
                        href={`tel:${c.phone}`}
                        className="text-slate-400 hover:text-slate-200 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{c.phone}</span>
                      </a>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-[10px] text-slate-400">Engagement</div>
                    <div className={`font-bold ${isInactive ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {c.engagement_score}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deals */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Pipeline Deals ({deals.length})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Total: ${deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
            </span>
          </div>

          <div className="space-y-2.5">
            {deals.map((d) => (
              <div
                key={d.id}
                className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                  d.status === 'STALLED'
                    ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>{d.deal_name}</span>
                    {d.status === 'STALLED' && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Stalled {d.days_in_stage}d
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Stage: <strong className="text-slate-300">{d.stage}</strong> • Owner: {d.owner} • Close Date:{' '}
                    {new Date(d.expected_close_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-white text-sm">
                    ${d.value.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Prob: {Math.round(d.probability * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactions Timeline */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <h2 className="font-semibold text-sm text-slate-100 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Recent Communication Telemetry ({interactions.length})</span>
        </h2>

        <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto pr-2">
          {interactions.map((int) => (
            <div key={int.id} className="py-2.5 first:pt-0 text-xs flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {int.type}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      int.sentiment === 'NEGATIVE'
                        ? 'text-rose-400'
                        : int.sentiment === 'POSITIVE'
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    Sentiment: {int.sentiment}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(int.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-slate-200">{int.summary}</p>
                {int.outcome && (
                  <p className="text-[11px] text-slate-400 mt-0.5">Result: {int.outcome}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <EvidenceLedgerModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        evidences={evidences}
        accountName={account.company_name}
      />

      <DecisionContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        accountId={account.id}
        accountName={account.company_name}
        defaultOwner={account.account_owner}
        onCreated={fetchDetails}
      />
    </div>
  );
};
