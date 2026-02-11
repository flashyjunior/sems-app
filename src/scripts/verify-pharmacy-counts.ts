/**
 * verify-pharmacy-counts.ts
 *
 * Quick script to print counts per pharmacy for DispensingEvent and HighRiskAlert
 * Usage:
 *  npx ts-node src/scripts/verify-pharmacy-counts.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in the environment. Aborting.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as Prisma.PrismaClientOptions);

async function run() {
  try {
    console.log('Querying pharmacy counts...');

    const disp = await prisma.$queryRawUnsafe(
      `SELECT "pharmacyId" AS pharmacy, COUNT(*) AS cnt FROM "DispensingEvent" GROUP BY "pharmacyId" ORDER BY "pharmacyId";`
    );

    const alerts = await prisma.$queryRawUnsafe(
      `SELECT "pharmacyId" AS pharmacy, COUNT(*) AS cnt FROM "HighRiskAlert" GROUP BY "pharmacyId" ORDER BY "pharmacyId";`
    );

    console.log('\nDispensingEvent counts by pharmacy:');
    for (const r of disp as any[]) {
      console.log(`  ${r.pharmacy || '<NULL>'}: ${r.cnt}`);
    }

    console.log('\nHighRiskAlert counts by pharmacy:');
    for (const r of alerts as any[]) {
      console.log(`  ${r.pharmacy || '<NULL>'}: ${r.cnt}`);
    }

    process.exit(0);
  } catch (e) {
    console.error('Error querying counts:', e);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
}

run();
