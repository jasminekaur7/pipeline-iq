import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { SelfAuditSummary, Prediction } from '../types';
import { useToast } from '../context/ToastContext';
import {
  CheckCircle2, PlusCircle, X, Check, Database
} from 'lucide-react';

interface SelfAuditPageProps {
  onSelectAccount: (id: string) => void;
}

export const SelfAuditPage: React.FC<SelfAuditPageProps> = ({ onSelectAccount }) => {
  const { addToast } = useToast();
  const [audit, setAudit] = useState<SelfAuditSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);

  // Form fields for recording outcome
  const [selectedPredictionId, setSelectedPredictionId] = useState<string>('');
  const [actualOutcome, setActualOutcome] = useState<string>('PREVENTED');
  const [verificationSource, setVerificationSource] = useState<string>('Executive Review');
  const [auditNotes, setAuditNotes] = useState<string>('Executive check-in executed, churn risk prevented.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchAuditData = useCallback(async () => {
    try {
      const data = await api.getSelfAudit();
      setAudit(data);
    } catch (err: any) {
      console.error('Failed to load self audit metrics', err);
      addToast({
        type: 'error',
        title: 'Error loading self-audit metrics',
        message: err.message || 'Unable to retrieve calibration metrics',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  const handleOpenVerifyModal = (pred?: Prediction) => {
    if (pred) {
      setSelectedPrediction(pred);
      setSelectedPredictionId(pred.id);
      setActualOutcome(pred.outcome || 'PREVENTED');
      setAuditNotes(pred.audit_notes || `Verified outcome for ${pred.account_id}`);
    } else if (audit && audit.recent_audits.length > 0) {
      const first = audit.recent_audits[0];
      setSelectedPrediction(first);
      setSelectedPredictionId(first.id);
      setActualOutcome('PREVENTED');
      setAuditNotes(`Verified outcome for ${first.account_id}`);
    }
    setIsRecordModalOpen(true);
  };

  const handleSubmitOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPredictionId || !actualOutcome) return;

    setIsSubmitting(true);
    try {
      await api.recordOutcome(
        selectedPredictionId,
        actualOutcome,
        auditNotes,
        verificationSource
      );
      addToast({
        type: 'success',
        title: 'Prediction Outcome Recorded',
        message: 'Outcome saved. Model calibration, accuracy rate, and Brier score updated.',
      });
      setIsRecordModalOpen(false);
      await fetchAuditData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.message || 'Unable to record prediction outcome',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !audit) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#111726] rounded-md border border-slate-800"></div>
          ))}
        </div>
        <div className="h-64 bg-[#111726] rounded-md border border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            <span>Self-Audit &amp; Calibration Ledger</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Reliability Telemetry
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical calibration metrics comparing predictive risk scores against verified historical outcomes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenVerifyModal()}
          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-sm self-start md:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Record Actual Outcome</span>
        </button>
      </div>

      {/* Dataset Label Banner */}
      <div className="p-3 rounded-md bg-[#111726] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Database className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong className="text-white font-medium">Dataset Scope:</strong> Current metrics are calibrated on <strong>{audit.total_predictions} seeded historical prediction records</strong> to establish an initial performance baseline. Live operator verifications update this distribution in real-time.
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700 shrink-0">
          Demo Benchmark Data
        </span>
      </div>

      {/* Top 4 Audit Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-md bg-[#111726] border border-slate-800 border-l-2 border-l-blue-500">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Verified Predictions
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {audit.verified_predictions} <span className="text-xs text-slate-400 font-sans">/ {audit.total_predictions}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Ground-truth outcomes audited</div>
        </div>

        <div className="p-3.5 rounded-md bg-[#111726] border border-slate-800 border-l-2 border-l-emerald-500">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Overall Accuracy Rate
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {audit.overall_accuracy_rate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Correct risk predictions</div>
        </div>

        <div className="p-3.5 rounded-md bg-[#111726] border border-slate-800 border-l-2 border-l-blue-500">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Brier Calibration Score
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {audit.brier_score.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Target &le; 0.250 (lower is better)</div>
        </div>

        <div className="p-3.5 rounded-md bg-[#111726] border border-slate-800 border-l-2 border-l-amber-500">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            False Alarm Rate
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {audit.false_positives} FP <span className="text-xs text-slate-500 font-sans">/ {audit.false_negatives} FN</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">False positives vs false negatives</div>
        </div>
      </div>

      {/* Confidence Calibration Bins Table */}
      <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Empirical Calibration Buckets
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Testing reliability across probability intervals. A well-calibrated system aligns predicted probability with observed outcome frequency.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            5 Confidence Buckets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <th className="pb-2 font-medium">Confidence Range</th>
                <th className="pb-2 font-medium">Sample Count</th>
                <th className="pb-2 font-medium">Observed Outcome Accuracy</th>
                <th className="pb-2 font-medium">Calibration Reliability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {audit.calibration_buckets.map((b, idx) => {
                const count = b.predicted_count ?? b.count ?? 0;
                const rate = b.accuracy_rate ?? b.observed_rate ?? 0;
                const status = b.reliability_status || (rate >= 75 ? 'WELL_CALIBRATED' : rate >= 50 ? 'CALIBRATED' : 'MONITORING');

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-medium text-slate-200">{b.bucket_range}</td>
                    <td className="py-2.5 text-slate-400">{count} cases</td>
                    <td className="py-2.5 text-slate-200">
                      <span className="font-semibold text-white">{rate}%</span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border uppercase ${
                          status === 'WELL_CALIBRATED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : status === 'OVERCONFIDENT'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Historical Prediction Records */}
      <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Audited Outcome Records
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Historical ledger of model predictions vs actual recorded customer decisions.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {audit.recent_audits.length} recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <th className="pb-2 font-medium">Account ID</th>
                <th className="pb-2 font-medium">Predicted Risk Event</th>
                <th className="pb-2 font-medium">Confidence</th>
                <th className="pb-2 font-medium">Verified Outcome</th>
                <th className="pb-2 font-medium">Match Result</th>
                <th className="pb-2 font-medium text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {audit.recent_audits.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 font-mono text-slate-200">
                    <button
                      type="button"
                      onClick={() => onSelectAccount(p.account_id)}
                      className="hover:text-blue-400 hover:underline"
                    >
                      {p.account_id}
                    </button>
                  </td>
                  <td className="py-2.5 text-slate-300 font-medium">
                    {(p.risk_type || p.prediction_type || 'RISK_SIGNAL').replace(/_/g, ' ')}
                  </td>
                  <td className="py-2.5 font-mono text-slate-300">
                    {Math.round(p.confidence * 100)}%
                  </td>
                  <td className="py-2.5 font-mono text-slate-300">
                    {p.outcome || 'PENDING'}
                  </td>
                  <td className="py-2.5">
                    {p.actual_outcome_match === true ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        MATCH (ACCURATE)
                      </span>
                    ) : p.actual_outcome_match === false ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        MISMATCH
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        AWAITING VERIFICATION
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenVerifyModal(p)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Outcome Modal */}
      {isRecordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg bg-[#111726] border border-slate-800 rounded-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Record Actual Prediction Outcome</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Update calibration ledger with verified ground-truth results.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOutcome} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Target Prediction Record
                </label>
                <select
                  value={selectedPredictionId}
                  onChange={(e) => setSelectedPredictionId(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-slate-600 font-mono"
                >
                  {audit.recent_audits.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.account_id} — {p.risk_type || p.prediction_type} ({Math.round(p.confidence * 100)}% conf)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Verified Real-World Outcome
                </label>
                <select
                  value={actualOutcome}
                  onChange={(e) => setActualOutcome(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                >
                  <option value="PREVENTED">PREVENTED (Intervention Successful)</option>
                  <option value="CHURNED">CHURNED (Account Lost)</option>
                  <option value="EXPANDED">EXPANDED (Platform Deal Closed)</option>
                  <option value="FALSE_ALARM">FALSE ALARM (Risk Did Not Materialize)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Verification Source
                </label>
                <input
                  type="text"
                  value={verificationSource}
                  onChange={(e) => setVerificationSource(e.target.value)}
                  placeholder="e.g., Executive Business Review, Finance Invoice"
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Auditor Notes &amp; Evidence
                </label>
                <textarea
                  rows={2}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Document why outcome occurred..."
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Outcome Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
