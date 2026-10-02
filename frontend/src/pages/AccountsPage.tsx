import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Account } from '../types';
import { Building2, Search, ArrowUpDown, ArrowUpRight, AlertOctagon, DollarSign, Activity } from 'lucide-react';

interface AccountsPageProps {
  onSelectAccount: (id: string) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  onSelectAccount,
  searchQuery = '',
  onSearchChange,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('decision_debt_score');
  const [order, setOrder] = useState<string>('desc');

  useEffect(() => {
    setLoading(true);
    api.getAccounts({
      search: searchQuery,
      status: statusFilter,
      sort_by: sortBy,
      order: order,
    })
      .then((data) => {
        setAccounts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load accounts', err);
        setLoading(false);
      });
  }, [searchQuery, statusFilter, sortBy, order]);

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Enterprise Accounts
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Tracking decision debt velocity, stakeholder engagement, and pipeline exposure across 55 accounts.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search companies..."
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Health Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Health Statuses</option>
            <option value="CRITICAL">Critical Health</option>
            <option value="WARNING">Warning Tier</option>
            <option value="HEALTHY">Healthy Flow</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="decision_debt_score">Sort by Decision Debt</option>
            <option value="risk_score">Sort by Risk Score</option>
            <option value="revenue_at_risk">Sort by Revenue at Risk</option>
            <option value="account_value">Sort by Account Value</option>
            <option value="company_name">Sort by Name</option>
          </select>

          <button
            type="button"
            onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
            title={`Toggle order (${order})`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Account Table */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="space-y-3 py-8 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-800/40 rounded-lg"></div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No accounts match the current filter or search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="pb-3 font-medium">Company Name</th>
                  <th className="pb-3 font-medium">Industry</th>
                  <th className="pb-3 font-medium">Account Owner</th>
                  <th className="pb-3 font-medium">Decision Debt</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">Revenue at Risk</th>
                  <th className="pb-3 font-medium">Health Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {accounts.map((acc) => {
                  const isHero = acc.id === 'acc-acme';

                  return (
                    <tr
                      key={acc.id}
                      onClick={() => onSelectAccount(acc.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isHero ? 'bg-emerald-950/20 border-l-2 border-emerald-500' : ''
                      }`}
                    >
                      <td className="py-3.5 font-medium text-slate-100 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{acc.company_name}</span>
                        {isHero && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                            Demo Case
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono text-[11px]">{acc.industry}</td>
                      <td className="py-3.5 text-slate-300">{acc.account_owner}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              acc.decision_debt_score >= 75
                                ? 'text-rose-400'
                                : acc.decision_debt_score >= 50
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {acc.decision_debt_score}/100
                          </span>
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                acc.decision_debt_score >= 75
                                  ? 'bg-rose-500'
                                  : acc.decision_debt_score >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${acc.decision_debt_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-slate-300">{acc.risk_score}%</td>
                      <td className="py-3.5 font-mono font-medium text-amber-400">
                        ${acc.revenue_at_risk.toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
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
                      <td className="py-3.5 text-right">
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
        )}
      </div>
    </div>
  );
};
