#!/usr/bin/env node

/**
 * Verify Admin Setup - Check if admin system is working correctly
 * Usage: node verify-admin-setup.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 SEMS Admin Setup Verification\n');
  console.log('=' .repeat(50));

  try {
    // 1. Check if admin role exists
    console.log('\n1️⃣  Checking for admin role...');
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    });

    if (adminRole) {
      console.log(`   ✅ Admin role found (ID: ${adminRole.id})`);
    } else {
      console.log('   ❌ Admin role NOT found');
      console.log('   💡 Run: node promote-to-admin.js <email> to create it');
    }

    // 2. Count total users
    console.log('\n2️⃣  Checking user count...');
    const totalUsers = await prisma.user.count();
    console.log(`   ✅ Total users in system: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('   ⚠️  No users found. Create users first.');
    }

    // 3. Check for admin users
    console.log('\n3️⃣  Checking for admin users...');
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          name: 'admin',
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (adminUsers.length > 0) {
      console.log(`   ✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(user => {
        console.log(`      • ${user.email} (${user.fullName})`);
      });
    } else {
      console.log('   ❌ No admin users found');
      console.log('\n   To promote a user to admin:');
      console.log('   1. Run: node list-users.js');
      console.log('   2. Pick an email address');
      console.log('   3. Run: node promote-to-admin.js <email>');
    }

    // 4. Check pharmacist users (most common non-admin role)
    console.log('\n4️⃣  Checking for pharmacist users...');
    const pharmacistUsers = await prisma.user.findMany({
      where: {
        role: {
          name: 'pharmacist',
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (pharmacistUsers.length > 0) {
      console.log(`   ✅ Found ${pharmacistUsers.length} pharmacist user(s):`);
      pharmacistUsers.slice(0, 3).forEach(user => {
        console.log(`      • ${user.email} (${user.fullName})`);
      });
      if (pharmacistUsers.length > 3) {
        console.log(`      ... and ${pharmacistUsers.length - 3} more`);
      }
    } else {
      console.log('   ℹ️  No pharmacist users found');
    }

    // 5. Check database connection
    console.log('\n5️⃣  Checking database connection...');
    const testConnection = await prisma.$queryRaw`SELECT 1 as connected`;
    if (testConnection && testConnection.length > 0) {
      console.log('   ✅ Database connection active');
    }

    // 6. Verify ticket system
    console.log('\n6️⃣  Checking ticket system...');
    const ticketCount = await prisma.ticket.count();
    console.log(`   ✅ Total tickets in system: ${ticketCount}`);

    // 7. Summary and next steps
    console.log('\n' + '='.repeat(50));
    console.log('\n📋 VERIFICATION SUMMARY:\n');

    if (adminRole && adminUsers.length > 0) {
      console.log('✅ ADMIN SETUP COMPLETE');
      console.log('\nYou can now:');
      console.log('  1. Login as admin user');
      console.log('  2. View "All Tickets (Admin)" tab');
      console.log('  3. Respond to tickets with admin badge');
    } else if (!adminRole) {
      console.log('⚠️  ADMIN ROLE MISSING - Setup Required');
      console.log('\nTo fix:');
      console.log('  $ node promote-to-admin.js pharmacist@example.com');
    } else if (adminUsers.length === 0) {
      console.log('⚠️  ADMIN USERS MISSING - Promotion Required');
      console.log('\nTo fix:');
      console.log('  1. $ node list-users.js          # See available users');
      console.log('  2. $ node promote-to-admin.js <email>  # Promote one');
    }

    console.log('\n' + '='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error during verification:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
