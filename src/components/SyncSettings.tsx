'use client';

import { useState, useEffect } from 'react';
import { Settings, Server, Clock, AlertCircle } from 'lucide-react';

export function SyncSettings() {
  const [apiUrl, setApiUrl] = useState('');
  const [autoSyncInterval, setAutoSyncInterval] = useState('300');
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Load saved settings on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('sems_api_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const savedInterval = localStorage.getItem('sems_auto_sync_interval') || process.env.NEXT_PUBLIC_AUTO_SYNC_INTERVAL || '300';
    setApiUrl(savedUrl);
    setAutoSyncInterval(savedInterval);
  }, []);

  // Test API connection
  const testConnection = async () => {
    try {
      setConnectionStatus('unknown');
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      setConnectionStatus(response.ok ? 'connected' : 'disconnected');
    } catch (error) {
      console.warn('Connection test failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Save settings
  const handleSave = async () => {
    if (!apiUrl.trim()) {
      alert('Please enter a valid API URL');
      return;
    }

    try {
      // Validate URL format
      new URL(apiUrl);
    } catch (e) {
      alert('Please enter a valid URL (e.g., http://localhost:3000)');
      return;
    }

    localStorage.setItem('sems_api_url', apiUrl);
    localStorage.setItem('sems_auto_sync_interval', autoSyncInterval);
    setSaved(true);
    setIsEditing(false);

    // Clear saved status after 3 seconds
    setTimeout(() => setSaved(false), 3000);

    // Test connection after save
    await testConnection();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Sync Configuration
        </h3>
        <p className="text-gray-600 mt-2">Configure how the app syncs data with the server</p>
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {/* API URL Settings */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900">API Server URL</h4>
                <p className="text-sm text-gray-600 mt-1">
                  The address of your backend server. Used for syncing records to the cloud.
                </p>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Current URL</label>
                <p className="text-gray-900 font-mono text-sm mt-1">{apiUrl}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Connection Status</label>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connectionStatus === 'connected'
                        ? 'bg-green-500'
                        : connectionStatus === 'disconnected'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {connectionStatus === 'connected'
                      ? 'Connected ✓'
                      : connectionStatus === 'disconnected'
                        ? 'Disconnected ✗'
                        : 'Not tested'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={testConnection}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition text-sm"
                >
                  Test Connection
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-3">
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="e.g., http://localhost:3000"
                className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white "
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Auto-Sync Interval Settings */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900">Auto-Sync Interval</h4>
                <p className="text-sm text-gray-600 mt-1">
                  How often the app automatically syncs data to the server (in seconds).
                </p>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Current Interval</label>
                <p className="text-gray-900 font-mono text-sm mt-1">{autoSyncInterval} seconds</p>
                <p className="text-xs text-gray-600 mt-1">
                  ({Math.round(parseInt(autoSyncInterval) / 60)} minute{Math.round(parseInt(autoSyncInterval) / 60) !== 1 ? 's' : ''})
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-3">
              <select
                value={autoSyncInterval}
                onChange={(e) => setAutoSyncInterval(e.target.value)}
                className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white "
              >
                <option value="60">1 minute</option>
                <option value="180">3 minutes</option>
                <option value="300">5 minutes (default)</option>
                <option value="600">10 minutes</option>
                <option value="1800">30 minutes</option>
                <option value="3600">1 hour</option>
                <option value="0">Disable auto-sync (manual only)</option>
              </select>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-900">Offline-First Design</p>
              <ul className="list-disc list-inside text-blue-800 space-y-1 text-xs">
                <li>All records are saved locally first</li>
                <li>Sync failures don't prevent the app from working</li>
                <li>Records queue automatically and sync when the server is available</li>
                <li>You can continue dispensing medicine even without internet connection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm font-medium">
          ✓ Settings saved successfully!
        </div>
      )}
    </div>
  );
}

