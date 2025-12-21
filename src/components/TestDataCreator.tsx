'use client';

import React, { useState } from 'react';
import { db, resetAllRecordsToUnsynced } from '@/lib/db';
import type { DispenseRecord } from '@/types';

interface TestDataCreatorProps {
  className?: string;
}

/**
 * Test Data Creator - Adds sample dispense records to IndexedDB for testing sync
 */
export function TestDataCreator({ className = '' }: TestDataCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recordCount, setRecordCount] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const createTestRecords = async () => {
    try {
      const records: DispenseRecord[] = [];
      const now = Date.now();

      for (let i = 0; i < recordCount; i++) {
        const record: DispenseRecord = {
          id: `test-${now}-${i}`,
          timestamp: now + i * 1000,
          pharmacistId: 'test-pharmacist',
          patientName: `Test Patient ${i + 1}`,
          patientAge: 30 + i,
          patientWeight: 70 + i * 2,
          drugId: 'amoxicillin-500',
          drugName: 'Amoxicillin 500mg',
          dose: {
            drugId: 'amoxicillin-500',
            drugName: 'Amoxicillin 500mg',
            strength: '500mg',
            doseMg: 500,
            frequency: 'Every 8 hours',
            duration: '7 days',
            route: 'oral',
            instructions: 'Take with food',
            stgCitation: 'STG-2024-001',
            warnings: ['May cause allergic reactions', 'Avoid in penicillin allergy'],
            requiresPinConfirm: false,
          },
          safetyAcknowledgements: ['Checked for allergies', 'Verified dosage'],
          printedAt: now + i * 1000,
          synced: false,
          deviceId: 'web-test',
          auditLog: [
            {
              timestamp: now + i * 1000,
              action: 'created',
              actor: 'test-user',
              details: { source: 'test' },
            },
          ],
        };

        records.push(record);
      }

      // Add to IndexedDB
      await db.dispenseRecords.bulkAdd(records);

      // Add to sync queue
      const syncItems = records.map((record) => ({
        id: `sync-${record.id}`,
        record,
        retries: 0,
      }));
      await db.syncQueue.bulkAdd(syncItems);

      setMessage(`✅ Created ${recordCount} test record${recordCount > 1 ? 's' : ''} - they should appear as pending in the sync control`);
      setTimeout(() => setMessage(null), 5000);
      setIsOpen(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMessage(`❌ Error: ${errorMsg}`);
    }
  };

  const handleResetSyncedStatus = async () => {
    try {
      const count = await resetAllRecordsToUnsynced();
      setMessage(`✅ Reset ${count} records to unsynced status`);
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMessage(`❌ Error: ${errorMsg}`);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Create test records for sync testing"
      >
        🧪 Test Data
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Create Test Records</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of records to create:
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={recordCount}
                onChange={(e) => setRecordCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Creates test dispense records with realistic data for sync testing
              </p>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.startsWith('✅')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={createTestRecords}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Create {recordCount} Record{recordCount > 1 ? 's' : ''}
              </button>
              <button
                onClick={handleResetSyncedStatus}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors text-xs"
                title="Reset all records to unsynced status"
              >
                🔄 Reset Synced
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              <strong>How to test sync:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click "Create {recordCount} Record{recordCount > 1 ? 's' : ''}" button</li>
                <li>Check sync control - should show pending count</li>
                <li>Click "Sync Now" to sync the test records</li>
                <li>Check logs for sync results</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
