import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  try {
    const testUserId = 2; // pharmacist
    const user = await prisma.user.findUnique({ where: { id: testUserId }, select: { id: true, pharmacyId: true, email: true } });
    console.log('User:', user);

    const userPharmacyId = user?.pharmacyId ?? null;

    const data: any = {
      externalId: `test-dispense-${Date.now()}`,
      patientName: 'Test Patient',
      patientPhoneNumber: '+10000000001',
      patientAge: 30,
      patientWeight: 70,
      drugId: 'drug-001',
      drugName: 'Paracetamol',
      dose: JSON.stringify({ amount: 500, unit: 'mg' }),
      safetyAcknowledgements: JSON.stringify([]),
      deviceId: 'test-device',
      printedAt: new Date(),
    };

    const createData: any = {
      userId: testUserId,
      externalId: data.externalId,
      ...(userPharmacyId ? { pharmacyId: userPharmacyId } : {}),
      patientName: data.patientName,
      patientPhoneNumber: data.patientPhoneNumber,
      patientAge: data.patientAge,
      patientWeight: data.patientWeight,
      drugId: data.drugId,
      drugName: data.drugName,
      dose: data.dose,
      safetyAcks: data.safetyAcknowledgements,
      deviceId: data.deviceId,
      printedAt: data.printedAt,
    };

    const created = await prisma.dispenseRecord.create({ data: createData });
    console.log('Created dispense:', { id: created.id, externalId: created.externalId, pharmacyId: created.pharmacyId, userId: created.userId });

    const eventCount = await prisma.dispensingEvent.count();
    console.log('DispensingEvent count after create:', eventCount);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
