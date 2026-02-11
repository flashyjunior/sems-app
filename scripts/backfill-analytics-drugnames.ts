import prisma from '../src/lib/prisma';

async function run() {
  console.log('Backfill: updating dispensingEvent.genericName where null');

  const events = await prisma.dispensingEvent.findMany({ where: { genericName: null } });
  console.log(`Found ${events.length} events with null genericName`);

  let updated = 0;
  for (const ev of events) {
    let name: string | null = null;

    if (ev.drugId) {
      const drug = await prisma.drug.findUnique({ where: { id: ev.drugId } }).catch(() => null as any);
      if (drug && drug.genericName) name = drug.genericName;
    }

    if (!name && ev.drugName) name = ev.drugName as string;

    if (name) {
      await prisma.dispensingEvent.update({ where: { id: ev.id }, data: { genericName: name } });
      updated++;
    }
  }

  console.log(`Updated ${updated} events`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Backfill failed', err);
  process.exit(1);
});
