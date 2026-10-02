import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DecisionContract } from '../types';
import { useToast } from '../context/ToastContext';
import {
  FileCheck2, Plus, ExternalLink
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
        message: 'Contract executed. Decision debt has been recalculated.',
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
      await api.escalateContract(id, 'Triggered escalation from contracts ledger');
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

  return (
    <div className="space-y-5 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            <span>Decision Contracts</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Accountability Protocol
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Explicit commitments with owner accountability, strict deadlines, and automated escalation conditions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Decision Contract</span>
        </button>
      </div>

      {/* Filter Tabs & Owner Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-md text-xs">
          {['ALL', 'PENDING', 'OVERDUE', 'ESCALATED', 'COMPLETED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Contracts' : st}
            </button>
          ))}
        </div>

        {/* Owner Dropdown */}
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-slate-600"
        >
          <option value="ALL">All Owners</option>
          <option value="Sarah Chen">Sarah Chen</option>
          <option value="Marcus Vance">Marcus Vance</option>
          <option value="Elena Rostova">Elena Rostova</option>
          <option value="Devon Park">Devon Park</option>
        </select>
      </div>

      {/* Contracts Table */}
      <div className="p-4 rounded-md bg-[#111726] border border-slate-800">
        {loading ? (
          <div className="space-y-3 py-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-900 rounded border border-slate-800"></div>
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No decision contracts match the selected filters.
          </div>
        ) : (
          <div className="space-y-2.5">
            {contracts.map((cnt) => (
              <div
                key={cnt.id}
                className="p-3.5 rounded bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                        cnt.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : cnt.status === 'OVERDUE'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : cnt.status === 'ESCALATED'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {cnt.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectAccount(cnt.account_id)}
                      className="font-medium text-slate-200 hover:text-blue-400 inline-flex items-center gap-1 transition-colors"
                    >
                      <span>{cnt.account_id}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </button>

                    <span className="font-semibold text-slate-100">{cnt.action}</span>
                  </div>

                  <p className="text-slate-300">
                    <strong className="text-slate-400 font-normal">Escalation Protocol:</strong> {cnt.escalation_rule}
                    {cnt.escalation_target && (
                      <span className="text-slate-400 font-mono ml-1">→ {cnt.escalation_target}</span>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span>Owner: <strong className="text-slate-200 font-normal">{cnt.owner}</strong></span>
                    <span>Deadline: <strong className="font-mono text-slate-200">{new Date(cnt.deadline).toLocaleDateString()}</strong></span>
                    {cnt.reason && <span className="text-slate-500 truncate max-w-sm">{cnt.reason}</span>}
                  </div>
                </div>

                {/* State Transition Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {cnt.status !== 'COMPLETED' && (
                    <>
                      <button
                        type="button"
                        disabled={actionInProgressId === cnt.id}
                        onClick={() => handleComplete(cnt.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        disabled={actionInProgressId === cnt.id}
                        onClick={() => handleEscalate(cnt.id)}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Escalate
                      </button>
                      <button
                        type="button"
                        disabled={actionInProgressId === cnt.id}
                        onClick={() => handleSnooze(cnt.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Snooze 3d
                      </button>
                    </>
                  )}
                  {cnt.status === 'COMPLETED' && (
                    <span className="text-xs font-mono text-emerald-400 font-medium">
                      ✓ Executed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Creation Modal */}
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
