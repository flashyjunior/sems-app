/**
 * find-orphan-pharmacies.ts
 *
 * Finds pharmacyId values referenced by DispensingEvent that do not exist in Pharmacy table.
 * Usage:
 *  npx ts-node src/scripts/find-orphan-pharmacies.ts
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
    console.log('Searching for dispensingEvent.pharmacyId values not present in Pharmacy table...');

    // Consider NULL, empty, or whitespace-only pharmacyId values as orphans;
    // also any pharmacyId that does not match an entry in Pharmacy table.
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT de."pharmacyId" AS pharmacyId, COUNT(*) AS cnt
       FROM "DispensingEvent" de
       LEFT JOIN "Pharmacy" p ON p.id = de."pharmacyId"
       WHERE (
         de."pharmacyId" IS NULL
         OR trim(coalesce(de."pharmacyId", '')) = ''
         OR p.id IS NULL
       )
       GROUP BY de."pharmacyId"
       ORDER BY cnt DESC;`
    );

    console.log('raw rows:', JSON.stringify(rows, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2));

    if (!rows.length) {
      console.log('No orphan pharmacyIds found. All dispensing events reference existing pharmacies (including empty/NULL checks).');
      process.exit(0);
    }

    console.log('\nOrphan pharmacyIds (pharmacyId, count):');
    for (const r of rows) {
      // Handle column name casing from raw query (pgsql driver returns lowercase keys)
      const rawVal = r.pharmacyid ?? r.pharmacyId ?? r.pharmacy ?? null;
      const count = (r.cnt ?? r.count ?? r._count) as any;
      const displayId = rawVal === null ? '<NULL>' : (String(rawVal).trim() === '' ? '<EMPTY>' : String(rawVal));
      console.log(`  ${displayId}: ${count}`);
    }

    // For each orphan id, show a couple of example dispensing event ids and timestamps
    for (const r of rows) {
      const rawId = r.pharmacyid ?? r.pharmacyId ?? r.pharmacy ?? null;
      const displayId = rawId === null ? '<NULL>' : (String(rawId).trim() === '' ? '<EMPTY>' : String(rawId));
      console.log(`\nExamples for ${displayId}:`);

      let samples: any[] = [];
      if (rawId === null) {
        samples = await prisma.$queryRawUnsafe(
          `SELECT id, "dispenseRecordId", timestamp, "createdAt", "pharmacyId" FROM "DispensingEvent" WHERE "pharmacyId" IS NULL ORDER BY "createdAt" DESC LIMIT 5`
        );
      } else if (String(rawId).trim() === '') {
        samples = await prisma.$queryRawUnsafe(
          `SELECT id, "dispenseRecordId", timestamp, "createdAt", "pharmacyId" FROM "DispensingEvent" WHERE trim(coalesce("pharmacyId",'')) = '' ORDER BY "createdAt" DESC LIMIT 5`
        );
      } else {
        samples = await prisma.$queryRawUnsafe(
          `SELECT id, "dispenseRecordId", timestamp, "createdAt", "pharmacyId" FROM "DispensingEvent" WHERE "pharmacyId" = $1 ORDER BY "createdAt" DESC LIMIT 5`,
          rawId
        );
      }

      if (!samples.length) {
        console.log('  (no sample rows returned)');
      }

      for (const s of samples) {
        console.log(`  id=${s.id}, dispenseRecordId=${s.dispenseRecordId || '<nil>'}, pharmacyId=${s.pharmacyId}, timestamp=${s.timestamp || s.createdAt}`);
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('Error running orphan check:', e);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
}

// Run when invoked directly
const invoked = process.argv[1] || '';
if (invoked.includes('find-orphan-pharmacies.ts') || invoked.endsWith('find-orphan-pharmacies.js')) {
  run();
}
