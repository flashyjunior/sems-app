'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';
import { settingsService } from '@/services/settings';
import type { UserProfile } from '@/types';

interface UserProfileSettingsProps {
  onBack: () => void;
  userId: string;
}

export function UserProfileSettings({ onBack, userId }: UserProfileSettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    specialization: '',
    theme: 'auto' as 'light' | 'dark' | 'auto',
    language: 'en' as 'en' | 'fr' | 'es',
    defaultDoseUnit: 'mg' as 'mg' | 'mcg' | 'mmol' | 'ml',
    autoLock: true,
    autoLockMinutes: 15,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await settingsService.getUserProfile(userId);
      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          fullName: userProfile.fullName || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          licenseNumber: userProfile.licenseNumber || '',
          specialization: userProfile.specialization || '',
          theme: (userProfile.theme as 'light' | 'dark' | 'auto') || 'auto',
          language: (userProfile.language as 'en' | 'fr' | 'es') || 'en',
          defaultDoseUnit: userProfile.defaultDoseUnit || 'mg',
          autoLock: userProfile.autoLock ?? true,
          autoLockMinutes: userProfile.autoLockMinutes || 15,
        });
      }
    } catch (err) {
      setError('Failed to load profile');
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

      if (!profile) {
        await settingsService.createUserProfile({
          id: `profile-${userId}`,
          userId,
          ...formData,
        });
      } else {
        await settingsService.updateUserProfile(userId, formData);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
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
          <h2 className="text-3xl font-bold text-gray-900">User Profile</h2>
          <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
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
          Profile updated successfully
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-3xl">
        <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Enter your full name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Enter your email"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Enter your phone number"
          />
        </div>

        {/* License Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
          <input
            type="text"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Enter your license number"
          />
        </div>

        {/* Specialization */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
          <select
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select specialization</option>
            <option value="general">General Pharmacist</option>
            <option value="clinical">Clinical Pharmacist</option>
            <option value="hospital">Hospital Pharmacist</option>
            <option value="retail">Retail Pharmacist</option>
          </select>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
          <select
            name="theme"
            value={formData.theme}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="auto">Auto (System)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>

        {/* Default Dose Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Dose Unit</label>
          <select
            name="defaultDoseUnit"
            value={formData.defaultDoseUnit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="mg">Milligrams (mg)</option>
            <option value="mcg">Micrograms (mcg)</option>
            <option value="g">Grams (g)</option>
            <option value="ml">Milliliters (ml)</option>
            <option value="units">Units</option>
          </select>
        </div>

        {/* Auto Lock Settings */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="autoLock"
              name="autoLock"
              checked={formData.autoLock}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="autoLock" className="text-sm font-medium text-gray-700">
              Auto-lock after inactivity
            </label>
          </div>

          {formData.autoLock && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lock after (minutes)
              </label>
              <input
                type="number"
                name="autoLockMinutes"
                value={formData.autoLockMinutes}
                onChange={handleChange}
                min="1"
                max="120"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          )}
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

