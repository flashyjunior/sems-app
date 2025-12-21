'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { Cloud, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/app';

export function DataSyncManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<{
    roles: number;
    users: number;
    drugs: number;
    doseRegimens: number;
    printerSettings: number;
    printTemplates: number;
  } | null>(null);
  const user = useAppStore((s) => s.user);

  const handleSyncAll = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const stats = {
        users: 0,
        drugs: 0,
        doseRegimens: 0,
        printerSettings: 0,
        printTemplates: 0,
        roles: 0,
      };

      // 1. Sync Roles
      try {
        const rolesResponse = await fetch(`${apiBaseUrl}/api/sync/pull-roles`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          if (rolesData.data && rolesData.data.length > 0) {
            for (const role of rolesData.data) {
              try {
                const existing = await db.roles.get(role.id);
                if (existing) {
                  await db.roles.update(role.id, role);
                } else {
                  await db.roles.add(role);
                }
              } catch (err) {
                console.error('Error saving role:', err);
              }
            }
            stats.roles = rolesData.data.length;
          }
        }
      } catch (err) {
        console.error('Error syncing roles:', err);
      }

      // 2. Sync Users
      try {
        const usersResponse = await fetch(`${apiBaseUrl}/api/sync/pull-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (usersData.users && usersData.users.length > 0) {
            for (const u of usersData.users) {
              try {
                const existing = await db.users.get(u.id);
                if (existing) {
                  await db.users.update(u.id, u);
                } else {
                  await db.users.add(u);
                }
              } catch (err) {
                console.error('Error saving user:', err);
              }
            }
            stats.users = usersData.users.length;
          }
        }
      } catch (err) {
        console.error('Error syncing users:', err);
      }

      // 2. Sync Drugs
      try {
        const drugsResponse = await fetch(`${apiBaseUrl}/api/sync/pull-drugs`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (drugsResponse.ok) {
          const drugsData = await drugsResponse.json();
          if (drugsData.data && drugsData.data.length > 0) {
            for (const drug of drugsData.data) {
              try {
                const existing = await db.drugs.get(drug.id);
                if (existing) {
                  await db.drugs.update(drug.id, drug);
                } else {
                  await db.drugs.add(drug);
                }
              } catch (err) {
                console.error('Error saving drug:', err);
              }
            }
            stats.drugs = drugsData.data.length;
          }
        }
      } catch (err) {
        console.error('Error syncing drugs:', err);
      }

      // 3. Sync Dose Regimens
      try {
        const dosesResponse = await fetch(`${apiBaseUrl}/api/sync/pull-dose-regimens`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (dosesResponse.ok) {
          const dosesData = await dosesResponse.json();
          if (dosesData.data && dosesData.data.length > 0) {
            for (const regimen of dosesData.data) {
              try {
                const existing = await db.doseRegimens.get(regimen.id);
                if (existing) {
                  await db.doseRegimens.update(regimen.id, regimen);
                } else {
                  await db.doseRegimens.add(regimen);
                }
              } catch (err) {
                console.error('Error saving dose regimen:', err);
              }
            }
            stats.doseRegimens = dosesData.data.length;
          }
        }
      } catch (err) {
        console.error('Error syncing dose regimens:', err);
      }

      // 4. Sync Printer Settings
      try {
        const printersResponse = await fetch(`${apiBaseUrl}/api/sync/pull-printer-settings`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (printersResponse.ok) {
          const printersData = await printersResponse.json();
          if (printersData.data && printersData.data.length > 0) {
            for (const printer of printersData.data) {
              try {
                const existing = await db.printerSettings.get(printer.id);
                if (existing) {
                  await db.printerSettings.update(printer.id, printer);
                } else {
                  await db.printerSettings.add(printer);
                }
              } catch (err) {
                console.error('Error saving printer settings:', err);
              }
            }
            stats.printerSettings = printersData.data.length;
          }
        }
      } catch (err) {
        console.error('Error syncing printer settings:', err);
      }

      // 5. Sync Print Templates
      try {
        const templatesResponse = await fetch(`${apiBaseUrl}/api/sync/pull-print-templates`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          if (templatesData.data && templatesData.data.length > 0) {
            for (const template of templatesData.data) {
              try {
                const existing = await db.printTemplates.get(template.id);
                if (existing) {
                  await db.printTemplates.update(template.id, template);
                } else {
                  await db.printTemplates.add(template);
                }
              } catch (err) {
                console.error('Error saving print template:', err);
              }
            }
            stats.printTemplates = templatesData.data.length;
          }
        }
      } catch (err) {
        console.error('Error syncing print templates:', err);
      }

      setSyncStats(stats);
      setSuccess(
        `✅ Sync complete! Roles: ${stats.roles}, Users: ${stats.users}, Drugs: ${stats.drugs}, Doses: ${stats.doseRegimens}, Printers: ${stats.printerSettings}, Templates: ${stats.printTemplates}`
      );
      setTimeout(() => setSuccess(null), 8000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error syncing data';
      setError(msg);
      console.error('Error syncing data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <Cloud className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Sync All Data</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Sync users, drugs, dose regimens, printer settings, and print templates from the cloud to your local database.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {syncStats && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-2">Last Sync Results:</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
            <p>� Roles: {syncStats.roles}</p>
            <p>�👥 Users: {syncStats.users}</p>
            <p>💊 Drugs: {syncStats.drugs}</p>
            <p>📋 Doses: {syncStats.doseRegimens}</p>
            <p>🖨️ Printers: {syncStats.printerSettings}</p>
            <p>🏷️ Templates: {syncStats.printTemplates}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleSyncAll}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}
