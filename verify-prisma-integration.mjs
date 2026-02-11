/**
 * Verify Prisma Integration
 * Tests that all database models and connections work correctly
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Prisma Integration Verification...\n');

  try {
    // Test 1: Connect to database
    console.log('Test 1: Verifying database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful\n');

    // Test 2: Check if tables exist
    console.log('Test 2: Checking for required tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(`✓ Found ${tables.length} tables in database`);
    const tableNames = tables.map(t => t.table_name).join(', ');
    console.log(`  Tables: ${tableNames}\n`);

    // Test 3: Verify DispenssingEvent model
    console.log('Test 3: Checking DispensingEvent table...');
    const eventCount = await prisma.dispensingEvent.count();
    console.log(`✓ DispensingEvent table accessible (${eventCount} events)\n`);

    // Test 4: Verify Pharmacy model
    console.log('Test 4: Checking Pharmacy table...');
    const pharmacyCount = await prisma.pharmacy.count();
    console.log(`✓ Pharmacy table accessible (${pharmacyCount} pharmacies)\n`);

    // Test 5: Verify Product model
    console.log('Test 5: Checking Product table...');
    const productCount = await prisma.product.count();
    console.log(`✓ Product table accessible (${productCount} products)\n`);

    // Test 6: Test aggregation queries
    console.log('Test 6: Testing aggregation queries...');
    
    // Query 1: Count events by date
    const eventsByDate = await prisma.dispensingEvent.groupBy({
      by: ['createdAt'],
      _count: true,
      take: 5,
    });
    console.log(`  - Events grouped by date: ${eventsByDate.length} distinct dates`);

    // Query 2: Top five dispensing events
    const topEvents = await prisma.dispensingEvent.findMany({
      take: 5,
      include: {
        pharmacy: true,
        product: true,
      },
    });
    console.log(`  - Top events query: ${topEvents.length} events retrieved`);

    console.log('✓ All aggregation queries working\n');

    // Test 7: Test date range queries
    console.log('Test 7: Testing date range queries...');
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentEvents = await prisma.dispensingEvent.findMany({
      where: {
        timestamp: {
          gte: sevenDaysAgo,
          lte: now,
        },
      },
    });
    console.log(`✓ Found ${recentEvents.length} events in the last 7 days\n`);

    // Final summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✓ PRISMA INTEGRATION VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\nAll critical database functions are working correctly:');
    console.log('  ✓ Database connection');
    console.log('  ✓ Table accessibility');
    console.log('  ✓ Model relationships');
    console.log('  ✓ Aggregation queries');
    console.log('  ✓ Date range queries');
    console.log('\nThe Prisma integration is ready for aggregationEngine.ts\n');

  } catch (error) {
    console.error('✗ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
