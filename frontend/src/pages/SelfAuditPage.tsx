import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { SelfAuditSummary, Prediction } from '../types';
import { useToast } from '../context/ToastContext';
import {
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
  TrendingUp, Award, HelpCircle, ArrowUpRight, BarChart2,
  PlusCircle, RefreshCw, X, Check, Filter
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
  const [verificationSource, setVerificationSource] = useState<string>('Executive Customer Review');
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
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/60 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Self-Audit &amp; Calibration Ledger</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Honest Feedback Loop
            </span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Tracking predicted pipeline risks against verified real-world outcomes to calculate calibration and prevent hallucination.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenVerifyModal()}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record Actual Outcome</span>
          </button>
        </div>
      </div>

      {/* Top 4 Audit Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Verified Predictions</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {audit.verified_predictions} <span className="text-xs text-slate-500 font-sans">/ {audit.total_predictions}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Historical outcomes recorded</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Calibration Accuracy</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {audit.overall_accuracy_rate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{audit.correct_predictions} confirmed / {audit.incorrect_predictions} missed</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Brier Error Score</span>
            <span className="text-[10px] font-mono text-slate-400">Lower = Better</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {audit.brier_score}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Grounded calibration (&lt; 0.20 benchmark)</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Error Breakdown</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-200 mt-1">
            FP: <span className="text-amber-400">{audit.false_positives}</span> • FN: <span className="text-rose-400">{audit.false_negatives}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">False Positives vs False Negatives</div>
        </div>
      </div>

      {/* Model Calibration Curve Buckets */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Confidence Calibration Bins</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparing model predicted probability band against empirical real-world outcome frequency.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Empirical Reliability Curve
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {audit.calibration_buckets.map((b) => (
            <div
              key={b.bucket_range}
              className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between"
            >
              <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">
                Predicted Range: {b.bucket_range}
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 my-1">
                {b.accuracy_rate}%
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden my-1">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${b.accuracy_rate}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                {b.actual_positive_count} of {b.predicted_count} verified
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Prediction Audit Log */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm text-slate-100">
              Verifiable Prediction Outcome Log
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditing system recommendations against factual outcomes to verify decision accuracy.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Showing {audit.recent_audits.length} Audited Predictions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="pb-3 font-medium">Account ID</th>
                <th className="pb-3 font-medium">Risk Predicted</th>
                <th className="pb-3 font-medium">Confidence</th>
                <th className="pb-3 font-medium">Actual Outcome</th>
                <th className="pb-3 font-medium">Audit Verification</th>
                <th className="pb-3 font-medium">Audit Notes</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {audit.recent_audits.map((pred) => {
                const isMatch = pred.actual_outcome_match === true;

                return (
                  <tr
                    key={pred.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td
                      onClick={() => onSelectAccount(pred.account_id)}
                      className="py-3 font-mono font-medium text-emerald-400 cursor-pointer flex items-center gap-1"
                    >
                      <span>{pred.account_id}</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-500" />
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-200">
                        {pred.risk_type.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400">
                        Score: {pred.score.toFixed(0)}/100
                      </div>
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {Math.round(pred.confidence * 100)}%
                    </td>
                    <td className="py-3 font-mono text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                        {pred.outcome || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                          isMatch
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {isMatch ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {isMatch ? 'Prediction Correct' : 'Prediction Missed'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-[11px] max-w-xs">
                      {pred.audit_notes || 'Verified against recorded pipeline telemetry'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenVerifyModal(pred)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors border border-slate-700"
                      >
                        Verify Outcome
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Outcome Modal */}
      {isRecordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">
                  Record Prediction Outcome
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOutcome} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                  Select Prediction Target
                </label>
                <select
                  value={selectedPredictionId}
                  onChange={(e) => setSelectedPredictionId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {audit.recent_audits.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.account_id} — {p.risk_type} ({Math.round(p.confidence * 100)}% conf)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                  Verified Real-World Outcome
                </label>
                <select
                  value={actualOutcome}
                  onChange={(e) => setActualOutcome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="PREVENTED">PREVENTED — Intervention averted deal loss/churn</option>
                  <option value="CONFIRMED_CHURN">CONFIRMED_CHURN — Account churned as predicted</option>
                  <option value="LOST">LOST — Opportunity lost due to stalled decision</option>
                  <option value="RENEWED">RENEWED — Contract successfully renewed</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE — Predicted risk did not materialize</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                  Verification Source
                </label>
                <input
                  type="text"
                  value={verificationSource}
                  onChange={(e) => setVerificationSource(e.target.value)}
                  placeholder="e.g. CRM Closed-Won Telemetry, Executive Review"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                  Audit Notes &amp; Evidence
                </label>
                <textarea
                  rows={3}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Document notes regarding actual customer outcome..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Recording...' : 'Save & Calibrate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
