'use client';

import { ChevronRight, Users, History, Pill, Beaker, AlertCircle, CheckCircle, Printer, User, Building2, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store/app';
import { DatabaseHealthIndicator } from './DatabaseHealthIndicator';

interface SettingsMenuProps {
  showHeader?: boolean;
}

export function SettingsMenu({ showHeader = true }: SettingsMenuProps) {
  const user = useAppStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      {showHeader ? (
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600 mt-1">Manage your preferences and system configuration</p>
        </div>
      ) : null}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dispense Records */}
        <Link
          href="/settings/records"
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
        </Link>

        {/* Sync All Data */}
        <Link
          href="/settings/data-sync"
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
        </Link>

        {/* Sync Configuration */}
        <Link
          href="/settings/sync-config"
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
        </Link>

        {/* Admin Users - Only for Admins */}
        {isAdmin && (
          <Link
            href="/settings/admin-users"
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
          </Link>
        )}

        {/* Pharmacy Management - Only for Admins */}
        {isAdmin && (
          <Link
            href="/settings/pharmacies"
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
          </Link>
        )}

        {/* User Pharmacy Assignment - Only for Admins */}
        {isAdmin && (
          <Link
            href="/settings/assignments"
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
          </Link>
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
        <Link
          href="/settings/templates"
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
        </Link>

        {/* Printer Settings */}
        <Link
          href="/settings/printers"
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
        </Link>

        {/* User Profile */}
        <Link
          href="/settings/profile"
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
        </Link>

        {/* System Settings - Admin Only */}
        {isAdmin && (
          <Link
            href="/settings/system"
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
          </Link>
        )}

        {/* Application Logs - Admin Only */}
        {isAdmin && (
          <Link
            href="/settings/logs"
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
          </Link>
        )}

        {/* SMTP Settings - Admin Only */}
        {isAdmin && (
          <Link
            href="/settings/smtp"
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
          </Link>
        )}

        {/* Pending Drug Approvals - Admin Only */}
        {isAdmin && (
          <Link
            href="/admin/pending-drugs-settings"
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
          </Link>
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
          <h4 className="font-semibold text-green-900 mb-2">✅ Status</h4>
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
