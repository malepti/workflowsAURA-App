/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { ToastContainer } from './components/ToastContainer';
import { HomeView } from './components/views/HomeView';
import { ChatView } from './components/views/ChatView';
import { ExploreModelsView } from './components/views/ExploreModelsView';
import { ApiKeyManagerView } from './components/views/ApiKeyManagerView';
import { CreditWalletView } from './components/views/CreditWalletView';
import { SubscriptionView } from './components/views/SubscriptionView';
import { PluginMarketplaceView } from './components/views/PluginMarketplaceView';
import { WorkflowBuilderView } from './components/views/WorkflowBuilderView';
import { CodeAssistantView } from './components/views/CodeAssistantView';

import { DocumentAnalysisView } from './components/views/DocumentAnalysisView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { AccountSettingsView } from './components/views/AccountSettingsView';
import { AdminConsoleView } from './components/views/AdminConsoleView';
import { UserGuideView } from './components/views/UserGuideView';
import { AuthView } from './components/views/AuthView';
import { ChartsView } from './components/views/ChartsView';
import { Loader2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentView, startNewChat, isAuthenticated, isAppReady } = useApp();

  // Keyboard shortcut listener for Cmd/Ctrl+K to start new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        startNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startNewChat]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'chat':
        return <ChatView />;
      case 'explore':
        return <ExploreModelsView />;
      case 'api-keys':
        return <ApiKeyManagerView />;
      case 'wallet':
        return <CreditWalletView />;
      case 'subscription':
        return <SubscriptionView />;
      case 'plugins':
        return <PluginMarketplaceView />;
      case 'workflows':
        return <WorkflowBuilderView />;
      case 'code-assistant':
        return <CodeAssistantView />;
      case 'doc-analysis':
        return <DocumentAnalysisView />;
      case 'charts':
        return <ChartsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'account':
        return <AccountSettingsView />;
      case 'admin':
        return <AdminConsoleView />;
      case 'user-guide':
        return <UserGuideView />;
      default:
        return <HomeView />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <AuthView />
        <ToastContainer />
      </>
    );
  }

  if (!isAppReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFF]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#F8FAFF]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col">
          {renderCurrentView()}
        </main>
        <RightPanel />
      </div>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
