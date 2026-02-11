'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Printer,
  User,
  Building2,
  ChevronRight,
  Users,
  History,
  Pill,
  Beaker,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/app';
import { TemplateEditor } from './TemplateEditor';
import { UserProfileSettings } from './UserProfileSettings';
import { PrinterSettingsManager } from './PrinterSettingsManager';
import { SystemSettingsEditor } from './SystemSettingsEditor';
import { DatabaseHealthIndicator } from './DatabaseHealthIndicator';
import { AdminUsersManager } from './AdminUsersManager';
import { DispenseRecordsViewer } from './DispenseRecordsViewer';
import { DataSyncManager } from './DataSyncManager';
import { LogsViewer } from './LogsViewer';
import { SyncSettings } from './SyncSettings';
import { SMTPSettingsComponent } from './SMTPSettings';
import { PendingDrugsManager } from './PendingDrugsManager';
import { PharmacyManagement } from './PharmacyManagement';
import { UserPharmacyAssignment } from './UserPharmacyAssignment';

type SettingsSection = 'menu' | 'templates' | 'profile' | 'printers' | 'system' | 'admin-users' | 'records' | 'sync' | 'sync-config' | 'logs' | 'smtp' | 'pending-drugs' | 'pharmacy-mgmt' | 'user-pharmacy';

