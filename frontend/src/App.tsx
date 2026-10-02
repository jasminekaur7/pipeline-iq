import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { OverviewPage } from './pages/OverviewPage';
import { DecisionDebtPage } from './pages/DecisionDebtPage';
import { AccountsPage } from './pages/AccountsPage';
import { AccountDetailPage } from './pages/AccountDetailPage';
import { ActionCenterPage } from './pages/ActionCenterPage';
import { DecisionContractsPage } from './pages/DecisionContractsPage';
import { SelfAuditPage } from './pages/SelfAuditPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AICopilotDrawer } from './components/AICopilotDrawer';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Parse path to tab/account state
  const parsePath = useCallback(() => {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/' || path === '/overview') {
      setCurrentTab('overview');
      setSelectedAccountId(null);
    } else if (path.startsWith('/accounts/')) {
      const accId = path.replace('/accounts/', '').trim();
      if (accId) {
        setSelectedAccountId(accId);
        setCurrentTab('accounts');
      } else {
        setSelectedAccountId(null);
        setCurrentTab('accounts');
      }
    } else if (path === '/accounts') {
      setCurrentTab('accounts');
      setSelectedAccountId(null);
    } else if (path === '/decision-debt') {
      setCurrentTab('decision-debt');
      setSelectedAccountId(null);
    } else if (path === '/action-center') {
      setCurrentTab('action-center');
      setSelectedAccountId(null);
    } else if (path === '/decision-contracts') {
      setCurrentTab('decision-contracts');
      setSelectedAccountId(null);
    } else if (path === '/self-audit') {
      setCurrentTab('self-audit');
      setSelectedAccountId(null);
    } else {
      setCurrentTab('404');
      setSelectedAccountId(null);
    }
  }, []);

  // Listen for browser back / forward
  useEffect(() => {
    parsePath();
    const handlePopState = () => parsePath();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parsePath]);

  // Synchronize document title
  useEffect(() => {
    if (selectedAccountId) {
      document.title = `Account ${selectedAccountId} | Pipeline IQ`;
    } else {
      const titles: Record<string, string> = {
        'overview': 'Pipeline IQ | Decision Intelligence & Risk Architecture',
        'decision-debt': 'Decision Debt Index | Pipeline IQ',
        'accounts': 'Enterprise Accounts | Pipeline IQ',
        'action-center': 'Action Center | Pipeline IQ',
        'decision-contracts': 'Decision Contracts | Pipeline IQ',
        'self-audit': 'Self-Audit & Calibration Ledger | Pipeline IQ',
        '404': 'Page Not Found | Pipeline IQ',
      };
      document.title = titles[currentTab] || 'Pipeline IQ | Decision Intelligence';
    }
  }, [currentTab, selectedAccountId]);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K for Ask Pipeline IQ)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    window.history.pushState({}, '', `/accounts/${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToAccounts = () => {
    setSelectedAccountId(null);
    window.history.pushState({}, '', '/accounts');
    setCurrentTab('accounts');
  };

  const handleTabChange = (tab: string) => {
    setSelectedAccountId(null);
    setCurrentTab(tab);
    const targetUrl = tab === 'overview' ? '/' : `/${tab}`;
    window.history.pushState({}, '', targetUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        openCopilot={() => setIsCopilotOpen(true)}
        toggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        actionCenterCount={5}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          if (val && currentTab !== 'accounts' && !selectedAccountId) {
            handleTabChange('accounts');
          }
        }}
      />

      <div className="flex-1 flex w-full">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={selectedAccountId ? 'accounts' : currentTab}
          setCurrentTab={handleTabChange}
          isMobileOpen={isMobileMenuOpen}
          closeMobileMenu={() => setIsMobileMenuOpen(false)}
          actionCenterCount={5}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 min-w-0 overflow-x-hidden pb-12">
          {selectedAccountId ? (
            <AccountDetailPage
              accountId={selectedAccountId}
              onBack={handleBackToAccounts}
              openCopilot={() => setIsCopilotOpen(true)}
            />
          ) : currentTab === 'overview' ? (
            <OverviewPage
              onSelectAccount={handleSelectAccount}
              setCurrentTab={handleTabChange}
            />
          ) : currentTab === 'decision-debt' ? (
            <DecisionDebtPage onSelectAccount={handleSelectAccount} />
          ) : currentTab === 'accounts' ? (
            <AccountsPage
              onSelectAccount={handleSelectAccount}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          ) : currentTab === 'action-center' ? (
            <ActionCenterPage onSelectAccount={handleSelectAccount} />
          ) : currentTab === 'decision-contracts' ? (
            <DecisionContractsPage onSelectAccount={handleSelectAccount} />
          ) : currentTab === 'self-audit' ? (
            <SelfAuditPage onSelectAccount={handleSelectAccount} />
          ) : (
            <NotFoundPage onReturnToDashboard={() => handleTabChange('overview')} />
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer setCurrentTab={handleTabChange} />

      {/* Grounded Decision Assistant Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onNavigateToAccount={handleSelectAccount}
        defaultAccountId={selectedAccountId || undefined}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
