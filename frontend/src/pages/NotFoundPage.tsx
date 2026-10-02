import React from 'react';
import { AlertOctagon, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onReturnToDashboard: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onReturnToDashboard }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertOctagon className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">
          Decision Not Found
        </h1>

        <p className="text-sm text-slate-300 mt-2 mb-6">
          Looks like this decision doesn't exist.
        </p>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          The requested pipeline resource, account ID, or decision node may have been moved, resolved, or archived in the ledger.
        </p>

        <button
          type="button"
          onClick={onReturnToDashboard}
          className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
