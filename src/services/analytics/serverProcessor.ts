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
    // Ensure pharmacyId is a string; if missing try to derive from user record
    let pharmacyIdStr: string | undefined = undefined;
    try {
      if (input.pharmacyId !== undefined && input.pharmacyId !== null) pharmacyIdStr = String(input.pharmacyId);
      else {
        const u = await prisma.user.findUnique({ where: { id: input.userId }, select: { pharmacyId: true } });
        if (u?.pharmacyId) pharmacyIdStr = String(u.pharmacyId);
      }
    } catch (e) {
      // ignore
    }

    const enriched = await enrichEvent({
      dispenseRecordId: input.dispenseRecordId || null,
      timestamp: input.timestamp instanceof Date ? input.timestamp : new Date(input.timestamp),
      pharmacyId: pharmacyIdStr ?? input.pharmacyId,
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

    // If we have a linked DispenseRecord, try to compute a print/prepare duration
    let printDurationSec: number | undefined = undefined;
    try {
      if (input.dispenseRecordId) {
        const rec = await prisma.dispenseRecord.findUnique({
          where: { externalId: input.dispenseRecordId },
          select: { printedAt: true, createdAt: true },
        });
        if (rec && rec.printedAt && rec.createdAt) {
          const delta = (new Date(rec.printedAt).getTime() - new Date(rec.createdAt).getTime()) / 1000;
          printDurationSec = Math.max(0, Math.round(delta));
        }
      }
    } catch (e) {
      // ignore failures to compute duration
    }

    const created = await prisma.dispensingEvent.create({ data: {
      dispenseRecordId: input.dispenseRecordId || null,
      timestamp: input.timestamp instanceof Date ? input.timestamp : new Date(input.timestamp),
      pharmacyId: pharmacyIdStr ?? (input.pharmacyId as any),
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
      printDurationSec: printDurationSec,
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
