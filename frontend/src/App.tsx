import React, { useState, useEffect } from 'react';
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

  // Synchronize document title according to active view for SEO and UX
  useEffect(() => {
    if (selectedAccountId) {
      document.title = `Account Detail — Pipeline IQ`;
    } else {
      const titles: Record<string, string> = {
        'overview': 'Pipeline IQ — Decision Intelligence',
        'decision-debt': 'Decision Debt — Pipeline IQ',
        'accounts': 'Accounts — Pipeline IQ',
        'action-center': 'Action Center — Pipeline IQ',
        'decision-contracts': 'Decision Contracts — Pipeline IQ',
        'self-audit': 'Self-Audit & Calibration — Pipeline IQ',
        '404': 'Not Found — Pipeline IQ',
      };
      document.title = titles[currentTab] || 'Pipeline IQ — Decision Intelligence';
    }
  }, [currentTab, selectedAccountId]);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K for Copilot)
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToAccounts = () => {
    setSelectedAccountId(null);
  };

  const handleTabChange = (tab: string) => {
    setSelectedAccountId(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
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
            setCurrentTab('accounts');
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

        {/* Main Content View */}
        <main className="flex-1 overflow-x-hidden pb-12">
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

      {/* AI Copilot Drawer */}
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
