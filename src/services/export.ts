import * as XLSX from 'xlsx';
import type { DispenseRecord } from '@/types';

export class ExportService {
  static exportToExcel(records: DispenseRecord[], filename: string = 'dispense-records.xlsx') {
    try {
      // Prepare data for Excel
      const data = records.map((record, index) => ({
        '#': index + 1,
        'Date': record.timestamp ? new Date(record.timestamp).toLocaleDateString('en-US') : 'N/A',
        'Time': record.timestamp ? new Date(record.timestamp).toLocaleTimeString('en-US') : 'N/A',
        'Patient Name': record.patientName || '',
        'Age': record.patientAge || '',
        'Weight (kg)': record.patientWeight || '',
        'Drug Name': record.drugName || '',
        'Strength': record.dose?.strength || '',
        'Dose (mg)': record.dose?.doseMg || '',
        'Frequency': record.dose?.frequency || '',
        'Duration': record.dose?.duration || '',
        'Route': record.dose?.route || '',
        'Instructions': record.dose?.instructions || '',
        'Pharmacist': record.pharmacistName || '',
        'Status': record.synced ? 'Synced' : 'Pending',
        'Record ID': record.id,
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dispense Records');

      // Format columns width
      const colWidths = [
        { wch: 4 },  // #
        { wch: 12 }, // Date
        { wch: 12 }, // Time
        { wch: 18 }, // Patient Name
        { wch: 8 },  // Age
        { wch: 12 }, // Weight
        { wch: 18 }, // Drug Name
        { wch: 12 }, // Strength
        { wch: 12 }, // Dose
        { wch: 12 }, // Frequency
        { wch: 12 }, // Duration
        { wch: 12 }, // Route
        { wch: 20 }, // Instructions
        { wch: 15 }, // Pharmacist
        { wch: 10 }, // Status
        { wch: 20 }, // Record ID
      ];
      ws['!cols'] = colWidths;

      // Add header styling
      const headerRow = ws['!ref']?.split(':')[0] || 'A1';
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:P1');
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_col(C) + '1';
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '1F2937' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = filename.replace('.xlsx', `_${timestamp}.xlsx`);

      // Write file
      XLSX.writeFile(wb, finalFilename);
      
      return true;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  static exportFilteredRecords(
    records: DispenseRecord[],
    searchText?: string,
    startDate?: Date,
    endDate?: Date,
    syncFilter?: 'all' | 'synced' | 'pending'
  ) {
    let filtered = [...records];

    // Apply search filter
    if (searchText && searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(r =>
        (r.patientName?.toLowerCase().includes(lowerSearch) ||
          r.drugName?.toLowerCase().includes(lowerSearch) ||
          r.pharmacistName?.toLowerCase().includes(lowerSearch) ||
          r.id.toLowerCase().includes(lowerSearch) ||
          (r.timestamp || 0).toString().includes(searchText))
      );
    }

    // Apply date filter
    if (startDate) {
      const startMs = startDate.getTime();
      filtered = filtered.filter(r => (r.timestamp || 0) >= startMs);
    }
    if (endDate) {
      const endMs = endDate.getTime();
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => (r.timestamp || 0) <= endMs);
    }

    // Apply sync filter
    if (syncFilter === 'synced') {
      filtered = filtered.filter(r => r.synced);
    } else if (syncFilter === 'pending') {
      filtered = filtered.filter(r => !r.synced);
    }

    return filtered;
  }
}
