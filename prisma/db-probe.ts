import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main(){
  const dispCount = await prisma.dispenseRecord.count();
  const eventCount = await prisma.dispensingEvent.count();
  const highCount = await prisma.highRiskAlert.count();
  const alertTicketCount = await prisma.alertTicket.count();
  const ticketCount = await prisma.ticket.count();

  console.log('counts:', { dispCount, eventCount, highCount, alertTicketCount, ticketCount });

  // show last 3 dispenseRecords
  const lastDisp = await prisma.dispenseRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 3 });
  console.log('lastDispenseRecords:', lastDisp.map(d => ({ id: d.id, externalId: d.externalId, pharmacyId: d.pharmacyId })));

  const lastEvents = await prisma.dispensingEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('lastDispensingEvents:', lastEvents.map(e => ({ id: e.id, dispenseRecordId: e.dispenseRecordId, pharmacyId: e.pharmacyId, riskCategory: e.riskCategory })));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
