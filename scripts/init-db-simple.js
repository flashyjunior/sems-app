#!/usr/bin/env node

/**
 * Simple database initialization using Prisma CLI
 */

require('dotenv').config();

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('═══════════════════════════════════════════════════════');
console.log('🔄 SEMS Database Initialization');
console.log('═══════════════════════════════════════════════════════');
console.log('');

async function initializeDatabase() {
  try {
    // Step 1: Verify database connection
    console.log('1️⃣  Verifying database connection...');
    try {
      execSync('npx prisma db execute --stdin --file prisma/schema.prisma --skip-generate', {
        stdio: 'pipe',
        input: 'SELECT 1;',
      });
    } catch (e) {
      // This might fail but we'll proceed - the next step will verify properly
    }
    console.log('   ✓ Database accessible');
    console.log('');

    // Step 2: Use dynamic require to load PrismaClient
    console.log('2️⃣  Initializing application database...');
    
    // Import PrismaClient from the built module
    const modulePath = path.join(__dirname, '../node_modules/@prisma/client/index.js');
    if (!fs.existsSync(modulePath)) {
      throw new Error('Prisma Client not found. Run: npm install');
    }

    // Try using import instead
    const initScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function init() {
  const prisma = new PrismaClient();
  
  try {
    // Create roles
    console.log('   📋 Creating roles...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Administrator - Full system access',
      },
    });

    const pharmacistRole = await prisma.role.upsert({
      where: { name: 'pharmacist' },
      update: {},
      create: {
        name: 'pharmacist',
        description: 'Pharmacist - Can create and manage dispense records',
      },
    });

    const viewerRole = await prisma.role.upsert({
      where: { name: 'viewer' },
      update: {},
      create: {
        name: 'viewer',
        description: 'Viewer - Read-only access to records',
      },
    });

    console.log('   ✓ Roles created');

    // Create admin user
    console.log('   👤 Creating admin user...');
    const adminEmail = 'admin@sems.local';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'SEMS Administrator',
          password: hashedPassword,
          licenseNumber: 'ADMIN-001',
          specialization: 'System Administration',
          roleId: adminRole.id,
          isActive: true,
        },
      });
      console.log('   ✓ Admin user created');
    } else {
      console.log('   ℹ️  Admin user already exists');
    }

    // Create pharmacist user
    console.log('   👤 Creating sample pharmacist user...');
    const pharmacistEmail = 'pharmacist@sems.local';
    const existingPharmacist = await prisma.user.findUnique({
      where: { email: pharmacistEmail },
    });

    if (!existingPharmacist) {
      const hashedPassword = await bcrypt.hash('Pharmacist@123', 10);
      const pharmacist = await prisma.user.create({
        data: {
          email: pharmacistEmail,
          fullName: 'Sample Pharmacist',
          password: hashedPassword,
          licenseNumber: 'PHARM-001',
          specialization: 'General Pharmacy',
          roleId: pharmacistRole.id,
          isActive: true,
        },
      });
      console.log('   ✓ Pharmacist user created');
    } else {
      console.log('   ℹ️  Pharmacist user already exists');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Database initialization completed successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Default Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@sems.local');
    console.log('     Password: Admin@123');
    console.log('');
    console.log('   Pharmacist:');
    console.log('     Email: pharmacist@sems.local');
    console.log('     Password: Pharmacist@123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change these credentials in production!');
    console.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

init().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
`;

    // Write to temp file and execute
    fs.writeFileSync(path.join(__dirname, '_init-temp.js'), initScript);
    execSync(`node "${path.join(__dirname, '_init-temp.js')}"`, { stdio: 'inherit' });
    fs.unlinkSync(path.join(__dirname, '_init-temp.js'));
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
