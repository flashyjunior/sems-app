import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '@/lib/prisma';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

async function cleanup() {
  try {
    const result = await prisma.dispensingEvent.deleteMany({});
    console.log(`[OK] Deleted ${result.count} dispensing events`);
    process.exit(0);
  } catch (error) {
    console.error('Error deleting events:', error);
    process.exit(1);
  }
}

cleanup();
