import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DecisionContract } from '../types';
import { useToast } from '../context/ToastContext';
import {
  FileCheck2, CheckCircle2, Clock, AlertTriangle, ShieldAlert,
  ArrowUpRight, Plus, RefreshCw, Filter, User
} from 'lucide-react';
import { DecisionContractModal } from '../components/DecisionContractModal';

interface DecisionContractsPageProps {
  onSelectAccount: (id: string) => void;
}

export const DecisionContractsPage: React.FC<DecisionContractsPageProps> = ({ onSelectAccount }) => {
  const { addToast } = useToast();
  const [contracts, setContracts] = useState<DecisionContract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const fetchContracts = () => {
    setLoading(true);
    api.getContracts({
      status: statusFilter,
      owner: ownerFilter,
    })
      .then((data) => {
        setContracts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load contracts', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchContracts();
  }, [statusFilter, ownerFilter]);

  const handleComplete = async (id: string) => {
    setActionInProgressId(id);
    try {
      await api.completeContract(id, 'Decision completed by owner');
      addToast({
        type: 'success',
        title: 'Decision Contract Completed',
        message: 'Contract executed. Decision debt has been decreased.',
      });
      fetchContracts();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Completion failed',
        message: err.message,
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleEscalate = async (id: string) => {
    setActionInProgressId(id);
    try {
      await api.escalateContract(id, 'Manually triggered escalation from contracts ledger');
      addToast({
        type: 'warning',
        title: 'Decision Contract Escalated',
        message: 'Contract escalated to leadership per escalation protocol.',
      });
      fetchContracts();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Escalation failed',
        message: err.message,
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleSnooze = async (id: string) => {
    setActionInProgressId(id);
    try {
      await api.snoozeContract(id, 3);
      addToast({
        type: 'info',
        title: 'Contract Snoozed',
        message: 'Deadline extended by 3 days with documented reason.',
      });
      fetchContracts();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Snooze failed',
        message: err.message,
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const statusCounts = {
    ALL: contracts.length,
    PENDING: contracts.filter((c) => c.status === 'PENDING').length,
    OVERDUE: contracts.filter((c) => c.status === 'OVERDUE').length,
    ESCALATED: contracts.filter((c) => c.status === 'ESCALATED').length,
    COMPLETED: contracts.filter((c) => c.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Decision Contracts</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Accountability Protocol
            </span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Explicit commitments with owner accountability, strict deadlines, and automated escalation conditions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Decision Contract</span>
        </button>
      </div>

      {/* Status Tabs and Owner Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {(['ALL', 'PENDING', 'OVERDUE', 'ESCALATED', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === tab
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>{tab === 'ALL' ? 'All Contracts' : tab.replace('_', ' ')}</span>
            </button>
          ))}
        </div>

        {/* Owner filter */}
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Owners</option>
            <option value="Sarah Chen">Sarah Chen</option>
            <option value="Marcus Vance">Marcus Vance</option>
            <option value="Elena Rostova">Elena Rostova</option>
            <option value="Devon Park">Devon Park</option>
          </select>
        </div>
      </div>

      {/* Contract Cards */}
      {loading ? (
        <div className="space-y-3 py-8 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-xl"></div>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-400">
          No decision contracts found for the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((cnt) => (
            <div
              key={cnt.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                cnt.status === 'OVERDUE'
                  ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700/60'
                  : cnt.status === 'ESCALATED'
                  ? 'bg-amber-950/20 border-amber-900/50 hover:border-amber-700/60'
                  : cnt.status === 'COMPLETED'
                  ? 'bg-slate-900/40 border-slate-800 opacity-80'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                      cnt.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : cnt.status === 'OVERDUE'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : cnt.status === 'ESCALATED'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    }`}
                  >
                    {cnt.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectAccount(cnt.account_id)}
                    className="font-semibold text-sm text-slate-100 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  >
                    <span>{cnt.company_name}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-white">{cnt.action}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">{cnt.reason}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Owner: <strong className="text-slate-200">{cnt.owner}</strong></span>
                  <span>Deadline: <strong className="text-amber-400 font-mono">{new Date(cnt.deadline).toLocaleDateString()}</strong></span>
                  <span>Escalation Rule: <strong className="text-slate-300 font-normal">{cnt.escalation_rule}</strong></span>
                </div>

                {cnt.outcome && (
                  <div className="mt-1 text-[11px] text-emerald-400 font-mono">
                    Outcome: {cnt.outcome}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                {cnt.status !== 'COMPLETED' && (
                  <>
                    <button
                      type="button"
                      disabled={actionInProgressId === cnt.id}
                      onClick={() => handleComplete(cnt.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      disabled={actionInProgressId === cnt.id}
                      onClick={() => handleEscalate(cnt.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                    >
                      Escalate
                    </button>
                    <button
                      type="button"
                      disabled={actionInProgressId === cnt.id}
                      onClick={() => handleSnooze(cnt.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    >
                      Snooze (+3d)
                    </button>
                  </>
                )}
                {cnt.status === 'COMPLETED' && (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating contract */}
      <DecisionContractModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        accountId="acc-acme"
        accountName="ACME Technologies"
        defaultOwner="Sarah Chen"
        onCreated={fetchContracts}
      />
    </div>
  );
};
