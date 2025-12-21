
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
