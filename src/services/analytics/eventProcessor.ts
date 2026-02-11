/**
 * DPAP Event Processor Service
 * 
 * Captures dispensing events from SEMS and transforms them into analytics events.
 * Flow: Validate  Enrich  Risk Score  Save OLTP  Queue OLAP
 */

import { db } from '@/lib/db';

export interface DispensingEventInput {
  dispenseRecordId: string;
  timestamp: Date;
  pharmacyId: string;
  userId: number;
  drugId: string;
  drugName: string;
  genericName?: string;
  patientAgeGroup: 'paediatric' | 'adult' | 'geriatric';
  isPrescription: boolean;
  isControlledDrug?: boolean;
  isAntibiotic?: boolean;
  patientWeightKg?: number;
  patientIsPregnant?: boolean;
  stgCompliant?: boolean;
  overrideFlag?: boolean;
  overrideReason?: string;
}

export interface DispensingEventOutput {
  eventId: string;
  riskScore: number;
  riskCategory: 'none' | 'low' | 'medium' | 'high' | 'critical';
  riskFlags: string[];
  highRiskFlag: boolean;
  stgCompliant: boolean;
}

export class AnalyticsError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Main entry point: Capture a dispensing event
 * Called from DispenseForm after successful dispense record creation
 */
export async function captureDispensingEvent(
  input: DispensingEventInput
): Promise<DispensingEventOutput> {
  try {
    // Forward to server API which performs enrichment, scoring and persistence.
    const res = await fetch('/api/analytics/dispense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}` },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new AnalyticsError('Server failed to capture analytics event: ' + (err?.error || res.statusText));
    }

    const payload = await res.json();
    return payload.data as DispensingEventOutput;
  } catch (error) {
    console.error('[DPAP] Error capturing dispensing event:', error);
    throw new AnalyticsError('Failed to capture dispensing event', error);
  }
}



/**
 * Validate dispensing event input
 */
function validateDispensingEvent(input: DispensingEventInput): void {
  const errors: string[] = [];

  if (!input.pharmacyId?.trim()) {
    errors.push('pharmacyId is required');
  }

  if (!input.userId) {
    errors.push('userId is required');
  }

  if (!input.drugId?.trim()) {
    errors.push('drugId is required');
  }

  if (!['paediatric', 'adult', 'geriatric'].includes(input.patientAgeGroup)) {
    errors.push(`Invalid patientAgeGroup: ${input.patientAgeGroup}. Must be one of: paediatric, adult, geriatric`);
  }

  if (!(input.timestamp instanceof Date) || isNaN(input.timestamp.getTime())) {
    errors.push('timestamp must be a valid Date object');
  }

  if (input.patientWeightKg !== undefined && (input.patientWeightKg < 1 || input.patientWeightKg > 500)) {
    errors.push('patientWeightKg must be between 1 and 500');
  }

  if (errors.length > 0) {
    throw new ValidationError(`Event validation failed: ${errors.join('; ')}`);
  }
}

/**
 * Check if event should trigger high-risk alert
 */
export function shouldTriggerAlert(event: DispensingEventOutput): boolean {
  return event.highRiskFlag || event.riskCategory === 'critical';
}

/**
 * Format event details for logging/auditing
 */
export function formatEventForAudit(event: DispensingEventOutput): object {
  return {
    eventId: event.eventId,
    timestamp: new Date().toISOString(),
    riskScore: event.riskScore,
    riskCategory: event.riskCategory,
    riskFlags: event.riskFlags,
    stgCompliant: event.stgCompliant,
  };
}
