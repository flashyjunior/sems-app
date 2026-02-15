import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main(){
  const created = await prisma.dispensingEvent.create({ data: {
    dispenseRecordId: 'test-dispense-1770894385584',
    timestamp: new Date(),
    pharmacyId: '1',
    userId: 1,
    drugId: 'drug-001',
    drugName: 'Paracetamol',
    genericName: 'Paracetamol',
    patientAgeGroup: 'adult',
    isPrescription: true,
    isControlledDrug: false,
    isAntibiotic: false,
    stgCompliant: true,
    overrideFlag: false,
    patientIsPregnant: false,
    riskScore: 12.5,
    riskCategory: 'low',
    riskFlags: JSON.stringify([]),
    highRiskFlag: false,
  }});

  console.log('created dispensingEvent id=', created.id);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
