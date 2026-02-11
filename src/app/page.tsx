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
import { AnalyticsDashboard } from '@/components/analytics';
import { syncController } from '@/services/sync-controller';

export default function Home() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const syncInProgress = useAppStore((s) => s.syncConfig?.isSyncing || false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'dispense' | 'settings' | 'tickets' | 'pending-drugs' | 'analytics'>('dashboard');
  const [showFirstLaunch, setShowFirstLaunch] = useState(false);
  
  const isAdmin = user?.role === 'admin';
  const userPharmacyId = user?.pharmacy?.id || user?.pharmacyId || undefined;

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

  // Listen for global navigation events from child components
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        // @ts-ignore
        const detail = ev?.detail || null;
        if (detail?.ticketId) {
          setCurrentView('tickets');
          // also set selected ticket in global store
          import('@/store/app').then(mod => {
            try { mod.useAppStore.setState({ selectedTicketId: detail.ticketId }); } catch (e) {}
          }).catch(() => {});
        } else if (detail?.highRiskAlertId || detail?.dispensingEventId) {
          // open analytics and focus the alert
          setCurrentView('analytics');
          import('@/store/app').then(mod => {
            try { mod.useAppStore.setState({ selectedHighRiskAlertId: detail.highRiskAlertId || detail.dispensingEventId || null }); } catch (e) {}
          }).catch(() => {});
          // Dispatch focus event after a short delay to allow analytics view to mount
          setTimeout(() => {
            try {
              window.dispatchEvent(new CustomEvent('sems:focus-alert', { detail }));
            } catch (e) {}
          }, 200);
        } else {
          setCurrentView('tickets');
        }
      } catch (e) {}
    };

    window.addEventListener('sems:navigate-to-ticket', handler as EventListener);

    // Handle open-dispense events (navigate to Dispense view and focus a dispense record)
    const handleOpenDispense = (ev: Event) => {
      try {
        // @ts-ignore
        const detail = ev?.detail || null;
        const dispenseRecordId = detail?.dispenseRecordId || detail?.dispenseRecord || null;
        setCurrentView('dispense');
        import('@/store/app').then(mod => {
          try { mod.useAppStore.setState({ selectedDispenseRecordId: dispenseRecordId, selectedHighRiskAlertId: detail?.highRiskAlertId || null }); } catch (e) {}
        }).catch(() => {});
      } catch (e) {}
    };

    window.addEventListener('sems:open-dispense', handleOpenDispense as EventListener);

    return () => {
      window.removeEventListener('sems:navigate-to-ticket', handler as EventListener);
      window.removeEventListener('sems:open-dispense', handleOpenDispense as EventListener);
    };
  }, []);

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
            
            {currentView === 'analytics' && <AnalyticsDashboard pharmacyId={userPharmacyId} />}
            
            {currentView === 'dispense' && (
              <div className="space-y-8">
                {/* Check user pharmacy assignment before showing dispense form */}
                {!userPharmacyId ? (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Access Denied</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      You are not assigned to a pharmacy. Creating dispense records is restricted to users linked to a pharmacy.
                      Please ask an administrator to assign you a pharmacy or assign one in Settings before creating transactions.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentView('settings')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Go to Settings
                      </button>
                      <button
                        onClick={() => setCurrentView('dashboard')}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">
                        <DispenseForm onDispenseComplete={() => {}} />
                      </div>

                      <div className="lg:col-span-1">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6">
                          <h3 className="font-semibold text-blue-900 mb-2">Help</h3>
                          <p className="text-sm text-blue-800">
                            The system works offline. All data is synchronized when you
                            reconnect to the internet.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow">
                      <DispenseRecordsViewer />
                    </div>
                  </div>
                )}
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
