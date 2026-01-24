#!/usr/bin/env node

/**
 * Promote a user to admin role
 * Usage: node promote-to-admin.js <email>
 * Example: node promote-to-admin.js user@example.com
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node promote-to-admin.js <email>');
    console.log('Example: node promote-to-admin.js user@example.com');
    process.exit(1);
  }

  try {
    // 1. Ensure admin role exists
    let adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      console.log('📝 Creating admin role...');
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrator with full system access',
          permissions: JSON.stringify([
            'manage_users',
            'manage_roles',
            'manage_drugs',
            'manage_settings',
            'view_reports',
            'manage_tickets',
            'respond_to_tickets',
          ]),
        },
      });
      console.log('✅ Admin role created');
    }

    // 2. Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    // 3. Check if already admin
    if (user.roleId === adminRole.id) {
      console.log(`✅ User "${user.email}" is already an admin`);
      process.exit(0);
    }

    // 4. Promote user to admin
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { roleId: adminRole.id },
      include: { role: true },
    });

    console.log(`✅ User "${updatedUser.email}" has been promoted to admin`);
    console.log(`   Role: ${updatedUser.role.name}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
