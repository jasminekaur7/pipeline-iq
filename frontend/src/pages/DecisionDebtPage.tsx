import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  AlertOctagon, Clock, DollarSign,
  ChevronDown, ChevronRight, Calculator,
  ArrowRight
} from 'lucide-react';

interface DecisionDebtPageProps {
  onSelectAccount: (id: string) => void;
}

export const DecisionDebtPage: React.FC<DecisionDebtPageProps> = ({ onSelectAccount }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [expandedAccount, setExpandedAccount] = useState<string | null>('acc-acme');

  useEffect(() => {
    setLoading(true);
    api.getDecisionDebt({
      severity: severityFilter,
      owner: ownerFilter,
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load decision debt', err);
        setLoading(false);
      });
  }, [severityFilter, ownerFilter]);

  if (loading || !data) {
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
      {/* Page Header */}
      <div className="pb-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            <span>Decision Debt Index</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic quantification of compounding business delay and stakeholder friction.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-slate-600"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Debt (75+ pts)</option>
            <option value="ELEVATED">Elevated Debt (50-74 pts)</option>
            <option value="MODERATE">Moderate Debt (25-49 pts)</option>
            <option value="LOW">Low Debt (&lt;25 pts)</option>
          </select>

          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-slate-600"
          >
            <option value="ALL">All Pipeline Owners</option>
            <option value="Sarah Chen">Sarah Chen</option>
            <option value="Marcus Vance">Marcus Vance</option>
            <option value="Elena Rostova">Elena Rostova</option>
            <option value="Devon Park">Devon Park</option>
          </select>
        </div>
      </div>

      {/* Formula Specification Banner */}
      <div className="p-3.5 rounded-md bg-[#111726] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded bg-slate-900 border border-slate-700/80 text-blue-400 shrink-0 mt-0.5">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 tracking-wide uppercase font-mono">
              Deterministic Scoring Formula
            </div>
            <div className="text-xs font-mono text-blue-300 mt-0.5">
              Debt Score = Severity × Urgency × Business Value × Relationship Impact × Delay Factor × Confidence
            </div>
          </div>
        </div>
        <div className="text-[11px] font-mono text-slate-400 shrink-0">
          Bounded Range: <span className="text-white font-semibold">0 — 100</span> pts
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-md bg-[#111726] border border-slate-800 border-l-2 border-l-rose-500">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Total Decision Debt
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {data.total_decision_debt} <span className="text-xs text-slate-400 font-sans">pts</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Accumulated across 55 accounts</div>
        </div>

        <div className="p-3.5 rounded-md bg-[#111726] border border-slate-800 border-l-2 border-l-rose-500">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Critical Tier Debt
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {data.critical_debt} <span className="text-xs text-slate-400 font-sans">pts</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Accounts scoring ≥ 75/100</div>
        </div>

        <div className="p-3.5 rounded-md bg-[#111726] border border-slate-800 border-l-2 border-l-amber-500">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Overdue Action Debt
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {data.overdue_debt} <span className="text-xs text-slate-400 font-sans">pts</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Attributed to missed deadlines</div>
        </div>

        <div className="p-3.5 rounded-md bg-[#111726] border border-slate-800 border-l-2 border-l-blue-500">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Revenue Tied to Debt
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${(data.revenue_tied_to_debt / 1000000).toFixed(2)}M
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Directly exposed pipeline capital</div>
        </div>
      </div>

      {/* Debt by Owner & Aging Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Debt by Owner */}
        <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Decision Debt by Pipeline Owner
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Distribution</span>
          </div>

          <div className="space-y-3">
            {data.debt_by_owner.map((ownerItem: any) => {
              const maxDebt = Math.max(...data.debt_by_owner.map((o: any) => o.total_debt), 1);
              const pct = Math.round((ownerItem.total_debt / maxDebt) * 100);

              return (
                <div key={ownerItem.owner} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-medium">{ownerItem.owner}</span>
                    <span className="font-mono text-slate-300">
                      {ownerItem.total_debt} pts ({ownerItem.critical_accounts} critical)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Debt by Age Bracket */}
        <div className="p-4 rounded-md bg-[#111726] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/80">
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Debt Velocity by Aging Bracket
              </h2>
              <span className="text-[10px] font-mono text-slate-400">Resolution delay</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Unresolved decisions past 14 days compound risk exponentially due to stakeholder decay.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {data.debt_by_age.map((ageItem: any) => (
                <div key={ageItem.bracket} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-mono text-slate-400">{ageItem.bracket}</div>
                  <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">{ageItem.debt_points}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{ageItem.count} decisions</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px] text-amber-300 flex items-center gap-2">
            <span>Historical correlation: Deals untouched &gt;14 days show a 74% decline in close rate.</span>
          </div>
        </div>
      </div>

      {/* Transparent Account Debt Breakdown */}
      <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Transparent Account Debt Breakdown
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click any account row to inspect its exact mathematical point attribution and entity linkages.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {data.accounts.length} accounts listed
          </span>
        </div>

        <div className="space-y-2">
          {data.accounts.map((acc: any) => {
            const isExpanded = expandedAccount === acc.account_id;
            const isHero = acc.account_id === 'acc-acme';

            return (
              <div
                key={acc.account_id}
                className={`rounded-md border transition-colors ${
                  isHero
                    ? 'border-blue-500/50 bg-[#161F33]'
                    : isExpanded
                    ? 'border-slate-700 bg-slate-900'
                    : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                {/* Header row */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedAccount(isExpanded ? null : acc.account_id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setExpandedAccount(isExpanded ? null : acc.account_id); }}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded flex items-center justify-center font-mono font-bold text-xs ${
                        acc.decision_debt_score >= 75
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : acc.decision_debt_score >= 50
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {acc.decision_debt_score}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-100">
                          {acc.company_name}
                        </span>
                        {isHero && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold">
                            Hero Account
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                          {acc.account_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Owner: <strong className="text-slate-300 font-normal">{acc.account_owner}</strong> • Revenue at Risk:{' '}
                        <strong className="text-slate-200 font-mono">${acc.revenue_at_risk.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAccount(acc.account_id);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1 border border-slate-700"
                    >
                      <span>Full Account Intel</span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                    </button>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Contributor Ledger */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-800/80 bg-slate-950/60">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                      Mathematical Contributors ({acc.breakdown?.contributors?.length || 0} factors)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {acc.breakdown?.contributors?.map((c: any, cIdx: number) => (
                        <div
                          key={cIdx}
                          className="p-2.5 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between"
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
                          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                            {c.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
