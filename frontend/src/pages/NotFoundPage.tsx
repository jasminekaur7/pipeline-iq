import React from 'react';
import { AlertOctagon, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onReturnToDashboard: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onReturnToDashboard }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-xl bg-[#111726] border border-[#1E293B] shadow-2xl flex flex-col items-center">
        <div className="w-12 h-12 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertOctagon className="w-6 h-6" />
        </div>

        <h1 className="text-lg font-bold text-white tracking-tight">
          Resource Not Found
        </h1>

        <p className="text-sm text-slate-300 mt-2 mb-4">
          The requested route or pipeline resource cannot be resolved.
        </p>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The account identifier, decision contract, or page state may have been moved or does not exist in the decision index.
        </p>

        <button
          type="button"
          onClick={onReturnToDashboard}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Operational Overview</span>
        </button>
      </div>
    </div>
  );
};

