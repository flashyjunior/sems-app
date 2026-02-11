import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local like other scripts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

import prisma from '@/lib/prisma';
import { createDispenseRecord } from '@/services/dispense.service';
import { enrichEvent } from '@/services/analytics/eventEnricher';
import { calculateRiskScores } from '@/services/analytics/riskScoringEngine';

async function main() {
  // Find a user with an assigned pharmacy
  const user = await prisma.user.findFirst({ where: { pharmacyId: { not: null } } });
  if (!user) {
    console.error('No user with pharmacyId found in database.');
    process.exit(1);
  }

  const payload = {
    externalId: `sim-dispense-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    pharmacyId: user.pharmacyId,
    patientName: 'Test Patient',
    patientPhoneNumber: '0000000000',
    patientAge: 35,
    patientWeight: 70,
    drugId: 'drug-001',
    drugName: 'TestDrug',
    dose: { drugId: 'drug-001', drugName: 'TestDrug', doseMg: 10, frequency: 'once', duration: '1 day', route: 'oral' },
    safetyAcknowledgements: [],
    deviceId: 'sim-device-1',
    printedAt: Date.now(),
    isActive: true,
    auditLog: [],
  } as any;

  console.log('Using user', { id: user.id, pharmacyId: user.pharmacyId });

  const created = await createDispenseRecord(user.id, payload);
  console.log('Dispense created:', { id: created.id, externalId: created.externalId });

  // Server-side enrichment + persistence
  const enriched = await enrichEvent({
    dispenseRecordId: String(created.id),
    timestamp: new Date(),
    pharmacyId: user.pharmacyId as string,
    userId: user.id,
    drugId: payload.drugId,
    drugName: payload.drugName,
    patientAgeGroup: 'adult',
    isPrescription: true,
  } as any);

  const risk = calculateRiskScores(enriched as any);

  await prisma.dispensingEvent.create({ data: {
    dispenseRecordId: String(created.id),
    timestamp: new Date(),
    pharmacyId: user.pharmacyId as string,
    userId: user.id,
    drugId: payload.drugId,
    drugName: payload.drugName,
    genericName: enriched?.drugGenericName || null,
    patientAgeGroup: 'adult',
    isPrescription: true,
    isControlledDrug: enriched?.drugIsControlled ?? false,
    isAntibiotic: enriched?.drugIsAntibiotic ?? false,
    stgCompliant: true,
    overrideFlag: false,
    patientIsPregnant: false,
    riskScore: risk.score,
    riskCategory: risk.category,
    riskFlags: JSON.stringify(risk.flags || []),
    highRiskFlag: risk.category === 'high' || risk.category === 'critical',
  } });

  console.log('Analytics event captured for dispense', created.id);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('Error in simulate-sync:', err);
  process.exit(1);
});
