'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { LoginForm } from '@/components/LoginForm';
import { Navbar } from '@/components/Navbar';
import { Dashboard } from '@/components/Dashboard';
import { DispenseForm } from '@/components/DispenseForm';
import { DispenseRecordsViewer } from '@/components/DispenseRecordsViewer';
import { DatabaseInitializer } from '@/components/DatabaseInitializer';
import { SettingsMenu } from '@/components/SettingsMenu';
import { TicketManagement } from '@/components/TicketManagement';
import { FirstLaunchSetup } from '@/components/FirstLaunchSetup';
import { FloatingMenu } from '@/components/FloatingMenu';
import { PendingDrugsManager } from '@/components/PendingDrugsManager';
import { syncController } from '@/services/sync-controller';

export default function Home() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const syncInProgress = useAppStore((s) => s.syncConfig?.isSyncing || false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'dispense' | 'settings' | 'tickets' | 'pending-drugs'>('dashboard');
  const [showFirstLaunch, setShowFirstLaunch] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  const handleSync = async () => {
    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!authToken) return;

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Initialize sync controller if not already
      await syncController.initialize({
        apiBaseUrl,
        authToken,
      });

      // Pull cloud data to client first (dispense records and tickets)
      await syncController.pullDataToClient();

      // Then push local unsynced data to cloud
      await syncController.triggerManualSync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <>
      {showFirstLaunch && <FirstLaunchSetup onComplete={() => setShowFirstLaunch(false)} />}
      <DatabaseInitializer />
      
      {!isAuthenticated ? (
        <LoginForm />
      ) : (
        <div className="min-h-screen bg-gray-50">
          {/* Navbar */}
          <Navbar
            currentView={currentView}
            onViewChange={setCurrentView}
            onLogout={logout}
            isAdmin={isAdmin}
            onNotificationTicketSelect={(ticketId) => {
              setCurrentView('tickets');
            }}
          />

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'dashboard' && <Dashboard />}
            
            {currentView === 'dispense' && (
              <div className="space-y-8">
                {/* Dispense Form Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Dispense Form - Main Column */}
                  <div className="lg:col-span-2">
                    <DispenseForm onDispenseComplete={() => {}} />
                  </div>

                  {/* Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6">
                      <h3 className="font-semibold text-blue-900 mb-2">💡 Help</h3>
                      <p className="text-sm text-blue-800">
                        The system works offline. All data is synchronized when you
                        reconnect to the internet.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Records Section */}
                <div className="bg-white rounded-lg shadow">
                  <DispenseRecordsViewer />
                </div>
              </div>
            )}

            {currentView === 'settings' && <SettingsMenu />}

            {currentView === 'tickets' && <TicketManagement />}

            {currentView === 'pending-drugs' && (
              <PendingDrugsManager onBack={() => setCurrentView('dashboard')} />
            )}
          </main>

          {/* Floating Menu */}
          <FloatingMenu
            onLogout={logout}
            onSync={handleSync}
            onNavigate={setCurrentView}
            currentView={currentView}
            isAdmin={isAdmin}
            syncInProgress={syncInProgress}
            userName={user?.username}
            userRole={user?.role}
          />
        </div>
      )}
    </>
  );
}
