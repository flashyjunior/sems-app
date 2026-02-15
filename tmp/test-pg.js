const { Client } = require('pg');

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('SELECT NOW() as now');
    console.log('Connected to Postgres:', res.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err.message || err);
    process.exit(1);
  }
})();
