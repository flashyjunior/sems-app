'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';
import { settingsService } from '@/services/settings';
import type { SystemSettings } from '@/types';

interface SystemSettingsEditorProps {
  onBack: () => void;
}

export function SystemSettingsEditor({ onBack }: SystemSettingsEditorProps) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [formData, setFormData] = useState({
    facilityName: '',
    facilityLogo: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
    autoSyncEnabled: true,
    autoSyncInterval: 5,
    offlineMode: true,
    dataRetention: 90,
    auditLogging: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const systemSettings = await settingsService.getSystemSettings();
      if (systemSettings) {
        setSettings(systemSettings);
        setFormData({
          facilityName: systemSettings.facilityName || '',
          facilityLogo: systemSettings.facilityLogo || '',
          address: systemSettings.address || '',
          phone: systemSettings.phone || '',
          email: systemSettings.email || '',
          licenseNumber: systemSettings.licenseNumber || '',
          autoSyncEnabled: systemSettings.autoSyncEnabled ?? true,
          autoSyncInterval: systemSettings.autoSyncInterval || 5,
          offlineMode: systemSettings.offlineMode ?? true,
          dataRetention: systemSettings.dataRetention || 90,
          auditLogging: systemSettings.auditLogging ?? true,
        });
      }
    } catch (err) {
      setError('Failed to load system settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (!settings) {
        await settingsService.createSystemSettings(formData);
      } else {
        await settingsService.updateSystemSettings(formData);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? parseInt(value, 10)
            : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600 mt-1">Configure facility information and system behavior</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          System settings updated successfully
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-3xl">
        <div className="space-y-6">
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Facility Information</h3>
          <div className="space-y-4">
            {/* Facility Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facility Name
              </label>
              <input
                type="text"
                name="facilityName"
                value={formData.facilityName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., City Hospital Pharmacy"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facility Logo URL
              </label>
              <input
                type="url"
                name="facilityLogo"
                value={formData.facilityLogo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Street address"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="pharmacy@hospital.local"
              />
            </div>

            {/* License Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="PHR-0001"
              />
            </div>
          </div>
        </div>

        {/* Synchronization Settings */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Synchronization</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="autoSyncEnabled"
                checked={formData.autoSyncEnabled}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable automatic synchronization
              </span>
            </label>

            {formData.autoSyncEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sync Interval (minutes)
                </label>
                <input
                  type="number"
                  name="autoSyncInterval"
                  value={formData.autoSyncInterval}
                  onChange={handleChange}
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="offlineMode"
                checked={formData.offlineMode}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable offline mode (use local database when not connected)
              </span>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Data Management</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Retention (days)
              </label>
              <input
                type="number"
                name="dataRetention"
                value={formData.dataRetention}
                onChange={handleChange}
                min="30"
                max="730"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                How long to keep historical records before automatic purging
              </p>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="auditLogging"
                checked={formData.auditLogging}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable audit logging for compliance and security
              </span>
            </label>
          </div>
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">System Information</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <span className="font-medium">Last Updated:</span>{' '}
              {settings
                ? new Date(settings.updatedAt).toLocaleString()
                : 'Not configured'}
            </p>
            <p>
              <span className="font-medium">Version:</span> 1.0.0
            </p>
            <p>
              <span className="font-medium">Storage Type:</span> IndexedDB
            </p>
          </div>
        </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
