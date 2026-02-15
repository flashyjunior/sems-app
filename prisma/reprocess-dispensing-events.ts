import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main(){
  console.log('Reprocessing dispensing events to compute risk scores...');

  // Find events missing riskCategory
  const events = await prisma.dispensingEvent.findMany({ where: { riskCategory: null }, orderBy: { createdAt: 'asc' } });
  console.log('Found', events.length, 'events to reprocess');

  let updated = 0;
  for (const e of events) {
    try {
      // Perform lightweight enrichment directly to avoid cross-module import issues
      const { calculateRiskScores } = await import('../src/services/analytics/riskScoringEngine.ts');

      const drug = await prisma.drug.findUnique({ where: { id: e.drugId } });

      const enriched = {
        drugId: drug?.id || e.drugId,
        drugCode: drug?.id || e.drugId,
        drugGenericName: drug?.genericName || e.genericName,
        drugClass: drug?.category || 'unknown',
        drugIsControlled: !!(drug && (drug.category === 'opioid' || drug.category === 'controlled')),
        drugIsAntibiotic: !!(drug && drug.category === 'antibiotic'),
        patientAgeGroup: (e.patientAgeGroup as any) || 'adult',
        patientWeightKg: undefined,
        patientIsPregnant: e.patientIsPregnant ?? false,
        isPrescription: e.isPrescription ?? true,
        stgCompliant: e.stgCompliant ?? false,
        overrideFlag: e.overrideFlag ?? false,
        overrideReason: e.overrideReason ?? undefined,
      };

      const risk = calculateRiskScores(enriched as any);

      // Update event record
      await prisma.dispensingEvent.update({ where: { id: e.id }, data: {
        riskScore: risk.score,
        riskCategory: risk.category,
        riskFlags: JSON.stringify(risk.flags || []),
        highRiskFlag: (risk.category === 'high' || risk.category === 'critical'),
        genericName: (enriched as any)?.drugGenericName || e.genericName,
      } });

      updated++;
    } catch (err) {
      console.error('Failed to reprocess event id=', e.id, err);
    }
  }

  console.log('Reprocessing complete. Updated:', updated);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
