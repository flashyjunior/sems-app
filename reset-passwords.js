const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    // Hash the password
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Hashing password for: ' + password);
    console.log('Hashed: ' + hashedPassword);
    
    // Update the admin user password
    const result = await client.query(
      'UPDATE "User" SET password = $1 WHERE email = $2 RETURNING id, email',
      [hashedPassword, 'admin@sems.local']
    );
    
    if (result.rows.length > 0) {
      console.log('Updated admin user password');
      console.log(result.rows[0]);
    } else {
      console.log('Admin user not found');
    }
    
    // Also update pharmacist password
    const pharmacistHash = await bcrypt.hash('Pharmacist@123', 10);
    const phResult = await client.query(
      'UPDATE "User" SET password = $1 WHERE email = $2 RETURNING id, email',
      [pharmacistHash, 'pharmacist@sems.local']
    );
    
    if (phResult.rows.length > 0) {
      console.log('Updated pharmacist user password');
      console.log(phResult.rows[0]);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
})();
