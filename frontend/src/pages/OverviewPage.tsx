import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardMetrics, Account, DecisionContract } from '../types';
import {
  AlertOctagon, DollarSign, AlertTriangle, Clock, ShieldCheck,
  TrendingUp, ArrowUpRight, CheckCircle2, ChevronRight, Activity, ArrowRight
} from 'lucide-react';

interface OverviewPageProps {
  onSelectAccount: (id: string) => void;
  setCurrentTab: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onSelectAccount, setCurrentTab }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getDashboard()
      .then((data) => {
        if (mounted) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load dashboard metrics');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/60 rounded-xl border border-slate-800"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-800/40 rounded-xl border border-slate-800"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-xl">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-100">Dashboard Unavailable</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">{error || 'Unable to connect to service'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-500 text-slate-950 font-semibold text-xs rounded-lg"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const topCards = [
    {
      title: 'Total Decision Debt',
      value: `${metrics.total_decision_debt} pts`,
      sub: 'Compounding unresolved actions',
      icon: AlertOctagon,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      tab: 'decision-debt',
    },
    {
      title: 'Revenue at Risk',
      value: `$${(metrics.total_revenue_at_risk / 1000000).toFixed(2)}M`,
      sub: 'Exposed pipeline capital',
      icon: DollarSign,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      tab: 'accounts',
    },
    {
      title: 'Critical Decisions',
      value: metrics.critical_decisions_count,
      sub: 'Unassigned or overdue decisions',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      tab: 'action-center',
    },
    {
      title: 'Overdue Actions',
      value: metrics.overdue_actions_count,
      sub: 'Missed milestones & check-ins',
      icon: Clock,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      tab: 'action-center',
    },
    {
      title: 'High-Risk Accounts',
      value: metrics.high_risk_accounts_count,
      sub: 'Accounts exceeding 60% risk',
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      tab: 'accounts',
    },
    {
      title: 'Prediction Accuracy',
      value: `${metrics.prediction_accuracy_rate}%`,
      sub: 'Verified vs historical outcomes',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      tab: 'self-audit',
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Page Title & Hero Callout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Executive Decision Intelligence
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Find the decisions your business is quietly paying for. Tracking compounding delay and revenue exposure.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectAccount('acc-acme')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all self-start md:self-auto"
        >
          <span>Inspect Hero Case: ACME Technologies</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {topCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentTab(c.tab)}
              className="p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[11px] font-medium text-slate-400 line-clamp-1">
                  {c.title}
                </span>
                <div className={`p-1 rounded-md ${c.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                </div>
              </div>
              <div>
                <div className="text-lg lg:text-xl font-bold text-white tracking-tight font-mono">
                  {c.value}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  {c.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Decision Debt Trend & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend Visualization (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-100">
                  Decision Debt Trajectory
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Compounding Trajectory
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Weekly accumulated unaddressed business decisions vs exposed revenue.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTab('decision-debt')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              <span>Inspect Breakdown</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bar / Trend Representation */}
          <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-44 pt-4 pb-2 border-b border-slate-800/80">
            {metrics.debt_trend_data.map((item, idx) => {
              const maxVal = metrics.debt_trend_data[metrics.debt_trend_data.length - 1].debt;
              const heightPct = Math.max(18, Math.round((item.debt / maxVal) * 100));

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.debt}
                  </span>
                  <div className="w-full max-w-[42px] bg-slate-800 rounded-t-lg relative overflow-hidden flex flex-col justify-end" style={{ height: `${heightPct}%` }}>
                    <div
                      className={`w-full ${
                        idx === metrics.debt_trend_data.length - 1
                          ? 'bg-gradient-to-t from-rose-600 to-amber-500'
                          : 'bg-slate-700 group-hover:bg-slate-600'
                      } transition-all`}
                      style={{ height: '100%' }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-medium">
                    {item.week}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[11px]">Active Decision Debt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="text-[11px]">Trailing Baseline</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-amber-400">
              +38% compounding rate over 6 weeks
            </span>
          </div>
        </div>

        {/* Risk Distribution Breakdown (1 Col) */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-slate-100">
                Pipeline Risk Distribution
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                55 Accounts
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Categorization based on multi-entity warning signals.
            </p>
          </div>

          <div className="my-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Critical Health ({metrics.risk_distribution.CRITICAL})
                </span>
                <span className="font-mono text-slate-300">
                  {Math.round((metrics.risk_distribution.CRITICAL / 55) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${(metrics.risk_distribution.CRITICAL / 55) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Warning Tier ({metrics.risk_distribution.WARNING})
                </span>
                <span className="font-mono text-slate-300">
                  {Math.round((metrics.risk_distribution.WARNING / 55) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(metrics.risk_distribution.WARNING / 55) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Healthy Flow ({metrics.risk_distribution.HEALTHY})
                </span>
                <span className="font-mono text-slate-300">
                  {Math.round((metrics.risk_distribution.HEALTHY / 55) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(metrics.risk_distribution.HEALTHY / 55) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Critical Revenue Exposure:</span>
            <span className="font-mono font-semibold text-rose-400">
              ${(metrics.total_revenue_at_risk * 0.65 / 1000).toFixed(0)}k
            </span>
          </div>
        </div>
      </div>

      {/* Accounts Requiring Attention Table */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <span>Accounts Requiring Immediate Attention</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Sorted by Decision Debt
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Accounts accumulating high delay factors, inactive stakeholders, and stalled deals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentTab('accounts')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
          >
            <span>View All 55 Accounts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="pb-2.5 font-medium">Account Name</th>
                <th className="pb-2.5 font-medium">Owner</th>
                <th className="pb-2.5 font-medium">Decision Debt</th>
                <th className="pb-2.5 font-medium">Account Risk</th>
                <th className="pb-2.5 font-medium">Revenue at Risk</th>
                <th className="pb-2.5 font-medium">Health Status</th>
                <th className="pb-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.attention_accounts.map((acc) => {
                const isHero = acc.id === 'acc-acme';

                return (
                  <tr
                    key={acc.id}
                    onClick={() => onSelectAccount(acc.id)}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      isHero ? 'bg-emerald-950/20 border-l-2 border-emerald-500' : ''
                    }`}
                  >
                    <td className="py-3 font-medium text-slate-100 flex items-center gap-2">
                      <span>{acc.company_name}</span>
                      {isHero && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                          Demo Hero
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-400">{acc.account_owner}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-rose-400">
                          {acc.decision_debt_score}/100
                        </span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${acc.decision_debt_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-slate-300">{acc.risk_score}%</td>
                    <td className="py-3 font-mono font-medium text-amber-400">
                      ${acc.revenue_at_risk.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
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
                    <td className="py-3 text-right">
                      <span className="text-slate-400 hover:text-emerald-400 text-xs inline-flex items-center gap-1 font-medium">
                        Inspect
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Decision Contracts strip */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <span>Active Decision Contracts</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Autonomous Commitments
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Accountability contracts preventing delayed pipeline execution.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentTab('decision-contracts')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
          >
            <span>Manage All Contracts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.recent_contracts.slice(0, 3).map((cnt) => (
            <div
              key={cnt.id}
              onClick={() => onSelectAccount(cnt.account_id)}
              className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-100 line-clamp-1">
                    {cnt.company_name}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                      cnt.status === 'OVERDUE'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : cnt.status === 'ESCALATED'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {cnt.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {cnt.action}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Owner: <strong className="text-slate-200">{cnt.owner}</strong></span>
                <span className="font-mono text-[10px] text-amber-400">
                  Due: {new Date(cnt.deadline).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
