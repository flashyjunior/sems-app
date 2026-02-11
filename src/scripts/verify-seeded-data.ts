import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '@/lib/prisma';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

async function verify() {
  try {
    const events = await prisma.dispensingEvent.findMany({
      take: 5,
    });

    console.log('[OK] Sample seeded events:\n');
    events.forEach((event: any, i: number) => {
      console.log(`Event ${i + 1}:`);
      console.log(`  Timestamp: ${event.timestamp}`);
      console.log(`  Drug: ${event.genericName} (ID: ${event.drugId})`);
      console.log(`  Drug Name: ${event.drugName}`);
      console.log(`  User ID: ${event.userId}`);
      console.log(`  Risk Level: ${event.riskCategory}`);
      console.log();
    });

    const totalCount = await prisma.dispensingEvent.count();
    console.log(`Total events in database: ${totalCount}`);
    
    // Verify drug IDs are valid
    const validDrugIds = ['drug-001', 'drug-002', 'drug-003', 'drug-004', 'drug-005', 'drug-006', 'drug-007', 'drug-008'];
    const eventDrugIds = new Set(events.map((e: any) => e.drugId));
    console.log(`\n[OK] Drug IDs in sample events: ${Array.from(eventDrugIds).join(', ')}`);
    
    const allValid = Array.from(eventDrugIds).every((id: any) => validDrugIds.includes(id));
    console.log(`[OK] All drug IDs are valid: ${allValid ? 'YES' : 'NO'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error verifying:', error);
    process.exit(1);
  }
}

verify();
