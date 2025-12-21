#!/usr/bin/env node

/**
 * Direct SQL database initialization
 * Uses pg client to directly connect and initialize database
 */

require('dotenv').config();

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔄 SEMS Database Initialization');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    await client.connect();
    console.log('✓ Connected to PostgreSQL');
    console.log('');

    // Create roles
    console.log('📋 Creating roles...');
    
    const roles = [
      { name: 'admin', description: 'Administrator - Full system access' },
      { name: 'pharmacist', description: 'Pharmacist - Can create and manage dispense records' },
      { name: 'viewer', description: 'Viewer - Read-only access to records' },
    ];

    const roleIds = {};
    for (const role of roles) {
      const result = await client.query(
        `INSERT INTO "Role" (name, description, "createdAt", "updatedAt") 
         VALUES ($1, $2, NOW(), NOW()) 
         ON CONFLICT (name) DO UPDATE SET description = $2, "updatedAt" = NOW() RETURNING id`,
        [role.name, role.description]
      );
      roleIds[role.name] = result.rows[0].id;
    }

    console.log('✓ Roles created:', roleIds);
    console.log('');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    
    try {
      const adminResult = await client.query(
        `INSERT INTO "User" (email, "fullName", password, "licenseNumber", specialization, "roleId", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
         ON CONFLICT (email) DO NOTHING RETURNING id, email`,
        ['admin@sems.local', 'SEMS Administrator', adminPassword, 'ADMIN-001', 'System Administration', roleIds.admin, true]
      );
      
      if (adminResult.rows.length > 0) {
        console.log('✓ Admin user created:', adminResult.rows[0]);
      } else {
        console.log('ℹ️  Admin user already exists');
      }
    } catch (error) {
      console.log('ℹ️  Admin user already exists or error:', error.message.split('\n')[0]);
    }

    // Create pharmacist user
    console.log('👤 Creating sample pharmacist user...');
    const pharmacistPassword = await bcrypt.hash('Pharmacist@123', 10);

    try {
      const pharmacistResult = await client.query(
        `INSERT INTO "User" (email, "fullName", password, "licenseNumber", specialization, "roleId", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
         ON CONFLICT (email) DO NOTHING RETURNING id, email`,
        ['pharmacist@sems.local', 'Sample Pharmacist', pharmacistPassword, 'PHARM-001', 'General Pharmacy', roleIds.pharmacist, true]
      );
      
      if (pharmacistResult.rows.length > 0) {
        console.log('✓ Pharmacist user created:', pharmacistResult.rows[0]);
      } else {
        console.log('ℹ️  Pharmacist user already exists');
      }
    } catch (error) {
      console.log('ℹ️  Pharmacist user already exists or error:', error.message.split('\n')[0]);
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
    await client.end();
  }
}

initializeDatabase();
