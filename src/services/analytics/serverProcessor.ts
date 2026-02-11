import prisma from '@/lib/prisma';
import { enrichEvent } from './eventEnricher';
import { calculateRiskScores } from './riskScoringEngine';
import { logInfo, logError } from '@/lib/logger';

export interface ServerDispenseInput {
  dispenseRecordId?: string | null;
  timestamp: string | Date;
  pharmacyId: string;
  userId: number;
  drugId: string;
  drugName?: string;
  genericName?: string | null;
  patientAgeGroup?: 'paediatric' | 'adult' | 'geriatric';
  isPrescription?: boolean;
  isControlledDrug?: boolean;
  isAntibiotic?: boolean;
  stgCompliant?: boolean;
  overrideFlag?: boolean;
  patientIsPregnant?: boolean;
}

export async function processDispensingEvent(input: ServerDispenseInput) {
  try {
    const enriched = await enrichEvent({
      dispenseRecordId: input.dispenseRecordId || null,
      timestamp: input.timestamp instanceof Date ? input.timestamp : new Date(input.timestamp),
      pharmacyId: input.pharmacyId,
      userId: input.userId,
      drugId: input.drugId,
      drugName: input.drugName || input.drugId,
      genericName: input.genericName || null,
      patientAgeGroup: input.patientAgeGroup || 'adult',
      isPrescription: input.isPrescription ?? true,
      isControlledDrug: input.isControlledDrug ?? false,
      isAntibiotic: input.isAntibiotic ?? false,
      stgCompliant: input.stgCompliant ?? false,
      overrideFlag: input.overrideFlag ?? false,
      patientIsPregnant: input.patientIsPregnant ?? false,
    } as any);

    const risk = calculateRiskScores(enriched as any);

    const created = await prisma.dispensingEvent.create({ data: {
      dispenseRecordId: input.dispenseRecordId || null,
      timestamp: input.timestamp instanceof Date ? input.timestamp : new Date(input.timestamp),
      pharmacyId: input.pharmacyId,
      userId: input.userId,
      drugId: input.drugId,
      drugName: input.drugName || input.drugId,
      genericName: enriched?.drugGenericName || input.genericName || input.drugName || null,
      patientAgeGroup: input.patientAgeGroup || 'adult',
      isPrescription: input.isPrescription ?? true,
      isControlledDrug: enriched?.drugIsControlled ?? input.isControlledDrug ?? false,
      isAntibiotic: enriched?.drugIsAntibiotic ?? input.isAntibiotic ?? false,
      stgCompliant: input.stgCompliant ?? false,
      overrideFlag: input.overrideFlag ?? false,
      patientIsPregnant: input.patientIsPregnant ?? false,
      riskScore: risk.score,
      riskCategory: risk.category,
      riskFlags: JSON.stringify(risk.flags || []),
      highRiskFlag: risk.category === 'high' || risk.category === 'critical',
    } });

    logInfo('Server processed analytics event', { id: created.id });

    return {
      eventId: created.id,
      riskScore: created.riskScore,
      riskCategory: created.riskCategory,
      riskFlags: JSON.parse(created.riskFlags || '[]'),
      highRiskFlag: created.highRiskFlag,
      stgCompliant: created.stgCompliant,
    };
  } catch (error) {
    logError('Server failed to process dispensing event', error);
    throw error;
  }
}
