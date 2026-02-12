'use client';

import { useState, useEffect } from 'react';
import type { SMTPSettings } from '@/types';

export function SMTPSettingsComponent() {
  const [settings, setSettings] = useState<SMTPSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showTestEmailDialog, setShowTestEmailDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch('/api/settings/smtp', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        setSettings({
          id: '',
          host: '',
          port: 587,
          secure: false,
          username: '',
          password: '',
          fromEmail: '',
          fromName: 'SEMS Support',
          adminEmail: '',
          replyToEmail: '',
          enabled: false,
          createdAt: 0,
          updatedAt: 0,
        });
      }
    } catch (error) {
      console.error('Error loading SMTP settings:', error);
      setMessage({ type: 'error', text: 'Failed to load SMTP settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SMTPSettings, value: any) => {
    setSettings((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch('/api/settings/smtp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'SMTP settings saved successfully' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to save SMTP settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings) return;
    setShowTestEmailDialog(true);
    setTestEmail(settings.adminEmail || '');
  };

  const performTestConnection = async (emailAddress: string) => {
    if (!settings) return;

    setTestingConnection(true);
    setMessage(null);
    setShowTestEmailDialog(false);

    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...settings,
          testEmail: emailAddress,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `SMTP connection test successful! Test email sent to ${emailAddress}` });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'SMTP connection test failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test SMTP connection' });
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading SMTP settings...</div>;
  }

  if (!settings) {
    return <div className="text-center py-12">Failed to load SMTP settings</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Configuration (SMTP)</h2>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 border border-green-300 text-green-800'
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enabled"
              checked={settings.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              Enable Email Notifications
            </label>
          </div>

          {/* SMTP Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Server Host *
            </label>
            <input
              type="text"
              value={settings.host}
              onChange={(e) => handleInputChange('host', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="e.g., smtp.gmail.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">The SMTP server address</p>
          </div>

          {/* Port and Secure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port *
              </label>
              <input
                type="number"
                value={settings.port}
                onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="587"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Common: 587 (TLS) or 465 (SSL)</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  checked={settings.secure}
                  onChange={(e) => handleInputChange('secure', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                Use TLS/SSL
              </label>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username/Email *
            </label>
            <input
              type="email"
              value={settings.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="your-email@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={settings.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="SMTP password or app password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">For Gmail, use an App Password, not your main password</p>
          </div>

          {/* From Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Email Address *
            </label>
            <input
              type="email"
              value={settings.fromEmail}
              onChange={(e) => handleInputChange('fromEmail', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="noreply@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">The email address that appears in the 'From' field</p>
          </div>

          {/* From Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Name *
            </label>
            <input
              type="text"
              value={settings.fromName}
              onChange={(e) => handleInputChange('fromName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="SEMS Support"
              required
            />
          </div>

          {/* Admin Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Administrator Email *
            </label>
            <input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => handleInputChange('adminEmail', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="admin@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Where ticket notifications will be sent</p>
          </div>

          {/* Reply-To Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reply-To Email (Optional)
            </label>
            <input
              type="email"
              value={settings.replyToEmail || ''}
              onChange={(e) => handleInputChange('replyToEmail', e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="support@example.com"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection || saving || !settings.host || !settings.username || !settings.password}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium transition"
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || testingConnection}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
            >
              {saving ? 'Saving...' : 'Save SMTP Settings'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Gmail Setup Guide:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Enable 2-Factor Authentication on your Gmail account</li>
            <li>Go to Google Account → Security → App passwords</li>
            <li>Generate an app password for "Mail" and "Windows Computer"</li>
            <li>Use the generated 16-character password in the Password field</li>
            <li>Host: smtp.gmail.com, Port: 587, Secure: Enabled</li>
          </ol>
        </div>
      </div>

      {/* Test Email Dialog */}
      {showTestEmailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test SMTP Connection</h3>
            <p className="text-sm text-gray-600 mb-4">Enter an email address to send the test email:</p>
            
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-6 text-gray-900 bg-white"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowTestEmailDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => performTestConnection(testEmail)}
                disabled={!testEmail || testingConnection}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
              >
                {testingConnection ? 'Testing...' : 'Send Test Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



