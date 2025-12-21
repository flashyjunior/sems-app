const { Client } = require('pg');
require('dotenv').config();

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('=== Roles ===');
    const roles = await client.query('SELECT * FROM "Role"');
    console.table(roles.rows);
    
    console.log('\n=== Users ===');
    const users = await client.query('SELECT id, email, "fullName", "roleId", "isActive" FROM "User"');
    console.table(users.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
})();
