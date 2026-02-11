import type { DoseCalculation, DispenseRecord, PatientInput } from '@/types';
import { templateService } from './template';

interface LabelData {
  drugName: string;
  strength: string;
  dose: number;
  dosageForm?: string;
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
  facilityName?: string;
  facilityAddress?: string;
  facilityPhone?: string;
  facilityEmail?: string;
  rxNumber?: string;
}

export class PrintService {
  async printLabel(
    dose: DoseCalculation,
    patient: PatientInput,
    pharmacistName: string,
    timestamp?: number
  ): Promise<{ success: boolean; timestamp: number }> {
    try {
      const receiptTimestamp = timestamp || Date.now();
      const now = new Date(receiptTimestamp);
      const formattedDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const formattedDateTime = `${formattedDate} ${formattedTime}`;
      
      const rxNumber = receiptTimestamp.toString();
      
      // Fetch company/pharmacy info from local IndexedDB
      let facilityName = 'Licensed Community Pharmacy';
      let facilityAddress = '';
      let facilityPhone = '';
      let facilityEmail = '';
      try {
        const settingsService = (await import('@/services/settings')).settingsService;
        const settings = await settingsService.getSystemSettings();
        facilityName = settings?.facilityName || facilityName;
        facilityAddress = settings?.address || '';
        facilityPhone = settings?.phone || '';
        facilityEmail = settings?.email || '';
      } catch (err) {
        console.warn('Could not fetch facility settings:', err);
      }
      
      const labelData: LabelData = {
        drugName: dose.drugName,
        strength: dose.strength,
        dose: dose.doseMg,
        dosageForm: dose.dosageForm,
        frequency: dose.frequency,
        duration: dose.duration,
        route: dose.route,
        patientName: patient.name,
        patientAge: patient.age,
        patientWeight: patient.weight,
        pharmacistName,
        date: formattedDateTime,
        time: formattedTime,
        instructions: dose.instructions,
        warnings: dose.warnings || [],
        facilityName,
        facilityAddress,
        facilityPhone,
        facilityEmail,
        rxNumber,
      };

      const success = await this.printViaBrowser(labelData);
      return { success, timestamp: receiptTimestamp };
    } catch (error) {
      console.error('Print failed:', error);
      return { success: false, timestamp: timestamp || Date.now() };
    }
  }

  private generateQRCodeData(data: LabelData): string {
    // Use compact format to reduce data size for better scannability
    return `${data.rxNumber}|${data.drugName}|${data.strength}|${data.dose}|${data.frequency}|${data.patientName}`;
  }

  private async printViaBrowser(data: LabelData): Promise<boolean> {
    try {
      const qrData = this.generateQRCodeData(data);
      
      // Build warnings HTML
      const warningsHtml = data.warnings && data.warnings.length > 0
        ? `<div class="warnings">
            <div class="warnings-title">[WARN] WARNINGS</div>
            ${data.warnings.map((w: string) => `<div class="warning-item">- ${w}</div>`).join('')}
          </div>`
        : '';

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
              <div class="header-left">${data.facilityName || 'Licensed Community Pharmacy'}</div>
              <div class="header-separator"></div>
              <div class="facility-details">
                <div class="detail-row">${data.facilityAddress || ''}</div>
                <div class="detail-row">${data.facilityPhone || ''}</div>
                <div class="detail-row">${data.facilityEmail || ''}</div>
              </div>
            </div>
            
            <div class="main-section">
              <div class="patient-left">
                <div class="patient-item">
                  <div class="patient-item-label">Patient:</div>
                  <div class="patient-item-value">${data.patientName || '_____________'}</div>
                </div>
                <div class="patient-item">
                  <div class="patient-item-label">Date:</div>
                  <div class="patient-item-value">${data.date} ${data.time}</div>
                </div>
                <div class="patient-item">
                  <div class="patient-item-label">Prescriber:</div>
                  <div class="patient-item-value" style="margin-top: 8px;">_______________________________</div>
                </div>
              </div>
              
              <div>
                <div class="main-instruction">
                  TAKE ${data.dose} ${data.dosageForm ? data.dosageForm.toUpperCase() : data.route.toUpperCase()}<br>${data.frequency.toUpperCase()}
                </div>
                
                <div class="drug-box">
                  ${data.drugName.toUpperCase()} ${data.strength}${data.dosageForm ? ' (' + data.dosageForm + ')' : ''}
                </div>
                
                <div class="instructions-box">
                  <strong>Instructions:</strong> ${data.instructions || 'Take as directed'}
                </div>
              </div>
            </div>
            
            <div class="rx-number">
              Rx No: ${data.rxNumber}
            </div>
            
            <div class="footer-section">
              <div style="display: flex; gap: 2mm; align-items: flex-start;">
                ${warningsHtml}
              </div>
              
              <div></div>
              
              <div class="qr-container" id="qrcode"></div>
              
              <div class="footer-left">
                <div class="footer-field"><strong>Dispensed by:</strong> ${data.pharmacistName || '__________'}</div>
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
      if (!printWindow) return false;

      printWindow.document.write(printContent);
      printWindow.document.close();

      return true;
    } catch (error) {
      console.error('Browser print failed:', error);
      return false;
    }
  }

  private defaultEscposTemplate(): string {
    return `
{{drugName}}
Strength: {{strength}}
Dose: {{dose}} mg
 Form: {{dosageForm}}
Frequency: {{frequency}}
Duration: {{duration}}
Route: {{route}}
{{#patientName}}Patient: {{patientName}}{{/patientName}}
{{#patientAge}}Age: {{patientAge}} years{{/patientAge}}
Instructions: {{instructions}}
Date: {{date}} {{time}}
{{#pharmacistName}}Pharmacist: {{pharmacistName}}{{/pharmacistName}}
`;
  }
}

export const printService = new PrintService();
