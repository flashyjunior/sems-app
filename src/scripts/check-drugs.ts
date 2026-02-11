import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '@/lib/prisma';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

async function checkDrugs() {
  try {
    const drugs = await prisma.drug.findMany({
      select: {
        id: true,
        genericName: true,
        tradeName: true,
        category: true,
      },
      take: 20,
    });

    console.log('\n[chart] Drugs in Database:');
    console.log('====================\n');
    drugs.forEach((drug: any, index: number) => {
      console.log(`${index + 1}. ID: ${drug.id}`);
      console.log(`   Name: ${drug.genericName}`);
      console.log(`   Trade Names: ${drug.tradeName?.join(', ') || 'N/A'}`);
      console.log(`   Category: ${drug.category}`);
      console.log();
    });

    console.log(`\nTotal drugs: ${drugs.length}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDrugs();
