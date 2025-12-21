import type { DoseCalculation, DispenseRecord, PatientInput } from '@/types';
import { templateService } from './template';

interface LabelData {
  drugName: string;
  strength: string;
  dose: number;
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
  warnings?: string;
  contraindications?: string;
}

export class PrintService {
  async printLabel(
    dose: DoseCalculation,
    patient: PatientInput,
    pharmacistName: string
  ): Promise<boolean> {
    try {
      const now = new Date();
      // Format date as: "December 20, 2025"
      const formattedDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      // Format time as: "02:30:45 PM"
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      
      const labelData: LabelData = {
        drugName: dose.drugName,
        strength: dose.strength,
        dose: dose.doseMg,
        frequency: dose.frequency,
        duration: dose.duration,
        route: dose.route,
        patientName: patient.name,
        patientAge: patient.age,
        patientWeight: patient.weight,
        pharmacistName,
        date: formattedDate,
        time: formattedTime,
        instructions: dose.instructions,
        warnings: dose.warnings?.join('; '),
      };

      // Get the active template
      const template = await templateService.getDefaultTemplate();
      if (!template) {
        // Initialize default template if none exists
        await templateService.initializeDefaultTemplates();
      }

      // Check if we're in Tauri (desktop) environment
      if (this.isTauriEnvironment()) {
        return await this.printViaTauri(labelData, template);
      } else {
        // Browser PDF fallback
        return this.printViaBrowser(labelData, template);
      }
    } catch (error) {
      console.error('Print failed:', error);
      return false;
    }
  }

  private isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
  }

  private async printViaTauri(
    data: LabelData,
    template: any
  ): Promise<boolean> {
    try {
      // Render template with data
      const escposTemplate = template?.escposTemplate || this.defaultEscposTemplate();
      const escposCommands = templateService.renderTemplate(
        escposTemplate,
        data as unknown as Record<string, unknown>
      );

      console.log('ESC/POS Commands:', escposCommands);
      return true;
    } catch (error) {
      console.error('Tauri print failed:', error);
      return false;
    }
  }

  private async printViaBrowser(
    data: LabelData,
    template: any
  ): Promise<boolean> {
    try {
      // Use the exact same format as reprint for consistency
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
            <div class="header">${data.drugName}</div>
            <div class="field">
              <strong>Strength:</strong> ${data.strength}
            </div>
            <div class="field">
              <strong>Dose:</strong>
              <div class="label-value">${data.dose} mg</div>
            </div>
            <div class="field">
              <strong>Frequency:</strong> ${data.frequency}
            </div>
            <div class="field">
              <strong>Duration:</strong> ${data.duration}
            </div>
            <div class="field">
              <strong>Route:</strong> ${data.route}
            </div>
            ${data.patientName ? `<div class="field"><strong>Patient:</strong> ${data.patientName}</div>` : ''}
            ${data.patientAge ? `<div class="field"><strong>Age:</strong> ${data.patientAge} years</div>` : ''}
            ${data.patientWeight ? `<div class="field"><strong>Weight:</strong> ${data.patientWeight} kg</div>` : ''}
            <div class="barcode-container">
              <svg id="barcode"></svg>
            </div>
            <div class="instructions">
              <strong>Instructions:</strong> ${data.instructions || 'Take as directed'}
              <br><br>
              <strong>Date:</strong> ${data.date}
              <br>
              <strong>Time:</strong> ${data.time}
              ${data.pharmacistName ? `<br><strong>Pharmacist:</strong> ${data.pharmacistName}` : ''}
            </div>
          </div>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              if (typeof JsBarcode !== 'undefined') {
                JsBarcode("#barcode", "${Date.now().toString(36)}", {
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