export function SettingsMenu() {
  const [currentSection, setCurrentSection] = useState<SettingsSection>('menu');
  const user = useAppStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const handleBack = () => setCurrentSection('menu');

  if (currentSection === 'templates') {
    return <TemplateEditor onClose={handleBack} />;
  }

  if (currentSection === 'profile') {
    return <UserProfileSettings onBack={handleBack} userId={user?.id || ''} />;
  }

  if (currentSection === 'printers') {
    return <PrinterSettingsManager onBack={handleBack} />;
  }

  if (currentSection === 'system') {
    return <SystemSettingsEditor onBack={handleBack} />;
  }

  if (currentSection === 'admin-users') {
    return <AdminUsersManager onBack={handleBack} />;
  }

  if (currentSection === 'pharmacy-mgmt') {
    return (
      <div>
        <button
          onClick={handleBack}
          className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
        >
           Back
        </button>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Pharmacy Management</h2>
            <p className="text-gray-600 mt-1">Create and manage pharmacy locations</p>
          </div>
          <PharmacyManagement />
        </div>
      </div>
    );
  }

  if (currentSection === 'user-pharmacy') {
    return (
      <div>
        <button
          onClick={handleBack}
          className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
        >
           Back
        </button>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">User Pharmacy Assignments</h2>
            <p className="text-gray-600 mt-1">Assign users to pharmacies for transaction tracking</p>
          </div>
          <UserPharmacyAssignment />
        </div>
      </div>
    );
  }

  if (currentSection === 'records') {
    return (
      <div>
        <button
          onClick={handleBack}
          className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
        >
           Back
        </button>
        <DispenseRecordsViewer />
      </div>
    );
  }

  if (currentSection === 'sync') {
    return (
      <div>
        <button
          onClick={handleBack}
          className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
        >
           Back
        </button>
        <DataSyncManager />
      </div>
    );
  }

  if (currentSection === 'sync-config') {
    return (
      <div>
        <button
          onClick={handleBack}
          className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
        >
           Back
        </button>
        <SyncSettings />
      </div>
    );
  }

  if (currentSection === 'logs') {
    return (
      <div>
        <button
          onClick={handleBack}
          className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
        >
           Back
        </button>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Application Logs</h2>
            <p className="text-gray-600 mt-1">View, filter, and manage system logs for troubleshooting</p>
          </div>
          <LogsViewer />
        </div>
      </div>
    );
  }

  if (currentSection === 'smtp') {
    return (
      <div>
        <button
          onClick={handleBack}
          className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
        >
           Back
        </button>
        <SMTPSettingsComponent />
      </div>
    );
  }
  if (currentSection === 'pending-drugs') {
    return <PendingDrugsManager onBack={handleBack} />;
  }
  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your preferences and system configuration</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dispense Records */}
        <button
          onClick={() => setCurrentSection('records')}
          className="flex items-start gap-4 p-6 border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-lg transition-shadow text-left"
        >
          <div className="p-3 bg-purple-600 rounded-lg flex-shrink-0">
            <History className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">Dispense Records</h3>
            <p className="text-sm text-gray-700 mt-1">View, print, and manage past records</p>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
        </button>

        {/* Sync All Data */}
        <button
          onClick={() => setCurrentSection('sync')}
          className="flex items-start gap-4 p-6 border-2 border-cyan-500 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg hover:shadow-lg transition-shadow text-left"
        >
          <div className="p-3 bg-cyan-600 rounded-lg flex-shrink-0">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">Sync Cloud Data</h3>
            <p className="text-sm text-gray-700 mt-1">Sync drugs, doses, printers & templates</p>
          </div>
          <ChevronRight className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-1" />
        </button>

        {/* Sync Configuration */}
        <button
          onClick={() => setCurrentSection('sync-config')}
          className="flex items-start gap-4 p-6 border-2 border-teal-500 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg hover:shadow-lg transition-shadow text-left"
        >
          <div className="p-3 bg-teal-600 rounded-lg flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">Sync Configuration</h3>
            <p className="text-sm text-gray-700 mt-1">Configure API server URL and sync interval</p>
          </div>
          <ChevronRight className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
        </button>

        {/* Admin Users - Only for Admins */}
        {isAdmin && (
          <button
            onClick={() => setCurrentSection('admin-users')}
            className="flex items-start gap-4 p-6 border-2 border-red-500 bg-gradient-to-br from-red-50 to-red-100 rounded-lg hover:shadow-lg transition-shadow text-left"
          >
            <div className="p-3 bg-red-600 rounded-lg flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">User Management</h3>
              <p className="text-sm text-gray-700 mt-1">Manage users, roles, and permissions</p>
            </div>
            <ChevronRight className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
          </button>
        )}

        {/* Pharmacy Management - Only for Admins */}
        {isAdmin && (
          <button
            onClick={() => setCurrentSection('pharmacy-mgmt')}
            className="flex items-start gap-4 p-6 border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-lg transition-shadow text-left"
          >
            <div className="p-3 bg-purple-600 rounded-lg flex-shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">Pharmacy Management</h3>
              <p className="text-sm text-gray-700 mt-1">Create and manage pharmacy locations</p>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
          </button>
        )}

        {/* User Pharmacy Assignment - Only for Admins */}
        {isAdmin && (
          <button
            onClick={() => setCurrentSection('user-pharmacy')}
            className="flex items-start gap-4 p-6 border-2 border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg hover:shadow-lg transition-shadow text-left"
          >
            <div className="p-3 bg-pink-600 rounded-lg flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">User Assignments</h3>
              <p className="text-sm text-gray-700 mt-1">Assign users to pharmacies</p>
            </div>
            <ChevronRight className="w-5 h-5 text-pink-600 flex-shrink-0 mt-1" />
          </button>
        )}

        {/* Drug Management - Admin Only */}
        {isAdmin && (
          <Link
            href="/drugs"
            className="flex items-start gap-4 p-6 border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg hover:shadow-lg transition-shadow text-left"
          >
            <div className="p-3 bg-amber-600 rounded-lg flex-shrink-0">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">Drug Management</h3>
              <p className="text-sm text-gray-700 mt-1">Create and manage drug catalog</p>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
          </Link>
        )}

        {/* Dose Regimen Management - Admin Only */}
        {isAdmin && (
          <Link
            href="/dose-regimens"
            className="flex items-start gap-4 p-6 border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg hover:shadow-lg transition-shadow text-left"
          >
            <div className="p-3 bg-orange-600 rounded-lg flex-shrink-0">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">Dose Regimens</h3>
              <p className="text-sm text-gray-700 mt-1">Create and manage dosing protocols</p>
            </div>
            <ChevronRight className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
          </Link>
        )}

        {/* Print Templates */}
        <button
          onClick={() => setCurrentSection('templates')}
          className="flex items-start gap-4 p-6 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-lg transition-shadow text-left"
        >
          <div className="p-3 bg-blue-600 rounded-lg flex-shrink-0">
            <Printer className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">Print Templates</h3>
            <p className="text-sm text-gray-700 mt-1">Customize dispense label layouts</p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
        </button>

        {/* Printer Settings */}
        <button
          onClick={() => setCurrentSection('printers')}
          className="flex items-start gap-4 p-6 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 hover:shadow transition-all text-left"
        >
          <div className="p-3 bg-gray-200 rounded-lg flex-shrink-0">
            <Printer className="w-6 h-6 text-gray-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">Printer Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Configure thermal, inkjet, laser printers</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        </button>

        {/* User Profile */}
        <button
          onClick={() => setCurrentSection('profile')}
          className="flex items-start gap-4 p-6 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 hover:shadow transition-all text-left"
        >
          <div className="p-3 bg-green-200 rounded-lg flex-shrink-0">
            <User className="w-6 h-6 text-green-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">User Profile</h3>
            <p className="text-sm text-gray-600 mt-1">Edit name, email, license, and preferences</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        </button>

        {/* System Settings - Admin Only */}
        {isAdmin && (
          <button
            onClick={() => setCurrentSection('system')}
            className="flex items-start gap-4 p-6 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 hover:shadow transition-all text-left"
          >
            <div className="p-3 bg-purple-200 rounded-lg flex-shrink-0">
              <Building2 className="w-6 h-6 text-purple-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">System Settings</h3>
              <p className="text-sm text-gray-600 mt-1">Facility info, sync, and data management</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
          </button>
        )}

        {/* Application Logs - Admin Only */}
        {isAdmin && (
          <button
            onClick={() => setCurrentSection('logs')}
            className="flex items-start gap-4 p-6 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 hover:shadow transition-all text-left"
          >
            <div className="p-3 bg-orange-200 rounded-lg flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-orange-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">Application Logs</h3>
              <p className="text-sm text-gray-600 mt-1">View system logs for troubleshooting</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
          </button>
        )}

        {/* SMTP Settings - Admin Only */}
        {isAdmin && (
          <button
            onClick={() => setCurrentSection('smtp')}
            className="flex items-start gap-4 p-6 border-2 border-green-500 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-lg transition-shadow text-left"
          >
            <div className="p-3 bg-green-600 rounded-lg flex-shrink-0">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">Email Configuration</h3>
              <p className="text-sm text-gray-700 mt-1">Configure SMTP settings for email notifications</p>
            </div>
            <ChevronRight className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
          </button>
        )}

        {/* Pending Drug Approvals - Admin Only */}
        {isAdmin && (
          <button
            onClick={() => setCurrentSection('pending-drugs')}
            className="flex items-start gap-4 p-6 border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg hover:shadow-lg transition-shadow text-left"
          >
            <div className="p-3 bg-indigo-600 rounded-lg flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">Pending Drugs</h3>
              <p className="text-sm text-gray-700 mt-1">Review and approve drug edits from pharmacists</p>
            </div>
            <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
          </button>
        )}
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2"> Tip</h4>
          <p className="text-sm text-blue-800">
            Settings are saved locally and synced to the server when you're online.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">[OK] Status</h4>
          <p className="text-sm text-green-800">
            All changes are saved automatically.
          </p>
        </div>
      </div>

      {/* Database Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Diagnostics</h3>
        <DatabaseHealthIndicator />
      </div>
    </div>
  );
}
