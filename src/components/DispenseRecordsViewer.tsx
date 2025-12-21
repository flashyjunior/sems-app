'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import type { DispenseRecord } from '@/types';
import { Eye, Printer, Download, Trash2 } from 'lucide-react';

interface DispenseRecordWithDetails extends DispenseRecord {
  index?: number;
}

export function DispenseRecordsViewer() {
  const [records, setRecords] = useState<DispenseRecordWithDetails[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DispenseRecordWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'synced' | 'pending'>('all');

  useEffect(() => {
    loadRecords();
  }, [filter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      let allRecords = await db.dispenseRecords.toArray();
      
      // Apply filter
      if (filter === 'synced') {
        allRecords = allRecords.filter(r => r.synced);
      } else if (filter === 'pending') {
        allRecords = allRecords.filter(r => !r.synced);
      }

      // Sort by timestamp descending
      allRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      setRecords(allRecords);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await db.dispenseRecords.delete(id);
      loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handlePrint = (record: DispenseRecordWithDetails) => {
    const date = new Date(record.timestamp || 0);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pharmacy Label</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 80mm; height: auto; }
          body { font-family: Arial, sans-serif; padding: 0; }
          .label { border: 1px solid black; padding: 8px; width: 100%; box-sizing: border-box; }
          .header { font-weight: bold; font-size: 14px; text-align: center; margin-bottom: 6px; border-bottom: 1px solid black; padding-bottom: 4px; }
          .field { margin-bottom: 4px; font-size: 11px; }
          .label-value { font-weight: bold; font-size: 12px; }
          .barcode-container { text-align: center; margin: 6px 0; }
          .barcode-container svg { max-width: 90%; height: auto; }
          .instructions { border-top: 1px solid black; padding-top: 6px; margin-top: 6px; font-size: 10px; line-height: 1.3; }
          @page { size: 80mm 297mm; margin: 0; padding: 0; }
          @media print { 
            * { margin: 0; padding: 0; }
            html, body { width: 80mm; margin: 0; padding: 0; }
            .label { width: 100%; border: 1px solid black; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">${record.drugName}</div>
          <div class="field">
            <strong>Strength:</strong> ${record.dose?.strength || 'N/A'}
          </div>
          <div class="field">
            <strong>Dose:</strong>
            <div class="label-value">${record.dose?.doseMg || 'N/A'} mg</div>
          </div>
          <div class="field">
            <strong>Frequency:</strong> ${record.dose?.frequency || 'N/A'}
          </div>
          <div class="field">
            <strong>Duration:</strong> ${record.dose?.duration || 'N/A'}
          </div>
          <div class="field">
            <strong>Route:</strong> ${record.dose?.route || 'N/A'}
          </div>
          ${record.patientName ? `<div class="field"><strong>Patient:</strong> ${record.patientName}</div>` : ''}
          ${record.patientAge ? `<div class="field"><strong>Age:</strong> ${record.patientAge} years</div>` : ''}
          ${record.patientWeight ? `<div class="field"><strong>Weight:</strong> ${record.patientWeight} kg</div>` : ''}
          <div class="barcode-container">
            <svg id="barcode"></svg>
          </div>
          <div class="instructions">
            <strong>Instructions:</strong> ${record.dose?.instructions || 'Take as directed'}
            <br><br>
            <strong>Date:</strong> ${formattedDate}
            <br>
            <strong>Time:</strong> ${formattedTime}
            ${record.pharmacistName ? `<br><strong>Pharmacist:</strong> ${record.pharmacistName}` : ''}
          </div>
        </div>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            if (typeof JsBarcode !== 'undefined') {
              JsBarcode("#barcode", "${record.id}", {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: false
              });
            }
            // Small delay to ensure barcode renders before print
            setTimeout(function() {
              window.print();
            }, 500);
          });
        <\/script>
      </body>
      </html>
    `;
    const printWindow = window.open('', '', 'width=384,height=1200');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return <div className="text-gray-600">Loading records...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dispense Records</h2>
        <p className="text-gray-600 mt-1">View and manage all dispensed records</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['all', 'synced', 'pending'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-medium transition ${
              filter === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'all' && ` (${records.length})`}
            {tab === 'synced' && ` (${records.filter(r => r.synced).length})`}
            {tab === 'pending' && ` (${records.filter(r => !r.synced).length})`}
          </button>
        ))}
      </div>

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-600">
          No {filter !== 'all' ? filter : ''} records found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Patient</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Drug</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Dose</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatDate(record.timestamp)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatTime(record.timestamp)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.patientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.drugName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.dose?.doseMg || 'N/A'} mg
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.synced
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.synced ? '✓ Synced' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(record)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Dispense Record Details</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-gray-900 font-medium">{formatDate(selectedRecord.timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Time</label>
                  <p className="text-gray-900 font-medium">{formatTime(selectedRecord.timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Sync Status</label>
                  <p className={`font-medium ${selectedRecord.synced ? 'text-green-700' : 'text-yellow-700'}`}>
                    {selectedRecord.synced ? '✓ Synced to Cloud' : '⏳ Pending Sync'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Patient Name</label>
                  <p className="text-gray-900">{selectedRecord.patientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Age</label>
                  <p className="text-gray-900">{selectedRecord.patientAge} years</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Weight</label>
                  <p className="text-gray-900">{selectedRecord.patientWeight} kg</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Drug</label>
                  <p className="text-gray-900">{selectedRecord.drugName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Dose</label>
                  <p className="text-gray-900">{selectedRecord.dose?.doseMg || 'N/A'} mg</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Route</label>
                  <p className="text-gray-900">{selectedRecord.dose?.route || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Frequency</label>
                  <p className="text-gray-900">{selectedRecord.dose?.frequency || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Duration</label>
                  <p className="text-gray-900">{selectedRecord.dose?.duration || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Instructions</label>
                  <p className="text-gray-900">{selectedRecord.dose?.instructions || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Warnings</label>
                  <p className="text-gray-900">{selectedRecord.dose?.warnings?.join(', ') || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t px-6 py-4 flex gap-2 justify-end">
              <button
                onClick={() => handlePrint(selectedRecord)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
