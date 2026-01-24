import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Try to query the temp tables
    const tempDrugs = await prisma.tempDrug.findMany({ take: 1 });
    const tempRegimens = await prisma.tempDoseRegimen.findMany({ take: 1 });
    
    console.log('✅ TempDrug table exists and is accessible');
    console.log('✅ TempDoseRegimen table exists and is accessible');
    console.log('\nTables created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
