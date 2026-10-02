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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="evidence-modal-title" className="text-base font-semibold text-white">
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
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close evidence ledger modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 divide-y divide-slate-800/60">
          {evidences.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No evidence signals currently logged for this account.
            </div>
          ) : (
            evidences.map((ev, idx) => {
              const weightPercent = Math.round(ev.weight * 100);

              return (
                <div key={ev.id || idx} className="pt-3.5 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono flex items-center justify-center text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
                        {ev.evidence_type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Weight: {weightPercent}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ev.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-slate-200 leading-relaxed font-normal">
                    {ev.description}
                  </p>

                  <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      <span>Source: <strong className="text-slate-300 font-medium">{ev.source}</strong></span>
                    </div>
                    {ev.related_entity && (
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>All evidence signals are deterministically verifiable. Zero hallucination.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
