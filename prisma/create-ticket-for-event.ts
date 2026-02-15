import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main(){
  const event = await prisma.dispensingEvent.findFirst({ where: { id: 1 } });
  if (!event) { console.log('no event'); process.exit(0); }

  const high = await prisma.highRiskAlert.create({ data: {
    dispensingEventId: event.id,
    timestamp: event.timestamp,
    pharmacyId: event.pharmacyId ?? undefined,
    userId: event.userId ?? undefined,
    drugId: event.drugId,
    riskScore: event.riskScore ?? undefined,
    riskCategory: event.riskCategory ?? undefined,
    riskFlags: event.riskFlags ?? undefined,
    message: `Automated ticket creation for event ${event.id}`,
  } });

  const ticket = await prisma.ticket.create({ data: {
    ticketNumber: `T-${Date.now()}`,
    userId: 1,
    title: `Auto: high risk event ${event.id}`,
    description: `Automated ticket for dispensing event ${event.id}`,
    category: 'urgent',
    priority: 'high',
  } });

  const at = await prisma.alertTicket.create({ data: {
    ticketId: ticket.id,
    highRiskAlertId: high.id,
    dispensingEventId: event.id,
  } });

  console.log('created', { highId: high.id, ticketId: ticket.id, alertTicketId: at.id });
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
