#!/usr/bin/env node

/**
 * List all users in the system with their roles
 * Usage: node list-users.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('ℹ️  No users found in the system');
      return;
    }

    console.log('\n📋 Users in the System:\n');
    console.log('─'.repeat(80));
    console.log(
      'ID | Email | Name | Role | Created At'
    );
    console.log('─'.repeat(80));

    users.forEach((user, index) => {
      const id = user.id.toString().padEnd(2);
      const email = (user.email || 'N/A').padEnd(30);
      const name = (user.fullName || 'N/A').padEnd(20);
      const role = (user.role?.name || 'N/A').padEnd(10);
      const createdAt = new Date(user.createdAt).toLocaleDateString();
      
      console.log(`${id} | ${email} | ${name} | ${role} | ${createdAt}`);
    });

    console.log('─'.repeat(80));
    console.log(`\nTotal: ${users.length} user(s)\n`);

    // Show admin promotion command
    const nonAdmins = users.filter((u) => u.role?.name !== 'admin');
    if (nonAdmins.length > 0) {
      console.log('💡 To promote a user to admin, run:');
      console.log(`   node promote-to-admin.js <email>\n`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
