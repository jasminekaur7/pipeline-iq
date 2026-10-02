import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { AccountDetail, GraphData } from '../types';
import { RelationshipGraph } from '../components/RelationshipGraph';
import { EvidenceLedgerModal } from '../components/EvidenceLedgerModal';
import { DecisionContractModal } from '../components/DecisionContractModal';
import { useToast } from '../context/ToastContext';
import {
  AlertOctagon, DollarSign, Activity, FileCheck2,
  User, ShieldCheck, Mail, Phone, Clock, ArrowRight,
  CheckCircle2, AlertTriangle, PlusCircle,
  Shield, Users, Briefcase, MessageSquareCode
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

  // Contract state mutations
  const handleCompleteContract = async (contractId: string) => {
    setIsActionInProgress(true);
    try {
      await api.completeContract(contractId, 'Intervention completed: Executive terms confirmed');
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
        message: 'Contract deadline extended by 3 days with documented audit reason.',
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
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5 animate-pulse">
        <div className="h-5 bg-slate-800 rounded w-1/4"></div>
        <div className="h-28 bg-[#111726] rounded-md border border-slate-800"></div>
        <div className="h-96 bg-[#111726] rounded-md border border-slate-800"></div>
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
    decisions = [],
    contracts = [],
    evidences = [],
  } = detail;

  const isHero = account.id === 'acc-acme';

  return (
    <div className="space-y-5 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <span>← Back to Accounts List</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEvidenceModalOpen(true)}
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Evidence Ledger ({evidences.length})</span>
          </button>

          <button
            type="button"
            onClick={openCopilot}
            className="px-2.5 py-1.5 rounded-md bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <MessageSquareCode className="w-3.5 h-3.5" />
            <span>Query Account Intel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsContractModalOpen(true)}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Decision Contract</span>
          </button>
        </div>
      </div>

      {/* Account Identity Header */}
      <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">
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
              {isHero && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold">
                  Demo Hero Account
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Industry: <strong className="text-slate-300 font-medium">{account.industry}</strong> • Account Owner:{' '}
              <strong className="text-slate-200">{account.account_owner}</strong> • Total Active Pipeline:{' '}
              <strong className="text-white font-mono">${account.account_value.toLocaleString()}</strong>
            </p>
          </div>

          {/* 3 Core Metric Tiles */}
          <div className="flex items-center gap-2.5">
            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-center min-w-[110px] border-l-2 border-l-rose-500">
              <div className="text-[10px] uppercase font-mono text-slate-400">Decision Debt</div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                {decision_debt.score} <span className="text-xs text-slate-500 font-sans">/ 100</span>
              </div>
              <div className="text-[9px] text-slate-500 uppercase font-mono">{decision_debt.severity}</div>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-center min-w-[110px] border-l-2 border-l-amber-500">
              <div className="text-[10px] uppercase font-mono text-slate-400">Account Risk</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                {risk_analysis.overall_risk_score}%
              </div>
              <div className="text-[9px] text-slate-500 uppercase font-mono">
                {Math.round(risk_analysis.confidence * 100)}% Conf
              </div>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-center min-w-[110px] border-l-2 border-l-blue-500">
              <div className="text-[10px] uppercase font-mono text-slate-400">Revenue at Risk</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                ${(account.revenue_at_risk / 1000).toFixed(0)}k
              </div>
              <div className="text-[9px] text-slate-500 uppercase font-mono">Active Exposure</div>
            </div>
          </div>
        </div>

        {/* Operational Action Plan Callout */}
        <div className="mt-4 p-3 rounded bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span>Required Intervention</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Requires Human Approval
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isHero
                ? 'Executive re-engagement required between Sarah Chen and CIO David Sterling within 72h to resolve pricing deadlocks on the $180,000 platform expansion.'
                : `Establish formal decision contract for ${account.company_name} targeting primary inactive stakeholders before automated escalation.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsContractModalOpen(true)}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Establish Contract</span>
          </button>
        </div>
      </div>

      {/* Decision Debt Contributor Breakdown */}
      <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Decision Debt Calculation Breakdown ({decision_debt.score} pts)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Deterministic point attribution calculated from active deal stalls, contact decay, and overdue commitments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEvidenceModalOpen(true)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <span>Evidence Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {decision_debt.contributors.map((c, idx) => (
            <div
              key={idx}
              className="p-3 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono font-bold text-amber-400 text-xs">
                  +{c.points} pts
                </span>
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                    c.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {c.category.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1.5 leading-snug">
                {c.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Graph & Multi-Entity Topology */}
      {graphData && (
        <RelationshipGraph
          graphData={graphData}
          accountName={account.company_name}
        />
      )}

      {/* Two Column Grid: Strategic Contacts & Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stakeholders & Contacts */}
        <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Key Stakeholders ({contacts.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              {contacts.filter((c) => c.status === 'INACTIVE').length} Inactive
            </span>
          </div>

          <div className="space-y-2">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-medium text-slate-100 flex items-center gap-2">
                    <span>{c.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {c.role}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                        c.status === 'INACTIVE'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" />
                      {c.email}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {c.phone}
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase">Engagement</div>
                  <div className={`font-bold ${
                    c.engagement_score < 40 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {Math.round(c.engagement_score)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Deals */}
        <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span>Pipeline Deals ({deals.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              Total: ${deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            {deals.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-medium text-slate-100 flex items-center gap-2">
                    <span>{d.deal_name}</span>
                    {d.status === 'STALLED' && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Stalled {d.days_in_stage}d
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Stage: <strong className="text-slate-300 font-normal">{d.stage}</strong> • Owner: {d.owner} • Close Date:{' '}
                    {new Date(d.expected_close_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right font-mono shrink-0">
                  <div className="font-bold text-white">
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

      {/* Active Decision Contracts */}
      <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Active Decision Contracts ({contracts.length})</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Human-approved commitments with defined owner deadlines and automated escalation rules.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsContractModalOpen(true)}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700"
          >
            + Create Contract
          </button>
        </div>

        {contracts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No decision contracts active for this account. Click "Create Contract" to establish one.
          </div>
        ) : (
          <div className="space-y-2.5">
            {contracts.map((cnt) => (
              <div
                key={cnt.id}
                className="p-3.5 rounded bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                        cnt.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : cnt.status === 'OVERDUE'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : cnt.status === 'ESCALATED'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {cnt.status}
                    </span>
                    <span className="font-semibold text-slate-100">{cnt.action}</span>
                  </div>

                  <p className="text-slate-300">
                    <strong className="text-slate-400 font-normal">Escalation Protocol:</strong> {cnt.escalation_rule}
                    {cnt.escalation_target && (
                      <span className="text-slate-400 font-mono ml-1">→ {cnt.escalation_target}</span>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span>Assigned: <strong className="text-slate-200 font-normal">{cnt.owner}</strong></span>
                    <span>
                      Deadline:{' '}
                      <strong className="font-mono text-slate-200">
                        {new Date(cnt.deadline).toLocaleDateString()}
                      </strong>
                    </span>
                    {cnt.reason && (
                      <span className="text-slate-500 truncate max-w-xs">{cnt.reason}</span>
                    )}
                  </div>
                </div>

                {/* Contract State Transition Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {cnt.status !== 'COMPLETED' && (
                    <>
                      <button
                        type="button"
                        disabled={isActionInProgress}
                        onClick={() => handleCompleteContract(cnt.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        disabled={isActionInProgress}
                        onClick={() => handleEscalateContract(cnt.id)}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Escalate
                      </button>
                      <button
                        type="button"
                        disabled={isActionInProgress}
                        onClick={() => handleSnoozeContract(cnt.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Snooze 3d
                      </button>
                    </>
                  )}
                  {cnt.status === 'COMPLETED' && (
                    <span className="text-xs font-mono text-emerald-400 font-medium">
                      ✓ Executed & Recalculated
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Communication Telemetry */}
      <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Communication & Interaction History ({interactions.length})</span>
        </h2>

        <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto pr-1">
          {interactions.map((int) => (
            <div key={int.id} className="py-2.5 first:pt-0 text-xs flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
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
                  <p className="text-[11px] text-slate-400 mt-0.5">Outcome: {int.outcome}</p>
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
