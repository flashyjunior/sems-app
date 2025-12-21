'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { LoginForm } from '@/components/LoginForm';
import { SyncStatus } from '@/components/SyncStatus';
import { DispenseForm } from '@/components/DispenseForm';
import { DatabaseInitializer } from '@/components/DatabaseInitializer';
import { TemplateEditor } from '@/components/TemplateEditor';
import { SettingsMenu } from '@/components/SettingsMenu';
import { db } from '@/lib/db';

export default function Home() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const [currentView, setCurrentView] = useState<'dispense' | 'settings'>('dispense');
  const [todayDispenses, setTodayDispenses] = useState(0);
  const [pendingSync, setPendingSync] = useState(0);
  
  const isAdmin = user?.role === 'admin';

  // Load quick stats
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadStats = async () => {
      try {
        const allRecords = await db.dispenseRecords.toArray();
        
        // Count today's dispenses
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();
        const todayCount = allRecords.filter(r => (r.timestamp || 0) >= todayMs).length;
        setTodayDispenses(todayCount);
        
        // Count pending sync records
        const pendingCount = allRecords.filter(r => !r.synced).length;
        setPendingSync(pendingCount);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <>
      <DatabaseInitializer />
      
      {!isAuthenticated ? (
        <LoginForm />
      ) : (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SEMS</h1>
                <p className="text-sm text-gray-600">Smart Dispensing System</p>
              </div>
              <div className="flex items-center gap-6">
                <SyncStatus />
                {isAdmin && (
                  <button
                    onClick={() => setCurrentView(currentView === 'dispense' ? 'settings' : 'dispense')}
                    className={`px-4 py-2 rounded-lg transition ${
                      currentView === 'settings'
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Settings"
                  >
                    ⚙️ Settings
                  </button>
                )}
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'settings' ? (
              <SettingsMenu />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Dispense Form - Main Column */}
                <div className="lg:col-span-2">
                  <DispenseForm onDispenseComplete={() => {}} />
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Quick Stats */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Quick Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Today's Dispenses</span>
                        <span className="font-semibold text-gray-900">{todayDispenses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Sync</span>
                        <span className={`font-semibold ${pendingSync > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                          {pendingSync}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Help */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Help</h3>
                    <p className="text-sm text-blue-800">
                      The system works offline. All data is synchronized when you
                      reconnect to the internet.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </>
  );
}
