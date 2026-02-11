import { db } from '@/lib/db';
import type { PrintTemplate, TemplatePlaceholder } from '@/types';

const DEFAULT_HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <title>Pharmacy Label</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
    .label { border: 1px solid black; padding: 15px; width: 300px; }
    .header { font-weight: bold; font-size: 18px; text-align: center; margin-bottom: 10px; }
    .field { margin-bottom: 10px; }
    .label-value { font-weight: bold; font-size: 14px; }
    .instructions { border-top: 1px solid gray; padding-top: 10px; margin-top: 10px; font-size: 12px; }
    @media print { body { margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">{{drugName}}</div>
    <div class="field"><strong>Strength:</strong> {{strength}}</div>
    <div class="field"><strong>Dose:</strong> <div class="label-value">{{dose}} mg</div></div>
    <div class="field"><strong>Form:</strong> <div class="label-value">{{dosageForm}}</div></div>
    <div class="field"><strong>Frequency:</strong> {{frequency}}</div>
    <div class="field"><strong>Duration:</strong> {{duration}}</div>
    <div class="field"><strong>Route:</strong> {{route}}</div>
    {{#patientName}}<div class="field"><strong>Patient:</strong> {{patientName}}</div>{{/patientName}}
    {{#patientAge}}<div class="field"><strong>Age:</strong> {{patientAge}} years</div>{{/patientAge}}
    {{#patientWeight}}<div class="field"><strong>Weight:</strong> {{patientWeight}} kg</div>{{/patientWeight}}
    <div class="instructions">
      <strong>Instructions:</strong> {{instructions}}
      <br><br>
      <strong>Date:</strong> {{date}}
      {{#time}}<br><strong>Time:</strong> {{time}}{{/time}}
      {{#pharmacistName}}<br><strong>Pharmacist:</strong> {{pharmacistName}}{{/pharmacistName}}
    </div>
  </div>
</body>
</html>
`;

const DEFAULT_ESCPOS_TEMPLATE = `
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

export const AVAILABLE_PLACEHOLDERS: Record<TemplatePlaceholder, string> = {
  drugName: 'Drug Name',
  strength: 'Drug Strength',
  dose: 'Dose (in mg)',
  dosageForm: 'Dosage form (tablet/capsule/liquid/etc.)',
  frequency: 'Frequency (e.g., Every 8 hours)',
  duration: 'Duration (e.g., 7 days)',
  route: 'Route of Administration',
  patientName: 'Patient Name',
  patientAge: 'Patient Age (years)',
  patientWeight: 'Patient Weight (kg)',
  pharmacistName: 'Pharmacist Name',
  date: 'Current Date',
  time: 'Current Time',
  instructions: 'Special Instructions',
  warnings: 'Drug Warnings',
  contraindications: 'Contraindications',
};

export class TemplateService {
  async getDefaultTemplate(): Promise<PrintTemplate | null> {
    const result = await db.printTemplates
      .filter((t) => t.isDefault === true)
      .first();
    return result ?? null;
  }

  async getAllTemplates(): Promise<PrintTemplate[]> {
    return await db.printTemplates.toArray();
  }

  async getTemplate(templateId: string): Promise<PrintTemplate | null> {
    const result = await db.printTemplates.get(templateId);
    return result ?? null;
  }

  async createTemplate(
    name: string,
    htmlTemplate: string,
    escposTemplate?: string,
    description?: string
  ): Promise<PrintTemplate> {
    const template: PrintTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      htmlTemplate,
      escposTemplate,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.printTemplates.add(template);
    return template;
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<Omit<PrintTemplate, 'id' | 'createdAt'>>
  ): Promise<PrintTemplate> {
    await db.printTemplates.update(templateId, {
      ...updates,
      updatedAt: Date.now(),
    });

    const updated = await db.printTemplates.get(templateId);
    if (!updated) throw new Error('Template not found');
    return updated;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await db.printTemplates.delete(templateId);
  }

  async setDefaultTemplate(templateId: string): Promise<void> {
    // Clear previous default
    const current = await db.printTemplates
      .filter((t) => t.isDefault === true)
      .first();
    if (current) {
      await db.printTemplates.update(current.id, { isDefault: false });
    }

    // Set new default
    await db.printTemplates.update(templateId, { isDefault: true });
  }

  async initializeDefaultTemplates(): Promise<void> {
    const existing = await db.printTemplates.toArray();
    if (existing.length === 0) {
      const defaultTemplate: PrintTemplate = {
        id: 'template-default-html',
        name: 'Standard Pharmacy Label',
        description: 'Default pharmacy label template',
        htmlTemplate: DEFAULT_HTML_TEMPLATE,
        escposTemplate: DEFAULT_ESCPOS_TEMPLATE,
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.printTemplates.add(defaultTemplate);
    }
  }

  /**
   * Replace placeholders in template with actual values
   */
  renderTemplate(
    template: string,
    data: Record<string, unknown>
  ): string {
    let result = template;

    // Replace simple placeholders: {{placeholder}}
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    // Remove conditional sections: {{#key}}...{{/key}}
    Object.keys(data).forEach((key) => {
      if (!data[key]) {
        // If value is falsy, remove the conditional block
        const conditionalRegex = new RegExp(
          `{{#${key}}}.*?{{/${key}}}`,
          'gs'
        );
        result = result.replace(conditionalRegex, '');
      } else {
        // If value is truthy, remove the conditional markers but keep content
        const conditionalRegex = new RegExp(
          `{{#${key}}}(.*?){{/${key}}}`,
          'gs'
        );
        result = result.replace(conditionalRegex, '$1');
      }
    });

    return result;
  }
}

export const templateService = new TemplateService();
