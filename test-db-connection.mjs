#!/usr/bin/env node

// Test DATABASE_URL configuration and PostgreSQL connection
import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testConnection() {
  console.log('🔍 Testing DATABASE_URL Configuration...\n');

  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set in .env');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL is set');
  
  // Parse the URL
  try {
    const url = new URL(dbUrl);
    console.log('\n📊 Connection Details:');
    console.log(`  - Host: ${url.hostname}`);
    console.log(`  - Port: ${url.port || '5432'}`);
    console.log(`  - Database: ${url.pathname.replace('/', '')}`);
    console.log(`  - User: ${url.username}`);
  } catch (e) {
    console.error('❌ Invalid DATABASE_URL format');
    process.exit(1);
  }

  console.log('\n🔗 Testing Prisma connection...');
  
  try {
    // Use npx prisma to test connection
    const { stdout } = await execAsync('npx prisma validate');
    console.log('✅ Prisma schema validation: SUCCESS');
    
    // Try a simple query
    const { stdout: queryResult } = await execAsync('npx prisma db execute --stdin', {
      input: 'SELECT 1 as test;'
    });
    console.log('✅ PostgreSQL connection: SUCCESS');
    console.log(`\n📝 Query Result:\n${queryResult}`);
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error(error.message);
    process.exit(1);
  }

  console.log('\n✨ All tests passed!');
}

testConnection().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
