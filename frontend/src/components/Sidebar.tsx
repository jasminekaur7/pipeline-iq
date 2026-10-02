import React from 'react';
import {
  LayoutDashboard, AlertOctagon, Building2, ShieldAlert,
  FileCheck2, CheckCircle2, ChevronRight, Activity, GitFork
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isMobileOpen: boolean;
  closeMobileMenu: () => void;
  actionCenterCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isMobileOpen,
  closeMobileMenu,
  actionCenterCount = 5,
}) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'decision-debt',
      label: 'Decision Debt',
      icon: AlertOctagon,
      badge: 'Formula',
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: Building2,
      badge: '55',
    },
    {
      id: 'action-center',
      label: 'Action Center',
      icon: ShieldAlert,
      badge: actionCenterCount > 0 ? `${actionCenterCount} urgent` : null,
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'decision-contracts',
      label: 'Decision Contracts',
      icon: FileCheck2,
      badge: '28 active',
    },
    {
      id: 'self-audit',
      label: 'Self-Audit',
      icon: CheckCircle2,
      badge: 'Honest',
    },
  ];

  const handleSelect = (id: string) => {
    setCurrentTab(id);
    closeMobileMenu();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          role="button"
          tabIndex={0}
          onClick={closeMobileMenu}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') closeMobileMenu(); }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          aria-label="Close navigation menu"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-[#090D16] border-r border-slate-800/80 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Mobile header if mobile */}
        <div className="p-4 lg:hidden border-b border-slate-800 flex items-center justify-between">
          <span className="font-semibold text-sm text-white">Pipeline IQ Navigation</span>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
          >
            Close
          </button>
        </div>

        {/* Main Navigation links */}
        <div className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-2 text-[10px] font-mono tracking-wider uppercase text-slate-500 font-semibold">
            Pipeline Intelligence
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      item.badgeColor || 'text-slate-400 bg-slate-800/80 border-slate-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Agent Architecture Card */}
        <div className="p-3 m-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agent State Engine</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Autonomous observation loop monitoring 55 enterprise accounts & graph ripple paths.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>OBSERVE → AUDIT</span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
        </div>
      </aside>
    </>
  );
};
