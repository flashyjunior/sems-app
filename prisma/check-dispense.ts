import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  try {
    console.log('Checking database: DispenseRecord and DispensingEvent...');

    const dispenseCount = await prisma.dispenseRecord.count();
    const eventCount = await prisma.dispensingEvent.count();

    console.log(`DispenseRecord count: ${dispenseCount}`);
    console.log(`DispensingEvent count: ${eventCount}`);

    const recentDispenses = await prisma.dispenseRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, externalId: true, pharmacyId: true, userId: true, drugId: true, createdAt: true },
    });

    console.log('\nRecent DispenseRecords:');
    console.table(recentDispenses.map(r => ({ id: r.id, externalId: r.externalId, pharmacyId: r.pharmacyId, userId: r.userId, drugId: r.drugId, createdAt: r.createdAt })));

    const recentEvents = await prisma.dispensingEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, dispenseRecordId: true, pharmacyId: true, userId: true, drugId: true, timestamp: true, createdAt: true },
    });

    console.log('\nRecent DispensingEvents:');
    console.table(recentEvents.map(e => ({ id: e.id, dispenseRecordId: e.dispenseRecordId, pharmacyId: e.pharmacyId, userId: e.userId, drugId: e.drugId, timestamp: e.timestamp, createdAt: e.createdAt })));

    const users = await prisma.user.findMany({ orderBy: { id: 'asc' }, select: { id: true, email: true, pharmacyId: true } , take: 20 });
    console.log('\nUsers (first 20):');
    console.table(users.map(u => ({ id: u.id, email: u.email, pharmacyId: u.pharmacyId })));

  } catch (e) {
    console.error('Error checking DB:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
