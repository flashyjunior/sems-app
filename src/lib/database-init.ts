// Stub for browser environment - database initialization only happens on backend server
// For frontend/Tauri app, the backend server handles all database operations

export const initializeDatabase = async () => {
  console.log('[Browser] Database initialization is handled by backend server');
  return true;
};

export const checkDatabaseConnection = async () => {
  console.log('[Browser] Checking connection via API...');
  try {
    const response = await fetch('/api/health/database');
    return response.ok;
  } catch {
    return false;
  }
};


const prisma = new PrismaClient();

/**
 * Initialize database with default admin user and roles
 * This should be run once on first deployment
 */
export async function initializeDatabase() {
  try {
    logInfo('Initializing SEMS database...');

    // Create default roles
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

    logInfo('Created default roles', {
      roles: [adminRole.name, pharmacistRole.name, viewerRole.name],
    });

    // Create default admin user if it doesn't exist
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

      logInfo('Created default admin user', {
        email: admin.email,
        userId: admin.id,
      });
    } else {
      logInfo('Admin user already exists', { email: adminEmail });
    }

    // Create sample pharmacist user if it doesn't exist
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

      logInfo('Created sample pharmacist user', {
        email: pharmacist.email,
        userId: pharmacist.id,
      });
    } else {
      logInfo('Pharmacist user already exists', { email: pharmacistEmail });
    }

    logInfo('Database initialization completed successfully');
    return true;
  } catch (error) {
    logError('Failed to initialize database', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialized successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}
