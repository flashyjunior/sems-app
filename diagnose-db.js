#!/usr/bin/env node

/**
 * Database Diagnostic Script
 * Helps identify correct PostgreSQL connection string
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         SEMS Database Configuration Helper                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✓ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  const dbUrlLine = lines.find(line => line.startsWith('DATABASE_URL='));
  if (dbUrlLine) {
    console.log('✓ DATABASE_URL is set\n');
    
    // Parse and display
    const urlMatch = dbUrlLine.match(/DATABASE_URL="?([^"]+)"?/);
    if (urlMatch) {
      const url = urlMatch[1];
      console.log('Current DATABASE_URL configuration:');
      console.log('─'.repeat(60));
      
      try {
        const dbUrl = new URL(url);
        console.log(`Protocol:  ${dbUrl.protocol}`);
        console.log(`Username:  ${dbUrl.username || '(not set)'}`);
        console.log(`Password:  ${dbUrl.password ? '(set, masked)' : '(not set)'}`);
        console.log(`Host:      ${dbUrl.hostname}`);
        console.log(`Port:      ${dbUrl.port || '5432'}`);
        console.log(`Database:  ${dbUrl.pathname.replace('/', '')}`);
        console.log('─'.repeat(60));
        
        console.log('\n⚠️  To fix the connection, you need to verify:');
        console.log('');
        console.log('1. PostgreSQL is running:');
        console.log('   Command: Get-Service postgresql* (Windows)');
        console.log('   Or check pgAdmin is accessible');
        console.log('');
        console.log('2. Credentials match pgAdmin login:');
        console.log('   - Open pgAdmin in browser');
        console.log('   - Check Server properties for Host, Port, Username');
        console.log('   - Verify the password you set during PostgreSQL installation');
        console.log('');
        console.log('3. Database exists:');
        console.log(`   - In pgAdmin, look for database: "${dbUrl.pathname.replace('/', '')}"`);
        console.log('   - If missing, you may need to create it first');
        console.log('');
        console.log('4. Update DATABASE_URL if needed:');
        console.log('   Format: postgresql://username:password@host:port/database');
        console.log('   Example: postgresql://postgres:mypassword@localhost:5432/sems');
        console.log('');
        
      } catch (e) {
        console.log('❌ DATABASE_URL format is invalid\n');
        console.log('Expected format: postgresql://username:password@hostname:port/database');
        console.log('Example: postgresql://postgres:mypassword@localhost:5432/sems');
      }
    }
  } else {
    console.log('❌ DATABASE_URL is not set in .env file\n');
    console.log('Add this line to your .env file:');
    console.log('DATABASE_URL="postgresql://username:password@localhost:5432/database_name"');
  }
} else {
  console.log('❌ .env file not found\n');
  console.log('Create a .env file in the project root with:');
  console.log('DATABASE_URL="postgresql://username:password@localhost:5432/database_name"');
}

console.log('\n💡 Quick PostgreSQL Connection Test:');
console.log('─'.repeat(60));
console.log('1. Open pgAdmin (usually at http://localhost/pgadmin or http://localhost:5050)');
console.log('2. Expand "Servers" → your PostgreSQL server');
console.log('3. Right-click and select "Properties"');
console.log('4. Copy the Host, Port, and Username from there');
console.log('5. Database name might be "sems", "sems_db", or something else - check Databases');
console.log('6. Password is what you set during PostgreSQL installation');
console.log('─'.repeat(60));
console.log('');
