import React from 'react';
import {
  LayoutDashboard, AlertOctagon, Building2, ShieldAlert,
  FileCheck2, CheckCircle2, Cpu
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
      label: 'Executive Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'decision-debt',
      label: 'Decision Debt Index',
      icon: AlertOctagon,
      badge: null,
    },
    {
      id: 'accounts',
      label: 'Accounts & Pipeline',
      icon: Building2,
      badge: '55',
    },
    {
      id: 'action-center',
      label: 'Action Center',
      icon: ShieldAlert,
      badge: actionCenterCount > 0 ? `${actionCenterCount}` : null,
      badgeColor: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'decision-contracts',
      label: 'Decision Contracts',
      icon: FileCheck2,
      badge: '28',
    },
    {
      id: 'self-audit',
      label: 'Self-Audit & Calibration',
      icon: CheckCircle2,
      badge: null,
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
          aria-label="Close navigation sidebar"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-14 left-0 h-screen lg:h-[calc(100vh-3.5rem)] w-60 bg-[#0B0F17] border-r border-slate-800 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile header */}
        <div className="p-3.5 lg:hidden border-b border-slate-800 flex items-center justify-between">
          <span className="font-semibold text-xs tracking-tight text-white uppercase font-mono">
            Navigation
          </span>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-900 border border-slate-800 rounded"
          >
            Close
          </button>
        </div>

        {/* Navigation list */}
        <div className="p-3 space-y-1">
          <div className="px-2.5 pt-2 pb-1.5 text-[10px] font-mono tracking-wider uppercase text-slate-500 font-semibold">
            Operational Views
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-slate-800/90 text-white border-l-2 border-blue-500 pl-2.5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      item.badgeColor || 'text-slate-400 bg-slate-900 border-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Operational Status Widget */}
        <div className="p-3 m-3 rounded-md bg-[#111726] border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>Calculation Engine</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">ACTIVE</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Deterministic state engine tracking 55 accounts, 107 deals, and ripple dependencies.
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>MODE: DETERMINISTIC</span>
            <span>VERIFIED</span>
          </div>
        </div>
      </aside>
    </>
  );
};
