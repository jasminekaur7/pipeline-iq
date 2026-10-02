import React from 'react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800 bg-[#0B0F17] py-4 px-4 lg:px-6 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand info */}
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="font-semibold text-slate-200">Pipeline IQ</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            Enterprise Decision Intelligence &amp; Pipeline Risk Architecture
          </span>
        </div>

        {/* Navigation quick links */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setCurrentTab('overview')}
            className="text-slate-400 hover:text-blue-400 transition-colors"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('decision-debt')}
            className="text-slate-400 hover:text-blue-400 transition-colors"
          >
            Decision Debt
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('accounts')}
            className="text-slate-400 hover:text-blue-400 transition-colors"
          >
            Accounts
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('action-center')}
            className="text-slate-400 hover:text-blue-400 transition-colors"
          >
            Action Center
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('self-audit')}
            className="text-slate-400 hover:text-blue-400 transition-colors"
          >
            Self-Audit
          </button>
        </div>

        {/* Copyright */}
        <div className="text-slate-500 font-mono text-[11px]">
          © {currentYear} Pipeline IQ
        </div>
      </div>
    </footer>
  );
};
