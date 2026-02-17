const { Client } = require('pg');
(async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(2);
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%user%';");
    console.log('tables:', tablesRes.rows);

    const colsRes = await client.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND (table_name ILIKE '%user%' OR table_name ILIKE '%activity_log%') ORDER BY table_name, ordinal_position;");
    console.log('columns:');
    console.table(colsRes.rows);

    const fkRes = await client.query("SELECT conname, conrelid::regclass AS table, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE contype = 'f' AND (conrelid::regclass::text ILIKE '%activity_log%' OR pg_get_constraintdef(oid) ILIKE '%userId%');");
    console.log('fks:', fkRes.rows);

    const migrRes = await client.query("SELECT count(*) as cnt FROM information_schema.tables WHERE table_name='prisma_migrations';");
    console.log('prisma_migrations_table_exists:', migrRes.rows[0]);

    const recentRes = await client.query("SELECT id, migration_name, finished_at FROM prisma_migrations ORDER BY finished_at DESC LIMIT 10;").catch(e => ({ error: e.message }));
    console.log('recent_migrations:', recentRes.error ? recentRes : recentRes.rows);
  } catch (e) {
    console.error('error', e.message || e);
  } finally {
    await client.end();
  }
})();
