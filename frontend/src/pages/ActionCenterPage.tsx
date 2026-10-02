import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ActionCenterItem } from '../types';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert, Clock, AlertTriangle, ArrowRight,
  Check, X, FileCheck2, ExternalLink
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECOMMENDATION' | 'APPROVED'>('ALL');
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
        await api.completeContract(item.contract_id, approvalNotes || 'Approved and resolved by operator');
      } else {
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
        title: 'Action Approved & Recorded',
        message: `Intervention recorded for ${item.company_name}. Account updated in state engine.`,
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
        message: `Decision resolved for ${item.company_name}. Decision debt recalculated.`,
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
        title: 'Action Escalated',
        message: `Decision escalated to leadership for ${item.company_name}.`,
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
        title: 'Deadline Snoozed',
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

  const filteredItems = items.filter((item) => {
    if (statusFilter === 'RECOMMENDATION') return item.approval_status === 'RECOMMENDATION';
    if (statusFilter === 'APPROVED') return item.approval_status === 'APPROVED';
    return true;
  });

  return (
    <div className="space-y-5 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            <span>Action Center</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {items.length} Pending Actions
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational queue of high-urgency interventions. External communication remains strictly human-approved.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-md text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Items ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('RECOMMENDATION')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              statusFilter === 'RECOMMENDATION'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Awaiting Approval ({items.filter((i) => i.approval_status === 'RECOMMENDATION').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              statusFilter === 'APPROVED'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Contracts ({items.filter((i) => i.approval_status === 'APPROVED').length})
          </button>
        </div>
      </div>

      {/* Action Queue List */}
      <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
        {loading ? (
          <div className="space-y-3 py-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-900 rounded border border-slate-800"></div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No action items matching the selected filter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredItems.map((item) => {
              const isCritical = item.priority === 'CRITICAL';
              const isOverdue = item.action_type === 'OVERDUE_DECISION' || item.action_type === 'ESCALATION';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-md border transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isCritical
                      ? 'bg-slate-900/90 border-slate-800 border-l-2 border-l-rose-500'
                      : 'bg-slate-900/60 border-slate-800 border-l-2 border-l-amber-500'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                          isCritical
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {item.priority} PRIORITY
                      </span>

                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                          item.approval_status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {item.approval_status === 'APPROVED' ? 'CONTRACT IN FLIGHT' : 'REQUIRES HUMAN APPROVAL'}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectAccount(item.account_id)}
                        className="font-medium text-xs text-white hover:text-blue-400 inline-flex items-center gap-1 transition-colors"
                      >
                        <span>{item.company_name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </button>

                      <span className="text-[11px] font-mono text-slate-400">
                        (${item.revenue_at_risk.toLocaleString()} at risk)
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-100">
                      {item.title}
                    </p>

                    <p className="text-[11px] text-slate-300 leading-snug">
                      <strong className="text-slate-400 font-normal">Intervention:</strong> {item.recommended_action}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 pt-0.5">
                      <span>Owner: <strong className="text-slate-200 font-normal">{item.account_owner}</strong></span>
                      {item.deadline && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          Deadline: {new Date(item.deadline).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-slate-500">{item.why}</span>
                    </div>
                  </div>

                  {/* Operational Action Controls */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    {item.approval_status === 'RECOMMENDATION' ? (
                      <button
                        type="button"
                        onClick={() => setReviewingItem(item)}
                        className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <span>Review &amp; Approve</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isActionInProgress}
                          onClick={() => handleCompleteDirect(item)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          disabled={isActionInProgress}
                          onClick={() => handleEscalateAction(item)}
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Escalate
                        </button>
                        <button
                          type="button"
                          disabled={isActionInProgress}
                          onClick={() => handleSnoozeDirect(item)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Snooze 3d
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Approve Modal */}
      {reviewingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg bg-[#111726] border border-slate-800 rounded-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-400" />
                  <span>Human Operator Approval: {reviewingItem.company_name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Confirm strategic intervention and establish binding decision contract.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-slate-400">Intervention Scope</div>
                <div className="font-medium text-slate-200">{reviewingItem.recommended_action}</div>
                <div className="text-[11px] text-slate-400">
                  Assigned Owner: <strong className="text-slate-300 font-normal">{reviewingItem.account_owner}</strong> • Revenue at Risk: ${reviewingItem.revenue_at_risk.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Operator Confirmation / Execution Notes
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Document specific intervention instructions or approval rationale..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionInProgress}
                onClick={() => handleApproveAction(reviewingItem)}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm &amp; Establish Contract</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
