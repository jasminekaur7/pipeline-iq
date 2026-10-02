import React from 'react';
import { Menu, Sparkles, ShieldAlert, Search, Database } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openCopilot: () => void;
  toggleMobileMenu: () => void;
  actionCenterCount?: number;
  onSearchChange?: (val: string) => void;
  searchQuery?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  setCurrentTab,
  openCopilot,
  toggleMobileMenu,
  actionCenterCount = 5,
  onSearchChange,
  searchQuery = '',
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 h-16 flex items-center justify-between">
      {/* Left: Mobile hamburger & Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clickable Logo */}
        <button
          type="button"
          onClick={() => setCurrentTab('overview')}
          className="flex items-center gap-2.5 group text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-lg p-1"
          aria-label="Pipeline IQ Home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center p-0.5 shadow-md shadow-emerald-950/40">
            <div className="w-full h-full bg-[#0B132B] rounded-[6px] flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h5l3-6h8" />
                <path d="M9 12l3 6h8" stroke="#38BDF8" />
                <circle cx="4" cy="12" r="2" fill="#10B981" />
                <circle cx="20" cy="6" r="2" fill="#10B981" />
                <circle cx="20" cy="18" r="2" fill="#38BDF8" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Pipeline IQ
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
              Decision Intelligence
            </p>
          </div>
        </button>
      </div>

      {/* Middle: Quick Search (on accounts) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search accounts, owners, decisions... (Press / to focus)"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Right: Environment badge, Action Center Alert, Copilot */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Demo Environment Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Database className="w-3 h-3 text-slate-400" />
          <span>Demo Environment</span>
        </div>

        {/* Action Center quick button */}
        <button
          type="button"
          onClick={() => setCurrentTab('action-center')}
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          title="Action Center Priority Queue"
          aria-label={`Action Center: ${actionCenterCount} urgent items`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          {actionCenterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-bold rounded-full text-[9px] flex items-center justify-center">
              {actionCenterCount}
            </span>
          )}
        </button>

        {/* AI Copilot launcher button */}
        <button
          type="button"
          onClick={openCopilot}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium text-xs transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Open AI Copilot query assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Ask Pipeline IQ</span>
          <kbd className="hidden lg:inline font-mono text-[10px] px-1 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};
