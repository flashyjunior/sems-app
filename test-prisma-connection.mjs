import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...\n');

    // Test 1: Simple SELECT 1
    console.log('✓ Testing basic connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ PostgreSQL connection works!');

    // Test 2: Count dispense records
    console.log('\n✓ Checking dispenseRecord table...');
    const count = await prisma.dispenseRecord.count();
    console.log(`✓ Found ${count} records in dispenseRecord table`);

    // Test 3: List recent records
    if (count > 0) {
      console.log('\n✓ Recent records:');
      const recent = await prisma.dispenseRecord.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          externalId: true,
          patientName: true,
          drugName: true,
          createdAt: true,
        },
      });
      console.log(JSON.stringify(recent, null, 2));
    } else {
      console.log('⚠ No records found in dispenseRecord table');
    }

    console.log('\n✨ All tests passed!');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
