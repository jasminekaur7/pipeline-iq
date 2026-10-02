import React from 'react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#090D16] py-6 px-4 lg:px-8 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand info */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <span className="font-semibold text-slate-200">Pipeline IQ</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="text-slate-400">
            Decision intelligence for modern revenue teams.
          </span>
        </div>

        {/* Navigation links */}
        <div className="flex items-center gap-5 text-xs">
          <button
            type="button"
            onClick={() => setCurrentTab('overview')}
            className="hover:text-emerald-400 transition-colors"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('decision-debt')}
            className="hover:text-emerald-400 transition-colors"
          >
            Decision Debt
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('action-center')}
            className="hover:text-emerald-400 transition-colors"
          >
            Action Center
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('self-audit')}
            className="hover:text-emerald-400 transition-colors"
          >
            Self-Audit
          </button>
        </div>

        {/* Copyright */}
        <div className="text-slate-500 font-mono text-[11px]">
          © {currentYear} Pipeline IQ. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
