import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main(){
  console.log('Backfill: scanning dispense records for missing dispensing events...');
  const records = await prisma.dispenseRecord.findMany({ where: {}, orderBy: { createdAt: 'asc' } });
  let created = 0;
  for (const r of records) {
    const exists = await prisma.dispensingEvent.findFirst({ where: { dispenseRecordId: r.externalId } });
    if (exists) continue;

    try {
      await prisma.dispensingEvent.create({ data: {
        dispenseRecordId: r.externalId,
        timestamp: r.createdAt || new Date(),
        pharmacyId: r.pharmacyId ? String(r.pharmacyId) : undefined,
        userId: r.userId,
        drugId: r.drugId,
        drugName: r.drugName,
        genericName: null,
        isPrescription: true,
        isControlledDrug: false,
        isAntibiotic: false,
        stgCompliant: false,
        overrideFlag: false,
        patientIsPregnant: false,
        riskScore: null,
        riskCategory: null,
        riskFlags: null,
        highRiskFlag: false,
      }});
      created++;
    } catch (e) {
      console.error('Failed to create event for', r.externalId, e);
    }
  }

  console.log('Backfill complete. Created events:', created);
  await prisma.$disconnect();
}

main().catch(e=>{ console.error(e); process.exit(1); });
