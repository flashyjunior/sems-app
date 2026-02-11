'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { syncController } from '@/services/sync-controller';
import { syncService } from '@/services/sync';

interface SyncControlProps {
  apiBaseUrl?: string;
  authToken?: string;
  className?: string;
}

/**
 * Sync Control Component - Allows manual sync and configuration
 */
export function SyncControl({
  apiBaseUrl: propApiUrl = '',
  authToken = '',
  className = '',
}: SyncControlProps) {
  const syncConfig = useAppStore((state) => state.syncConfig);
  const setSyncConfig = useAppStore((state) => state.setSyncConfig);
  const [isOpen, setIsOpen] = useState(false);
  const [manualSyncResult, setManualSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(propApiUrl);

  // Initialize API URL from localStorage or environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('sems_api_url');
      const url = savedUrl || propApiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      setApiBaseUrl(url);
    }
  }, [propApiUrl]);

  // Initialize sync controller on mount
  useEffect(() => {
    if (authToken) {
      console.log('[SyncControl] Initializing with token:', authToken.substring(0, 20) + '...');
      syncController.initialize({
        apiBaseUrl,
        authToken,
      }).then(() => {
        console.log('[SyncControl] Initialization complete');
        setIsInitialized(true);
      }).catch(err => {
        console.error('[SyncControl] Initialization error:', err);
        setError('Failed to initialize sync');
      });
    } else {
      console.log('[SyncControl] No auth token provided');
    }

    // Fetch sync stats periodically
    const statsInterval = setInterval(async () => {
      try {
        const stats = await syncController.getSyncStats();
        if (stats) {
          console.log('[SyncControl] Stats:', stats);
          setUnsyncedCount(stats.unsyncedCount || stats.unsynced || 0);
        }
      } catch (err) {
        console.error('[SyncControl] Error getting stats:', err);
      }
    }, 10000);

    return () => clearInterval(statsInterval);
  }, [apiBaseUrl, authToken]);

  const handleManualSync = async () => {
    if (!isInitialized) {
      setError('Sync controller still initializing...');
      return;
    }

    try {
      setError(null);
      const result = await syncController.triggerManualSync();
      setManualSyncResult(result);
      
      // Refresh sync status in navbar
      syncService.refreshStatus();
      
      // Notify all components that sync completed so they can refresh
      useAppStore.setState((state) => ({
        syncCompletedCounter: state.syncCompletedCounter + 1,
      }));
      
      // Clear result after 5 seconds
      setTimeout(() => setManualSyncResult(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleToggleAutoSync = () => {
    if (syncConfig.enabled) {
      syncController.stopAutoSync();
    } else {
      syncController.startAutoSync(syncConfig.intervalSeconds);
    }
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const interval = parseInt(e.target.value);
    syncController.updateSyncInterval(interval);
    setSyncConfig({ intervalSeconds: interval });
  };

  // If no auth token, show minimal button
  if (!authToken) {
    return (
      <div className={`relative sync-control ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Sync disabled</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative sync-control ${className}`}>
      {/* Sync Status Button/Badge */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="relative">
          <div
            className={`w-3 h-3 rounded-full ${
              syncConfig?.isSyncing
                ? 'bg-blue-500 animate-pulse'
                : 'bg-green-500'
            }`}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">
          {syncConfig?.isSyncing
            ? 'Syncing...'
            : `Ready (${unsyncedCount} pending)`}
        </span>
      </div>

      {/* Control Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Sync Settings</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                
              </button>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={syncConfig?.isSyncing}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {syncConfig?.isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>

            {/* Manual Sync Result */}
            {manualSyncResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                [OK] Synced {manualSyncResult.synced} records
                {manualSyncResult.failed > 0 &&
                  `, Failed: ${manualSyncResult.failed}`}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                 {error}
              </div>
            )}

            {/* Auto Sync Toggle */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Auto Sync
                </label>
                <button
                  onClick={handleToggleAutoSync}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    syncConfig?.enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {syncConfig?.enabled ? 'On' : 'Off'}
                </button>
              </div>

              {/* Sync Interval Configuration */}
              {syncConfig?.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sync Interval
                  </label>
                  <select
                    value={syncConfig?.intervalSeconds || 300}
                    onChange={handleIntervalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={300}>5 minutes (default)</option>
                    <option value={600}>10 minutes</option>
                    <option value={1800}>30 minutes</option>
                    <option value={3600}>1 hour</option>
                  </select>
                </div>
              )}
            </div>

            {/* Sync Statistics */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Sync Statistics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Records:</span>
                  <span className="font-semibold">{unsyncedCount}</span>
                </div>
                {syncConfig?.lastSyncTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Sync:</span>
                    <span className="font-semibold">
                      {new Date(syncConfig.lastSyncTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {syncConfig?.syncStats && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Successful:</span>
                      <span className="font-semibold">
                        {syncConfig.syncStats.lastSuccessfulSync 
                          ? new Date(syncConfig.syncStats.lastSuccessfulSync).toLocaleTimeString()
                          : 'Never'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SyncControl;

