import React from 'react';
import { Menu, Search, ShieldAlert, MessageSquareCode, Database } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full bg-[#0B0F17] border-b border-slate-800 px-4 lg:px-6 h-14 flex items-center justify-between">
      {/* Left: Mobile menu toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-600"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clickable Logo */}
        <button
          type="button"
          onClick={() => setCurrentTab('overview')}
          className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-1 focus:ring-slate-600 rounded-md p-1 group"
          aria-label="Pipeline IQ - Return to Executive Overview"
        >
          <div className="w-7 h-7 rounded bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-100 group-hover:border-slate-500 transition-colors">
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h5l3-6h8" />
              <path d="M8 12l3 6h8" stroke="#60A5FA" />
              <circle cx="3" cy="12" r="1.5" fill="#3B82F6" />
              <circle cx="19" cy="6" r="1.5" fill="#3B82F6" />
              <circle cx="19" cy="18" r="1.5" fill="#60A5FA" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-semibold text-sm tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Pipeline IQ
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block tracking-wide uppercase font-mono">
              Decision Intelligence
            </p>
          </div>
        </button>
      </div>

      {/* Middle: Fast Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search accounts, owners, decisions... (Press / to focus)"
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-900/90 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 bg-slate-800 px-1 py-0.2 rounded border border-slate-700 pointer-events-none">
            /
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Demo Data • 55 Accounts</span>
        </div>

        {/* Action Center quick link */}
        <button
          type="button"
          onClick={() => setCurrentTab('action-center')}
          className="relative p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-600"
          title="Action Center Priority Queue"
          aria-label={`Action Center: ${actionCenterCount} urgent items`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          {actionCenterCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-500 text-slate-950 font-bold rounded-full text-[9px] font-mono flex items-center justify-center leading-none">
              {actionCenterCount}
            </span>
          )}
        </button>

        {/* Ask Pipeline IQ Assistant Launcher */}
        <button
          type="button"
          onClick={openCopilot}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Open Ask Pipeline IQ decision intelligence drawer"
        >
          <MessageSquareCode className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Ask Pipeline IQ</span>
          <kbd className="hidden lg:inline font-mono text-[10px] px-1 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};
