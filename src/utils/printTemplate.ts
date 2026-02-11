/**
 * Shared print template utility for consistent label formatting
 * Used by both new dispense prints and reprint functionality
 */

export interface PrintLabelData {
  drugName: string;
  strength: string;
  doseMg: number;
  frequency: string;
  duration: string;
  route: string;
  patientName?: string;
  patientAge?: number;
  patientWeight?: number;
  pharmacistName?: string;
  date: string;
  time: string;
  instructions?: string;
  warnings?: string[];
}

/**
 * Generates the exact same HTML print template for all pharmacy labels
 * This ensures consistency between new dispense and reprint formats
 */
export function generatePharmacyLabelHTML(data: PrintLabelData): string {
  const warningsText = data.warnings && data.warnings.length > 0 
    ? data.warnings.join('; ') 
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pharmacy Dispense Label</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { 
          margin: 0; 
          padding: 0;
          width: 100%;
          height: 100%;
        }
        body { 
          font-family: Arial, sans-serif; 
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
        }
        @page { 
          margin: 0; 
          padding: 0; 
          size: auto;
          width: 100%;
          height: 100%;
        }
        @media print {
          html, body { 
            margin: 0; 
            padding: 0; 
            background-color: white;
            width: 100%;
            height: 100%;
            display: block;
          }
          .label { 
            width: 100%; 
            border: none;
            margin: 0;
            padding: 15px;
            box-shadow: none;
          }
          * { display: block !important; visibility: visible !important; }
        }
        .label { 
          border: 2px solid #000; 
          padding: 15px; 
          width: 320px;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
          font-weight: bold; 
          font-size: 18px; 
          text-align: center; 
          margin-bottom: 12px;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          text-transform: uppercase;
        }
        .section {
          margin-bottom: 12px;
        }
        .field { 
          margin-bottom: 8px; 
          font-size: 12px;
          line-height: 1.4;
        }
        .field strong { 
          display: inline-block; 
          width: 85px; 
          font-weight: bold;
        }
        .field-value {
          display: inline;
        }
        .label-value { 
          font-weight: bold; 
          font-size: 13px; 
        }
        .patient-section {
          border: 1px solid #999;
          padding: 8px;
          margin: 8px 0;
          background-color: #fafafa;
        }
        .patient-section .field {
          margin-bottom: 6px;
        }
        .instructions-section { 
          border-top: 2px solid #000; 
          padding-top: 10px; 
          margin-top: 10px; 
          font-size: 11px;
          line-height: 1.5;
        }
        .instructions-header {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .warnings-section {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #ccc;
          color: #d32f2f;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #999;
          font-size: 10px;
          color: #333;
        }
        .footer-row {
          margin-bottom: 3px;
          line-height: 1.3;
        }
      </style>
    </head>
    <body>
      <div class="label">
        <!-- Drug Name Header -->
        <div class="header">${escapeHtml(data.drugName)}</div>

        <!-- Strength -->
        <div class="section">
          <div class="field">
            <strong>Strength:</strong>
            <span class="field-value">${escapeHtml(data.strength)}</span>
          </div>
        </div>

        <!-- Dose -->
        <div class="section">
          <div class="field">
            <strong>Dose:</strong>
            <span class="field-value label-value">${escapeHtml(String(data.doseMg.toFixed(2)))} mg</span>
          </div>
        </div>

        <!-- Frequency -->
        <div class="section">
          <div class="field">
            <strong>Frequency:</strong>
            <span class="field-value">${escapeHtml(data.frequency)}</span>
          </div>
        </div>

        <!-- Duration -->
        <div class="section">
          <div class="field">
            <strong>Duration:</strong>
            <span class="field-value">${escapeHtml(data.duration)}</span>
          </div>
        </div>

        <!-- Route -->
        <div class="section">
          <div class="field">
            <strong>Route:</strong>
            <span class="field-value">${escapeHtml((data.route || '').toUpperCase())}</span>
          </div>
        </div>

        <!-- Patient Information -->
        ${data.patientName ? `
        <div class="patient-section">
          <div class="field">
            <strong>Patient:</strong>
            <span class="field-value">${escapeHtml(data.patientName)}</span>
          </div>
          ${data.patientAge ? `
          <div class="field">
            <strong>Age:</strong>
            <span class="field-value">${escapeHtml(String(data.patientAge))} years</span>
          </div>
          ` : ''}
          ${data.patientWeight ? `
          <div class="field">
            <strong>Weight:</strong>
            <span class="field-value">${escapeHtml(String(data.patientWeight))} kg</span>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- Instructions -->
        <div class="instructions-section">
          <div class="instructions-header">Instructions:</div>
          <div style="font-size: 11px; line-height: 1.5;">
            ${escapeHtml(data.instructions || 'Take as directed')}
          </div>
          
          ${warningsText ? `
          <div class="warnings-section">
            [WARN] Warnings: ${escapeHtml(warningsText)}
          </div>
          ` : ''}
        </div>

        <!-- Footer with Date, Time, and Pharmacist -->
        <div class="footer">
          <div class="footer-row">
            <strong>Date:</strong> ${escapeHtml(data.date)}
          </div>
          <div class="footer-row">
            <strong>Time:</strong> ${escapeHtml(data.time)}
          </div>
          ${data.pharmacistName ? `
          <div class="footer-row">
            <strong>Pharmacist:</strong> ${escapeHtml(data.pharmacistName)}
          </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
