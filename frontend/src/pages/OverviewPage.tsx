import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import {
  AlertOctagon, DollarSign, AlertTriangle, Clock, ShieldCheck,
  ChevronRight, Activity, ArrowRight, RefreshCw
} from 'lucide-react';

interface OverviewPageProps {
  onSelectAccount: (id: string) => void;
  setCurrentTab: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onSelectAccount, setCurrentTab }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    api.getDashboard()
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load executive dashboard telemetry');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 p-4 lg:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-900 rounded-md border border-slate-800"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-900 rounded-md border border-slate-800"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-[#111726] border border-slate-800 rounded-lg">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
        <h3 className="font-semibold text-sm text-slate-100">Telemetry Feed Disconnected</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">{error || 'Unable to establish connection with Pipeline IQ backend.'}</p>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const primaryKpis = [
    {
      label: 'TOTAL DECISION DEBT',
      value: `${metrics.total_decision_debt}`,
      unit: 'pts',
      subtext: 'Accumulated pipeline delay',
      tab: 'decision-debt',
      color: 'text-rose-400',
      statusBorder: 'border-l-2 border-rose-500',
    },
    {
      label: 'REVENUE AT RISK',
      value: `$${(metrics.total_revenue_at_risk / 1000000).toFixed(2)}M`,
      unit: '',
      subtext: 'Exposed pipeline capital',
      tab: 'accounts',
      color: 'text-amber-400',
      statusBorder: 'border-l-2 border-amber-500',
    },
    {
      label: 'CRITICAL DECISIONS',
      value: `${metrics.critical_decisions_count}`,
      unit: 'unresolved',
      subtext: 'Overdue or stalled',
      tab: 'action-center',
      color: 'text-rose-400',
      statusBorder: 'border-l-2 border-rose-500',
    },
    {
      label: 'OVERDUE ACTIONS',
      value: `${metrics.overdue_actions_count}`,
      unit: 'activities',
      subtext: 'Missed milestones & check-ins',
      tab: 'action-center',
      color: 'text-amber-400',
      statusBorder: 'border-l-2 border-amber-500',
    },
    {
      label: 'HIGH-RISK ACCOUNTS',
      value: `${metrics.high_risk_accounts_count}`,
      unit: '/ 55',
      subtext: 'Risk score ≥ 60%',
      tab: 'accounts',
      color: 'text-amber-400',
      statusBorder: 'border-l-2 border-amber-500',
    },
    {
      label: 'CALIBRATION ACCURACY',
      value: `${metrics.prediction_accuracy_rate}%`,
      unit: 'verified',
      subtext: 'Historical prediction ledger',
      tab: 'self-audit',
      color: 'text-emerald-400',
      statusBorder: 'border-l-2 border-emerald-500',
    },
  ];

  return (
    <div className="space-y-5 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Executive Decision Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational pipeline health, compounding decision debt, and capital exposure across 55 enterprise accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectAccount('acc-acme')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#161F33] hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-colors self-start sm:self-auto"
        >
          <span>Hero Account: ACME Technologies</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {primaryKpis.map((kpi, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentTab(kpi.tab)}
            className={`p-3 rounded-md bg-[#111726] border border-slate-800 hover:border-slate-700 text-left transition-colors flex flex-col justify-between ${kpi.statusBorder}`}
          >
            <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-medium">
              {kpi.label}
            </div>
            <div className="my-1.5">
              <span className={`text-xl font-bold font-mono tracking-tight ${kpi.color}`}>
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-[11px] text-slate-400 font-mono ml-1">{kpi.unit}</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {kpi.subtext}
            </div>
          </button>
        ))}
      </div>

      {/* Analytical Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Debt Trajectory (2 Cols) */}
        <div className="lg:col-span-2 p-4 rounded-md bg-[#111726] border border-slate-800">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <div>
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Compounding Decision Debt Trajectory
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Weekly accumulation of unaddressed pipeline decisions across all active deals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTab('decision-debt')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              <span>Formula Breakdown</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bar Chart Representation */}
          <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-40 pt-4 pb-2 border-b border-slate-800/80">
            {metrics.debt_trend_data.map((item, idx) => {
              const maxVal = Math.max(...metrics.debt_trend_data.map((d: any) => d.debt), 1);
              const heightPct = Math.max(16, Math.round((item.debt / maxVal) * 100));
              const isCurrent = idx === metrics.debt_trend_data.length - 1;

              return (
                <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.debt}
                  </span>
                  <div className="w-full max-w-[36px] bg-slate-900 border border-slate-800 rounded-t relative overflow-hidden flex flex-col justify-end" style={{ height: `${heightPct}%` }}>
                    <div
                      className={`w-full ${
                        isCurrent
                          ? 'bg-rose-500/80'
                          : 'bg-slate-700/80'
                      }`}
                      style={{ height: '100%' }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-medium mt-1">
                    {item.week}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2.5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-rose-500" />
                <span>Current Cycle Debt</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-slate-700" />
                <span>Baseline History</span>
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-400">
              Compounding rate: +38% over 6 weeks
            </span>
          </div>
        </div>

        {/* Portfolio Risk Distribution (1 Col) */}
        <div className="p-4 rounded-md bg-[#111726] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/80">
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Pipeline Risk Tiers
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                55 Accounts
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Categorization based on multi-factor decision delay and engagement signals.
            </p>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-rose-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Critical Risk ({metrics.risk_distribution.CRITICAL})
                  </span>
                  <span className="font-mono text-slate-300">
                    {Math.round((metrics.risk_distribution.CRITICAL / 55) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(metrics.risk_distribution.CRITICAL / 55) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Warning Tier ({metrics.risk_distribution.WARNING})
                  </span>
                  <span className="font-mono text-slate-300">
                    {Math.round((metrics.risk_distribution.WARNING / 55) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(metrics.risk_distribution.WARNING / 55) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Healthy Velocity ({metrics.risk_distribution.HEALTHY})
                  </span>
                  <span className="font-mono text-slate-300">
                    {Math.round((metrics.risk_distribution.HEALTHY / 55) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(metrics.risk_distribution.HEALTHY / 55) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Critical Tier Exposure:</span>
            <span className="font-mono font-semibold text-rose-400">
              ${((metrics.total_revenue_at_risk * 0.65) / 1000).toFixed(0)}k
            </span>
          </div>
        </div>
      </div>

      {/* Accounts Requiring Attention Table */}
      <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Accounts Requiring Immediate Attention
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ranked deterministically by compounding Decision Debt and revenue at risk.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentTab('accounts')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <span>View All 55 Accounts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <th className="pb-2 font-medium">Account Name</th>
                <th className="pb-2 font-medium">Owner</th>
                <th className="pb-2 font-medium">Decision Debt</th>
                <th className="pb-2 font-medium">Risk Score</th>
                <th className="pb-2 font-medium">Revenue at Risk</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.attention_accounts.map((acc) => {
                const isHero = acc.id === 'acc-acme';

                return (
                  <tr
                    key={acc.id}
                    onClick={() => onSelectAccount(acc.id)}
                    className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      isHero ? 'bg-blue-950/20 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <td className="py-2.5 font-medium text-slate-100 flex items-center gap-2">
                      <span>{acc.company_name}</span>
                      {isHero && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold">
                          Demo Hero
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-400">{acc.account_owner}</td>
                    <td className="py-2.5 font-mono">
                      <span className="font-semibold text-rose-400">
                        {acc.decision_debt_score}
                      </span>
                      <span className="text-slate-500 text-[10px]">/100</span>
                    </td>
                    <td className="py-2.5 font-mono text-amber-400">
                      {acc.risk_score}%
                    </td>
                    <td className="py-2.5 font-mono text-slate-200">
                      ${acc.revenue_at_risk.toLocaleString()}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                          acc.health_status === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : acc.health_status === 'WARNING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {acc.health_status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAccount(acc.id);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
