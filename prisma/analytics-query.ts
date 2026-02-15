import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function parseDateRange(startStr: string, endStr: string) {
  const start = new Date(startStr);
  let end = new Date(endStr);
  if (/^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
    end = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
  }
  return { start, end };
}

async function main(){
  const sd = process.argv[2] || new Date().toISOString().slice(0,10);
  const ed = process.argv[3] || sd;
  const { start, end } = parseDateRange(sd, ed);
  console.log('range', start.toISOString(), end.toISOString());
  const rows = await prisma.dispensingEvent.findMany({ where: { timestamp: { gte: start, lt: end } } });
  console.log('found', rows.length, rows.map(r=>({id:r.id, pharmacyId: r.pharmacyId, timestamp: r.timestamp}))); 
  await prisma.$disconnect();
}

main().catch(e=>{ console.error(e); process.exit(1); });
