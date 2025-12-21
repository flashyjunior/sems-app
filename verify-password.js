const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    // Get the admin user's password hash from the database
    const result = await client.query(
      'SELECT id, email, password FROM "User" WHERE email = $1',
      ['admin@sems.local']
    );
    
    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('Admin user found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Password hash:', user.password);
    console.log('  Hash length:', user.password.length);
    console.log('  Hash type:', typeof user.password);
    
    // Test password comparison
    const testPassword = 'Admin@123';
    console.log('\nTesting password comparison...');
    console.log('  Testing password:', testPassword);
    console.log('  Password type:', typeof testPassword);
    console.log('  Password length:', testPassword.length);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('  Password matches:', isValid);
    
    if (!isValid) {
      console.log('\n⚠️ Password does NOT match!');
      console.log('The hash in the database appears to be corrupted or mismatched.');
      console.log('\nGenerating fresh hash and updating database...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('  New hash:', newHash);
      
      // Update the database with the new hash
      await client.query(
        'UPDATE "User" SET password = $1 WHERE email = $2',
        [newHash, 'admin@sems.local']
      );
      console.log('✓ Database updated with new password hash');
    } else {
      console.log('✓ Password matches perfectly!');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
})();
