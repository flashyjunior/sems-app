import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main(){
  // Check high/critical risk events
  const highRiskEvents = await prisma.dispensingEvent.findMany({ 
    where: {
      riskCategory: { in: ['high', 'critical'] }
    },
    orderBy: { timestamp: 'desc' }
  });
  
  console.log('High/Critical risk events count:', highRiskEvents.length);
  console.log('Sample high-risk events:');
  console.table(highRiskEvents.map(e => ({ 
    id: e.id, 
    drugId: e.drugId, 
    drugName: e.drugName, 
    genericName: e.genericName, 
    riskCategory: e.riskCategory,
    riskScore: e.riskScore
  })));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
