import React, { useState } from 'react';
import { FileCheck2, Calendar, User, AlertOctagon, X, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

interface DecisionContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
  defaultOwner?: string;
  onCreated?: () => void;
}

export const DecisionContractModal: React.FC<DecisionContractModalProps> = ({
  isOpen,
  onClose,
  accountId,
  accountName,
  defaultOwner = 'Sarah Chen',
  onCreated,
}) => {
  const { addToast } = useToast();
  const [action, setAction] = useState<string>('Re-engage primary executive decision maker');
  const [owner, setOwner] = useState<string>(defaultOwner);
  const [deadlineDays, setDeadlineDays] = useState<number>(3);
  const [escalationRule, setEscalationRule] = useState<string>(
    'Escalate to Sales Director if no meeting confirmed within 3 days'
  );
  const [expectedImpact, setExpectedImpact] = useState<string>(
    'Unblock stalled opportunity and prevent churn'
  );
  const [reason, setReason] = useState<string>(
    'Stalled pipeline deal + declining account communication velocity'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action || !owner) return;

    setIsSubmitting(true);
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + deadlineDays);

      await api.createContract({
        account_id: accountId,
        action,
        owner,
        deadline: targetDate.toISOString(),
        escalation_rule: escalationRule,
        expected_impact: expectedImpact,
        reason,
      });

      addToast({
        type: 'success',
        title: 'Decision Contract Created',
        message: `Contract assigned to ${owner} with ${deadlineDays}-day deadline for ${accountName}.`,
      });

      onCreated?.();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to create contract',
        message: err.message || 'Please check input parameters and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="contract-modal-title" className="text-base font-semibold text-white">
                Establish Decision Contract
              </h2>
              <p className="text-xs text-slate-400">
                Binding commitment and automated escalation for <span className="text-slate-200 font-medium">{accountName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Required Action <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. Schedule C-level alignment with CIO"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Accountable Owner <span className="text-rose-400">*</span>
              </label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Sarah Chen">Sarah Chen (Enterprise Rep)</option>
                <option value="Marcus Vance">Marcus Vance (Strategic Accounts)</option>
                <option value="Elena Rostova">Elena Rostova (Account Director)</option>
                <option value="Devon Park">Devon Park (Solutions Architect)</option>
                <option value="Aisha Al-Mansoor">Aisha Al-Mansoor (VP Customer Success)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Execution Deadline <span className="text-rose-400">*</span>
              </label>
              <select
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value={1}>1 Day (Emergency Response)</option>
                <option value={2}>2 Days (High Urgency)</option>
                <option value={3}>3 Days (Standard Protocol)</option>
                <option value={5}>5 Days (Multi-Stakeholder)</option>
                <option value={7}>7 Days (Contract Renewal)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Automated Escalation Rule <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={escalationRule}
              onChange={(e) => setEscalationRule(e.target.value)}
              placeholder="e.g. Escalate to VP of Sales if deadline passes without logged interaction"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Expected Business Impact</label>
            <input
              type="text"
              value={expectedImpact}
              onChange={(e) => setExpectedImpact(e.target.value)}
              placeholder="e.g. Reduce churn risk to <35% & secure annual expansion"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Underlying Rationale / Evidence</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950/40"
            >
              <span>{isSubmitting ? 'Establishing...' : 'Commit Decision Contract'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
