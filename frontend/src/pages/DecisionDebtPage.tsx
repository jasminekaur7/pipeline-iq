import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  AlertOctagon, Filter, User, Clock, DollarSign,
  TrendingUp, ArrowUpRight, HelpCircle, CheckCircle, ChevronDown
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
            Decision Debt Intelligence
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Deterministic formula: <code className="text-emerald-400 font-mono text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              Severity × Urgency × Business Value × Relationship Impact × Delay Factor × Confidence
            </code>
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
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
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Owners</option>
            <option value="Sarah Chen">Sarah Chen</option>
            <option value="Marcus Vance">Marcus Vance</option>
            <option value="Elena Rostova">Elena Rostova</option>
            <option value="Devon Park">Devon Park</option>
          </select>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Decision Debt</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {data.total_decision_debt} <span className="text-xs text-slate-400 font-sans">pts</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across 55 accounts in pipeline</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Critical Tier Debt</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {data.critical_debt} <span className="text-xs text-slate-400 font-sans">pts</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Accounts scoring &ge; 75/100</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Overdue Action Debt</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {data.overdue_debt} <span className="text-xs text-slate-400 font-sans">pts</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Attributed to missed deadlines</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Revenue Tied to Debt</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${(data.revenue_tied_to_debt / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Directly exposed pipeline capital</div>
        </div>
      </div>

      {/* Debt by Owner & Debt by Age Bracket */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Debt by Owner */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>Decision Debt by Pipeline Owner</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Accountability distribution</span>
          </div>

          <div className="space-y-3 mt-3">
            {data.debt_by_owner.map((ownerItem: any) => {
              const maxDebt = Math.max(...data.debt_by_owner.map((o: any) => o.total_debt), 1);
              const pct = Math.round((ownerItem.total_debt / maxDebt) * 100);

              return (
                <div key={ownerItem.owner} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-medium">{ownerItem.owner}</span>
                    <span className="font-mono text-slate-300">
                      {ownerItem.total_debt} pts ({ownerItem.critical_accounts} critical accs)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Debt by Age Bracket */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Decision Debt Aging Velocity</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Compounding delay duration</span>
            </div>
            <p className="text-xs text-slate-400">
              The older an unmade decision remains, the higher the relationship atrophy and churn probability.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
            {data.debt_by_age.map((ageItem: any) => (
              <div key={ageItem.bracket} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-[10px] uppercase font-mono text-slate-400">{ageItem.bracket}</div>
                <div className="text-lg font-bold font-mono text-slate-100 mt-1">{ageItem.debt_points}</div>
                <div className="text-[10px] text-slate-500">{ageItem.count} decisions</div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <span>Historical analysis confirms deals untouched &gt;14 days show a 74% decline in close rate.</span>
          </div>
        </div>
      </div>

      {/* Account Decision Debt Deep-Dive with Contributor Breakdown */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm text-slate-100">
              Transparent Account Debt Breakdown
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every score exposes its mathematical contributors. Click row to expand full contributor ledger.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Showing {data.accounts.length} accounts
          </span>
        </div>

        <div className="space-y-3">
          {data.accounts.map((acc: any) => {
            const isExpanded = expandedAccount === acc.account_id;
            const isHero = acc.account_id === 'acc-acme';

            return (
              <div
                key={acc.account_id}
                className={`rounded-xl border transition-all ${
                  isHero
                    ? 'border-emerald-500/60 bg-slate-900/90'
                    : isExpanded
                    ? 'border-slate-700 bg-slate-900/80'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                {/* Header row */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedAccount(isExpanded ? null : acc.account_id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setExpandedAccount(isExpanded ? null : acc.account_id); }}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        acc.decision_debt_score >= 75
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : acc.decision_debt_score >= 50
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {acc.decision_debt_score}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">{acc.company_name}</span>
                        {isHero && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                            Primary Demo Scenario
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">({acc.industry})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Owner: <strong className="text-slate-300 font-medium">{acc.owner}</strong> • Revenue at Risk:{' '}
                        <strong className="text-amber-400 font-mono">${acc.revenue_at_risk.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                        acc.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : acc.severity === 'ELEVATED'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {acc.severity}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAccount(acc.account_id);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Expanded Contributor Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/40">
                    <div className="text-[11px] uppercase font-mono text-slate-400 mb-2 font-semibold">
                      Transparent Contributor Breakdown (Mathematical Score Drivers):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {acc.top_contributors.map((c: any, cIdx: number) => (
                        <div
                          key={cIdx}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-mono font-bold text-amber-400 shrink-0">
                              +{c.points}
                            </span>
                            <span className="text-slate-200">{c.description}</span>
                          </div>
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                              c.severity === 'CRITICAL'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {c.category.replace('_', ' ')}
                          </span>
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
