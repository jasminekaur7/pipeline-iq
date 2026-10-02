import React from 'react';
import { Evidence } from '../types';
import { ShieldCheck, Calendar, Activity, Database, AlertCircle, X, ExternalLink } from 'lucide-react';

interface EvidenceLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidences: Evidence[];
  accountName: string;
}

export const EvidenceLedgerModal: React.FC<EvidenceLedgerModalProps> = ({
  isOpen,
  onClose,
  evidences,
  accountName,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-[#111726] border border-[#1E293B] rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E293B] flex items-center justify-between bg-[#0B0F17]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="evidence-modal-title" className="text-sm font-semibold text-white tracking-tight">
                Verifiable Evidence Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Grounded signals and telemetry supporting Decision Debt for <span className="text-slate-200 font-medium">{accountName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors"
            aria-label="Close evidence ledger modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 divide-y divide-[#1E293B]">
          {evidences.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No evidence signals currently logged for this account.
            </div>
          ) : (
            evidences.map((ev, idx) => {
              const weightPercent = Math.round(ev.weight * 100);

              return (
                <div key={ev.id || idx} className="pt-3.5 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#0B0F17] border border-[#1E293B] text-[11px] font-mono flex items-center justify-center text-slate-400">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-[11px] font-medium text-blue-400 uppercase tracking-wide">
                        {ev.evidence_type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B0F17] text-slate-300 border border-[#1E293B]">
                        Weight: {weightPercent}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ev.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-200 leading-relaxed font-normal">
                    {ev.description}
                  </p>

                  <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Database className="w-3.5 h-3.5 text-slate-500" />
                      <span>Source: <strong className="text-slate-300 font-medium">{ev.source}</strong></span>
                    </div>
                    {ev.related_entity && (
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                        <span>Ref: {ev.related_entity}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0B0F17] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>All evidence signals are deterministically verifiable.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
