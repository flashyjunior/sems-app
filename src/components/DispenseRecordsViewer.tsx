'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/db';
import { useAppStore } from '@/store/app';
import type { DispenseRecord } from '@/types';
import { Eye, Printer, Download, Trash2, FileDown, Search, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExportService } from '@/services/export';

interface DispenseRecordWithDetails extends DispenseRecord {
  index?: number;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  recordId?: string;
  onConfirm?: () => void;
}

export function DispenseRecordsViewer() {
  const [records, setRecords] = useState<DispenseRecordWithDetails[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DispenseRecordWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'synced' | 'pending'>('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [facilityName, setFacilityName] = useState('Licensed Community Pharmacy');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
  });
  const syncCompletedCounter = useAppStore((state) => state.syncCompletedCounter);
  const recordSavedCounter = useAppStore((state) => state.recordSavedCounter);
  const selectedDispenseRecordId = useAppStore((s) => s.selectedDispenseRecordId);

  // Fetch facility name on mount and when sync completes
  useEffect(() => {
    const fetchFacilityName = async () => {
      try {
        const settings = await db.systemSettings.get('system-settings');
        if (settings) {
          setFacilityName(settings.facilityName || 'Licensed Community Pharmacy');
        }
      } catch (err) {
        console.warn('Could not fetch facility name:', err);
      }
    };
    fetchFacilityName();
  }, [syncCompletedCounter]);

  // Debounce search text - waits 500ms after user stops typing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  // Refresh when filter changes, sync completes, or a record is saved
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    loadRecords();
  }, [filter, syncCompletedCounter, recordSavedCounter, debouncedSearchText, startDate, endDate]);

  // If an external component requests we open a particular dispense record, load and focus it
  useEffect(() => {
    if (!selectedDispenseRecordId) return;

    (async () => {
      try {
        await loadRecords();
        // fetch fresh array from db to compute index reliably
        let allRecords = await db.dispenseRecords.toArray();
        // Apply same client-side filters/search so index aligns with displayed list
        if (filter === 'synced') allRecords = allRecords.filter(r => r.synced);
        else if (filter === 'pending') allRecords = allRecords.filter(r => !r.synced);
        if (debouncedSearchText.trim()) {
          const lowerSearch = debouncedSearchText.toLowerCase();
          allRecords = allRecords.filter(r =>
            (r.patientName?.toLowerCase().includes(lowerSearch) ||
              r.drugName?.toLowerCase().includes(lowerSearch) ||
              r.pharmacistName?.toLowerCase().includes(lowerSearch) ||
              r.id.toLowerCase().includes(lowerSearch) ||
              (r.timestamp || 0).toString().includes(debouncedSearchText))
          );
        }
        if (startDate) {
          const startMs = new Date(startDate).getTime();
          allRecords = allRecords.filter(r => (r.timestamp || 0) >= startMs);
        }
        if (endDate) {
          const endDt = new Date(endDate);
          endDt.setHours(23, 59, 59, 999);
          const endMs = endDt.getTime();
          allRecords = allRecords.filter(r => (r.timestamp || 0) <= endMs);
        }
        allRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const idx = allRecords.findIndex(r => r.id === selectedDispenseRecordId);
        if (idx >= 0) {
          const page = Math.floor(idx / pageSize) + 1;
          setCurrentPage(page);
          const rec = allRecords[idx] as DispenseRecordWithDetails;
          setSelectedRecord(rec);
          setTimeout(() => {
            try {
              const el = document.querySelector(`[data-record-id=\"${selectedDispenseRecordId}\"]`);
              if (el && (el as HTMLElement).scrollIntoView) {
                (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            } catch (e) {}
          }, 150);
        }
      } catch (e) {
        console.error('Error focusing dispense record:', e);
      }
    })();
  }, [selectedDispenseRecordId]);

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

      // Apply search filter
      if (debouncedSearchText.trim()) {
        const lowerSearch = debouncedSearchText.toLowerCase();
        allRecords = allRecords.filter(r =>
          (r.patientName?.toLowerCase().includes(lowerSearch) ||
            r.drugName?.toLowerCase().includes(lowerSearch) ||
            r.pharmacistName?.toLowerCase().includes(lowerSearch) ||
            r.id.toLowerCase().includes(lowerSearch) ||
            (r.timestamp || 0).toString().includes(debouncedSearchText))
        );
      }

      // Apply date range filter
      if (startDate) {
        const startMs = new Date(startDate).getTime();
        allRecords = allRecords.filter(r => (r.timestamp || 0) >= startMs);
      }
      if (endDate) {
        const endDt = new Date(endDate);
        endDt.setHours(23, 59, 59, 999);
        const endMs = endDt.getTime();
        allRecords = allRecords.filter(r => (r.timestamp || 0) <= endMs);
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

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const allRecords = await db.dispenseRecords.toArray();
      const filtered = ExportService.exportFilteredRecords(
        allRecords,
        searchText,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
        filter
      );
      ExportService.exportToExcel(filtered, 'dispense-records.xlsx');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleCancelRecord = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Record',
      message: 'Are you sure you want to cancel this record? This action cannot be undone.',
      recordId: id,
      onConfirm: async () => {
        try {
          // Update local IndexedDB and mark as pending sync
          await db.dispenseRecords.update(id, { isActive: false, synced: false });
          setConfirmDialog({ isOpen: false, title: '', message: '' });
          loadRecords();
        } catch (error) {
          console.error('Error cancelling record:', error);
        }
      },
    });
  };

  const handlePrint = async (record: DispenseRecordWithDetails) => {
    const date = new Date(record.timestamp || 0);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const formattedDateTime = `${formattedDate} ${formattedTime}`;

    const rxNumber = (record.timestamp || 0).toString();
    const qrData = `${rxNumber}|${record.drugName}|${record.dose?.strength || 'N/A'}|${record.dose?.doseMg !== undefined ? record.dose.doseMg.toFixed(2) : 'N/A'}|${record.dose?.frequency || 'N/A'}|${record.dose?.dosageForm || ''}|${record.patientName || 'Unknown'}`;

    // Fetch facility settings - use the singleton pattern with 'system-settings' ID
    let facilityName = 'PHARMACY';
    let facilityAddress = '';
    let facilityPhone = '';
    let facilityEmail = '';
    
    try {
      // Get the singleton system settings record
      const settings = await db.systemSettings.get('system-settings');
      if (settings) {
        facilityName = settings.facilityName || 'PHARMACY';
        facilityAddress = settings.address || '';
        facilityPhone = settings.phone || '';
        facilityEmail = settings.email || '';
      }
    } catch (err) {
      console.warn('Error fetching system settings:', err);
    }

    // Build facility info HTML for header right section
    const facilityInfoHtml = `
      <div class="facility-details">
        <div class="detail-row">${facilityAddress || ''}</div>
        <div class="detail-row">${facilityPhone || ''}</div>
        <div class="detail-row">${facilityEmail || ''}</div>
      </div>
    `;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pharmacy Label</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 120mm; height: 80mm; font-family: Arial, sans-serif; }
          .label-container { width: 120mm; height: 80mm; padding: 2mm; background: white; }
          
          .header { 
            background: #FFD700; 
            padding: 3mm; 
            text-align: center;
            border-bottom: 1px solid #000;
            margin-bottom: 2mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 2mm;
          }
          
          .header-left {
            flex: 2;
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
          }
          
          .header-separator {
            width: 2px;
            height: 25mm;
            background: #000;
            margin: 0 1mm 0 2mm;
          }
          
          .facility-details {
            flex: 1;
            font-size: 6pt;
            text-align: right;
            line-height: 1.3;
          }
          
          .detail-row {
            padding: 0.5mm 0;
          }
          
          .main-section {
            display: grid;
            grid-template-columns: 30mm 1fr;
            gap: 2mm;
            margin: 2mm 0;
            align-items: flex-start;
          }
          
          .patient-left {
            font-size: 7pt;
            line-height: 1.2;
          }
          
          .patient-item {
            margin-bottom: 1.5mm;
          }
          
          .patient-item-label {
            font-weight: bold;
            font-size: 6pt;
          }
          
          .patient-item-value {
            font-size: 7pt;
          }
          
          .main-instruction {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            line-height: 1.2;
            padding: 2mm;
            visibility: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 15mm;
          }
          
          .drug-box {
            background: #FFD700;
            padding: 1.5mm;
            text-align: center;
            font-size: 10pt;
            font-weight: bold;
            margin: 1mm 0;
            border: 1px solid #000;
          }
          
          .instructions-box {
            font-size: 9pt;
            padding: 1mm;
            background: #f9f9f9;
            border: none;
            line-height: 1.2;
            min-height: 8mm;
          }
          
          .rx-number {
            font-size: 8pt;
            margin: 1mm 0;
            text-align: center;
            font-weight: bold;
          }
          
          .footer-section {
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 2mm;
            margin-top: 1.5mm;
            padding-top: 1.5mm;
            align-items: flex-start;
            row-gap: 2mm;
          }
          
          .footer-left {
            font-size: 6.5pt;
            line-height: 1.3;
          }
          
          .footer-field {
            margin-bottom: 0.5mm;
            line-height: 1.1;
          }
          
          .qr-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 24mm;
            height: 24mm;
          }
          
          .qr-container canvas,
          .qr-container img {
            width: 24mm !important;
            height: 24mm !important;
          }
          
          .warnings {
            font-size: 6pt;
            line-height: 1.2;
            padding: 1mm;
            border-left: 2px solid #f00;
            padding-left: 2mm;
          }
          
          .warnings-title {
            font-weight: bold;
            margin-bottom: 0.5mm;
            color: #f00;
          }
          
          .warning-item {
            margin-bottom: 0.5mm;
          }
          
          @page { 
            size: 120mm 80mm landscape; 
            margin: 0;
            padding: 0;
          }
          
          @media print { 
            * { margin: 0; padding: 0; }
            body { margin: 0; padding: 0; }
            .label-container { width: 120mm; height: 80mm; margin: 0; padding: 2mm; }
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <div class="header-left">${facilityName}</div>
            <div class="header-separator"></div>
            ${facilityInfoHtml}
          </div>
          
          <div class="main-section">
            <div class="patient-left">
              <div class="patient-item">
                <div class="patient-item-label">Patient:</div>
                <div class="patient-item-value">${record.patientName || '_____________'}</div>
              </div>
              <div class="patient-item">
                <div class="patient-item-label">Date:</div>
                <div class="patient-item-value">${formattedDateTime}</div>
              </div>
              <div class="patient-item">
                <div class="patient-item-label">Prescriber:</div>
                <div class="patient-item-value" style="margin-top: 8px;">_______________________________</div>
              </div>
            </div>
            
            <div>
              <div class="main-instruction">
                TAKE ${record.dose?.doseMg !== undefined ? record.dose.doseMg.toFixed(2) : '1'} ${(record.dose?.dosageForm ? record.dose.dosageForm.toUpperCase() : (record.dose?.route || 'TABLET').toUpperCase())}<br>${(record.dose?.frequency || 'N/A').toUpperCase()}
              </div>
              
              <div class="drug-box">
                ${record.drugName.toUpperCase()} ${record.dose?.strength || ''}${record.dose?.dosageForm ? ' (' + record.dose.dosageForm + ')' : ''}
              </div>
              
              <div class="instructions-box">
                <strong>Instructions:</strong> ${record.dose?.instructions || 'Take as directed'}
              </div>
            </div>
          </div>
          
          <div class="rx-number">
            Rx No: ${rxNumber}
          </div>
          
          <div class="footer-section">
            <div style="display: flex; gap: 2mm; align-items: flex-start;">
              ${record.dose?.warnings && record.dose.warnings.length > 0 ? `
                <div class="warnings">
                  <div class="warnings-title">⚠️ WARNINGS</div>
                  ${record.dose.warnings.map((w: string) => `<div class="warning-item">- ${w}</div>`).join('')}
                </div>
              ` : ''}
            </div>
            
            <div></div>
            
            <div class="qr-container" id="qrcode"></div>
            
            <div class="footer-left">
              <div class="footer-field"><strong>Dispensed by:</strong> ${record.pharmacistName || '__________'}</div>
            </div>
          </div>
        </div>
        
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            try {
              const qrContainer = document.getElementById('qrcode');
              new QRCode(qrContainer, {
                text: '${qrData.replace(/'/g, "\\'")}',
                width: 96,
                height: 96,
                colorDark: '#000000',
                colorLight: '#FFFFFF',
                correctLevel: QRCode.CorrectLevel.H
              });
            } catch(e) {
              console.error('QR Code generation failed:', e);
            }
            
            setTimeout(function() {
              window.print();
            }, 500);
          });
        <\/script>
      </body>
      </html>
    `;
    const printWindow = window.open('', '', 'width=600,height=400');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  // Calculate pagination
  const totalPages = useMemo(() => Math.ceil(records.length / pageSize), [records.length, pageSize]);
  const paginatedRecords = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    return records.slice(startIdx, endIdx);
  }, [records, currentPage, pageSize]);

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

  // Helper to get isActive status, checking both camelCase and lowercase variants
  const getIsActive = (record: any) => {
    // Check camelCase first, then lowercase, default to true
    if (record.isActive !== undefined) return record.isActive;
    if (record.isactive !== undefined) return record.isactive;
    return true; // Default to active if not specified
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

      {/* Search and Date Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search Box */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Patient, drug, pharmacist, ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* View Button */}
          <div className="flex items-end">
            <button
              onClick={loadRecords}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition text-sm"
              title="Apply filters and view results"
            >
              <Eye className="w-4 h-4" />
              {loading ? 'Loading...' : 'View'}
            </button>
          </div>

          {/* Export Button */}
          <div className="flex items-end">
            <button
              onClick={handleExportExcel}
              disabled={exporting || records.length === 0}
              className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition text-sm"
              title="Export filtered records to Excel"
            >
              <FileDown className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        {(searchText || startDate || endDate) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-200 flex-wrap">
            <span className="font-medium">Active Filters:</span>
            {searchText && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Search: {searchText}</span>}
            {startDate && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">From: {startDate}</span>}
            {endDate && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">To: {endDate}</span>}
            <button
              onClick={() => {
                setSearchText('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium ml-auto"
            >
              Clear Filters
            </button>
          </div>
        )}
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Patient</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Drug</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Dose</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedRecords.map((record) => {
                  const isActive = getIsActive(record);
                  const dateTime = `${formatDate(record.timestamp)} ${formatTime(record.timestamp)}`;
                  return (
                  <tr key={record.id} data-record-id={record.id} className={`hover:bg-gray-50 ${!isActive ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-2 text-sm text-gray-900 font-medium">{dateTime}</td>
                    <td className="px-6 py-2 text-sm text-gray-900">{record.patientName}</td>
                    <td className="px-6 py-2 text-sm text-gray-900">{record.drugName}</td>
                    <td className="px-6 py-2 text-sm text-gray-900">
                      {record.dose?.doseMg !== undefined ? record.dose.doseMg.toFixed(2) : 'N/A'} mg
                    </td>
                    <td className="px-6 py-2 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.synced
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.synced ? '✅ Synced' : ' Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-2 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(record).catch(console.error)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {isActive && (
                          <button
                            onClick={() => handleCancelRecord(record.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                            title="Cancel Record"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{records.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, records.length)}</span> of <span className="font-medium">{records.length}</span> records
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed rounded transition"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded transition text-sm ${
                      currentPage === page
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed rounded transition"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-4 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className={`sticky top-0 border-b px-6 py-4 flex justify-between items-center ${
              !getIsActive(selectedRecord) ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Dispense Record Details</h3>
                {!getIsActive(selectedRecord) && (
                  <span className="px-3 py-1 bg-red-200 text-red-800 rounded text-sm font-medium">CANCELED</span>
                )}
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                
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
                    {selectedRecord.synced ? '✅ Synced to Cloud' : ' Pending Sync'}
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
                  <p className="text-gray-900">{selectedRecord.dose?.doseMg !== undefined ? selectedRecord.dose.doseMg.toFixed(2) : 'N/A'} mg</p>
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
                onClick={() => handlePrint(selectedRecord).catch(console.error)}
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

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">{confirmDialog.title}</h3>
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-700 text-base">{confirmDialog.message}</p>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.onConfirm) {
                    confirmDialog.onConfirm();
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
              >
                Cancel Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


