import prisma from '../src/lib/prisma';

async function run() {
  console.log('Backfill: computing printDurationSec for existing dispensing events');

  // Find events that do not have printDurationSec set but have a dispenseRecordId
  const events = await prisma.dispensingEvent.findMany({ where: { printDurationSec: null, dispenseRecordId: { not: null } } });
  console.log(`Found ${events.length} candidate events`);

  let updated = 0;
  for (const ev of events) {
    if (!ev.dispenseRecordId) continue;

    try {
      const rec = await prisma.dispenseRecord.findUnique({ where: { externalId: ev.dispenseRecordId }, select: { createdAt: true, printedAt: true } }).catch(() => null as any);
      if (!rec) continue;
      if (!rec.createdAt || !rec.printedAt) continue;

      const deltaSec = Math.max(0, Math.round((new Date(rec.printedAt).getTime() - new Date(rec.createdAt).getTime()) / 1000));
      await prisma.dispensingEvent.update({ where: { id: ev.id }, data: { printDurationSec: deltaSec } });
      updated++;
    } catch (err) {
      console.warn(`Failed to backfill event id=${ev.id}:`, String(err));
    }
  }

  console.log(`Backfill complete. Updated ${updated} events.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Backfill failed', err);
  process.exit(1);
});
