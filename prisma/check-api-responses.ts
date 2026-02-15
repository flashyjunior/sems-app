import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main(){
  // Check what fields are actually in DispensingEvent rows
  const events = await prisma.dispensingEvent.findMany({ take: 3, select: { id: true, drugId: true, drugName: true, genericName: true, riskCategory: true } });
  console.log('Sample DispensingEvent fields:', JSON.stringify(events, null, 2));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
