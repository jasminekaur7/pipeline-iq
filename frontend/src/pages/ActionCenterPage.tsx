import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ActionCenterItem } from '../types';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert, Clock, AlertTriangle, CheckCircle2, ArrowRight,
  User, DollarSign, Send, Check, X, FileCheck2, ExternalLink,
  Sparkles, AlertOctagon, Filter
} from 'lucide-react';

interface ActionCenterPageProps {
  onSelectAccount: (id: string) => void;
}

export const ActionCenterPage: React.FC<ActionCenterPageProps> = ({ onSelectAccount }) => {
  const { addToast } = useToast();
  const [items, setItems] = useState<ActionCenterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewingItem, setReviewingItem] = useState<ActionCenterItem | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECOMMENDATION' | 'APPROVED' | 'COMPLETED'>('ALL');
  const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);

  const fetchItems = () => {
    setLoading(true);
    api.getActionCenter()
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load action items', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleApproveAction = async (item: ActionCenterItem) => {
    setIsActionInProgress(true);
    try {
      if (item.contract_id) {
        await api.completeContract(item.contract_id, approvalNotes || 'Approved and dispatched by human operator');
      } else {
        // Create contract if none existed
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);
        await api.createContract({
          account_id: item.account_id,
          action: item.recommended_action,
          owner: item.account_owner,
          deadline: targetDate.toISOString(),
          escalation_rule: 'Escalate to Sales Director if no response in 3 days',
          reason: item.why,
          expected_impact: 'Mitigate decision debt and secure revenue',
        });
      }

      addToast({
        type: 'success',
        title: 'Action Approved & Decision Contract Established',
        message: `Human approval recorded for ${item.company_name}. Account monitored in state engine.`,
      });
      setReviewingItem(null);
      setApprovalNotes('');
      fetchItems();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Approval failed',
        message: err.message,
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleCompleteDirect = async (item: ActionCenterItem) => {
    if (!item.contract_id) return;
    setIsActionInProgress(true);
    try {
      await api.completeContract(item.contract_id, 'Action completed directly from Action Center queue');
      addToast({
        type: 'success',
        title: 'Action Completed',
        message: `Decision resolved for ${item.company_name}. Decision debt reduced.`,
      });
      fetchItems();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Completion failed',
        message: err.message,
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleEscalateAction = async (item: ActionCenterItem) => {
    setIsActionInProgress(true);
    try {
      if (item.contract_id) {
        await api.escalateContract(item.contract_id, 'Escalated directly from Action Center review');
      }
      addToast({
        type: 'warning',
        title: 'Escalation Dispatched',
        message: `Action escalated to department leadership for ${item.company_name}.`,
      });
      setReviewingItem(null);
      fetchItems();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Escalation failed',
        message: err.message,
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleSnoozeDirect = async (item: ActionCenterItem) => {
    if (!item.contract_id) return;
    setIsActionInProgress(true);
    try {
      await api.snoozeContract(item.contract_id, 3);
      addToast({
        type: 'info',
        title: 'Action Snoozed',
        message: `Deadline extended by 3 days for ${item.company_name}.`,
      });
      fetchItems();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Snooze failed',
        message: err.message,
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const recommendationCount = items.filter((i) => i.approval_status === 'RECOMMENDATION').length;
  const approvedCount = items.filter((i) => i.approval_status === 'APPROVED').length;
  const completedCount = items.filter((i) => i.approval_status === 'COMPLETED').length;

  const filteredItems = items.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.approval_status === statusFilter;
  });

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Action Center</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              Human-in-the-Loop
            </span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Prioritized critical queue of unresolved business decisions with grounded recommendations and accountability monitoring.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Queue: <strong className="text-white">{items.length} Tracked Actions</strong>
        </div>
      </div>

      {/* Filter Tabs & Distinction Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Items ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('RECOMMENDATION')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'RECOMMENDATION'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>AI Recommendations ({recommendationCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'APPROVED'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3 h-3 text-sky-400" />
            <span>Approved in Progress ({approvedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Completed ({completedCount})</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-emerald-400">
          All consequential communications require human approval
        </div>
      </div>

      {/* Action Queue List */}
      {loading ? (
        <div className="space-y-3 py-6 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-xl"></div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-100">No Actions in this Queue</h3>
          <p className="text-xs text-slate-400 mt-1">
            Zero actions matching the selected filter currently pending.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            const isCritical = item.priority === 'CRITICAL';
            const isRecommendation = item.approval_status === 'RECOMMENDATION';
            const isApproved = item.approval_status === 'APPROVED';
            const isCompleted = item.approval_status === 'COMPLETED';

            return (
              <div
                key={item.id}
                className={`p-5 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isCritical
                    ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700/60'
                    : isRecommendation
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : isApproved
                    ? 'bg-sky-950/20 border-sky-900/40 hover:border-sky-700/50'
                    : 'bg-emerald-950/20 border-emerald-900/40'
                }`}
              >
                {/* Left: All 7 required attributes clearly exposed */}
                <div className="space-y-2.5 max-w-3xl flex-1">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {item.priority}
                    </span>

                    {/* Status Distinction Badge */}
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                        isRecommendation
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : isApproved
                          ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {isRecommendation
                        ? 'AI Recommendation • Requires Approval'
                        : isApproved
                        ? 'Human-Approved • In Execution'
                        : 'Completed • Verified Outcome'}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectAccount(item.account_id)}
                      className="font-semibold text-xs text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-1 font-mono"
                    >
                      <span>{item.company_name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>

                  {/* WHAT */}
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">
                      WHAT (Condition &amp; Decision)
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">{item.title}</h3>
                  </div>

                  {/* WHY */}
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">
                      WHY (Telemetry Attribution)
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal mt-0.5">
                      {item.why}
                    </p>
                  </div>

                  {/* RECOMMENDED ACTION */}
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">
                      RECOMMENDED ACTION
                    </span>
                    <div className="text-xs text-slate-200 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 mt-0.5 font-medium flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item.recommended_action}</span>
                    </div>
                  </div>

                  {/* Metrics bar: OWNER, REVENUE AT RISK, DEADLINE, CURRENT DEBT */}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>
                      OWNER: <strong className="text-slate-200">{item.account_owner}</strong>
                    </span>
                    <span>
                      REVENUE AT RISK:{' '}
                      <strong className="text-rose-400 font-mono font-semibold">
                        ${item.revenue_at_risk.toLocaleString()}
                      </strong>
                    </span>
                    <span>
                      CURRENT DEBT:{' '}
                      <strong className="text-amber-400 font-mono font-semibold">
                        {item.current_debt ?? 0}/100
                      </strong>
                    </span>
                    {item.deadline && (
                      <span>
                        DEADLINE:{' '}
                        <strong className="text-slate-300 font-mono font-semibold">
                          {new Date(item.deadline).toLocaleDateString()}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Explicit Action Controls based on status */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {isRecommendation && (
                    <button
                      type="button"
                      disabled={isActionInProgress}
                      onClick={() => setReviewingItem(item)}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Review &amp; Approve Action</span>
                    </button>
                  )}

                  {isApproved && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isActionInProgress}
                        onClick={() => handleCompleteDirect(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors"
                      >
                        Complete Action
                      </button>

                      <button
                        type="button"
                        disabled={isActionInProgress}
                        onClick={() => handleEscalateAction(item)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                      >
                        Escalate
                      </button>

                      <button
                        type="button"
                        disabled={isActionInProgress}
                        onClick={() => handleSnoozeDirect(item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                      >
                        Snooze (+3d)
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Action Verified
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectAccount(item.account_id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors text-center"
                  >
                    Inspect Account
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Human-in-the-Loop Review Modal */}
      {reviewingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">
                  Human Approval Gateway
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500">Target Account</span>
                <div className="font-semibold text-sm text-slate-100">{reviewingItem.company_name}</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500">Recommended Action</span>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 font-medium">
                  {reviewingItem.recommended_action}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500">Telemetry &amp; Evidence Grounding</span>
                <div className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                  {reviewingItem.why}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                  Operator Dispatch Notes (Optional)
                </label>
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="e.g. Approved and verified with sales manager"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => handleEscalateAction(reviewingItem)}
                className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-medium transition-colors"
              >
                Escalate Instead
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingItem(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isActionInProgress}
                  onClick={() => handleApproveAction(reviewingItem)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve &amp; Execute</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
