/**
 * Tauri Sync Configuration Component
 * Allows users to configure server URL and sync settings
 * Settings are stored in local SQLite database
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { getDatabase, getSyncConfig, updateSyncConfig } from '@/lib/tauri-db';

interface SyncSettings {
  serverUrl: string;
  syncInterval: number;
  autoSyncEnabled: boolean;
}

export function TauriSyncSettings() {
  const [settings, setSettings] = useState<SyncSettings>({
    serverUrl: '',
    syncInterval: 15,
    autoSyncEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      const config = await getSyncConfig(db);
      setSettings({
        serverUrl: config.serverUrl || '',
        syncInterval: config.syncInterval || 15,
        autoSyncEnabled: (config.autoSyncEnabled as number) !== 0,
      });
    } catch (err) {
      setError('Failed to load sync settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? parseInt(value, 10)
            : value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const db = getDatabase();
      await updateSyncConfig(db, settings);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!settings.serverUrl) {
      setError('Please enter a server URL first');
      return;
    }

    try {
      setTestingConnection(true);
      setConnectionStatus('idle');
      setError(null);

      // Try to connect to the server health endpoint
      const response = await fetch(`${settings.serverUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setError(`Server returned: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin w-5 h-5 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Backend Server Configuration</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure where this Tauri app syncs its data. Settings are stored locally in SQLite.
        </p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 text-sm">Sync settings saved successfully</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Server URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Backend Server URL
          </label>
          <input
            type="url"
            name="serverUrl"
            value={settings.serverUrl}
            onChange={handleChange}
            placeholder="http://192.168.1.100:3000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: http://192.168.1.100:3000 or https://sems.example.com
          </p>
        </div>

        {/* Test Connection */}
        {settings.serverUrl && (
          <div>
            <button
              onClick={testConnection}
              disabled={testingConnection}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {testingConnection && <Loader className="animate-spin w-4 h-4" />}
              Test Connection
            </button>
            {connectionStatus === 'success' && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Connection successful!
              </p>
            )}
            {connectionStatus === 'error' && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Connection failed
              </p>
            )}
          </div>
        )}

        {/* Auto-Sync Toggle */}
        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="autoSyncEnabled"
              checked={settings.autoSyncEnabled}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Enable automatic synchronization
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2 ml-7">
            When enabled, the app will automatically sync with the server at the configured interval
          </p>
        </div>

        {/* Sync Interval */}
        {settings.autoSyncEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sync Interval (minutes)
            </label>
            <select
              name="syncInterval"
              value={settings.syncInterval}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>Every 1 minute</option>
              <option value={5}>Every 5 minutes</option>
              <option value={15}>Every 15 minutes (default)</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
            </select>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💾 Storage:</strong> These settings are saved in your local SQLite database
          ({' '}
          <code className="bg-white px-2 py-1 rounded text-xs">sems.db</code>) on this computer. They will persist across app restarts.
        </p>
      </div>
    </div>
  );
}
