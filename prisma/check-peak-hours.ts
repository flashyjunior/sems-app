import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main(){
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  console.log('Checking peak hours from', start.toISOString(), 'to', end.toISOString());

  const events = await prisma.dispensingEvent.findMany({ where: { timestamp: { gte: start, lt: end } } });

  const hourData = new Map<number, { count: number; prescr: number; riskSum: number }>();
  events.forEach((event: any) => {
    const hr = new Date(event.timestamp).getHours();
    if (!hourData.has(hr)) hourData.set(hr, { count: 0, prescr: 0, riskSum: 0 });
    const d = hourData.get(hr)!;
    d.count += 1;
    d.prescr += event.isPrescription ? 1 : 0;
    d.riskSum += event.riskScore || 0;
  });

  const peaks = Array.from({ length: 24 }, (_, hour) => {
    const d = hourData.get(hour);
    return {
      hour,
      count: d?.count || 0,
      prescriptionCount: d?.prescr || 0,
      avgRiskScore: d && d.count ? d.riskSum / d.count : 0,
    };
  });

  console.log('Peak hours result length:', peaks.length);
  console.table(peaks.map(p => ({ hour: p.hour, count: p.count, prescriptionCount: p.prescriptionCount, avgRiskScore: p.avgRiskScore })));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
