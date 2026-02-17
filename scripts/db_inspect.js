(async ()=>{
  try{
    const { Client } = require('pg');
    const conn = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
    if(!conn) throw new Error('No PRISMA_DATABASE_URL / DATABASE_URL set in env');
    const client = new Client({ connectionString: conn });
    await client.connect();

    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name ILIKE '%user%' OR table_name ILIKE '%users%') ORDER BY table_name");
    const tables = tablesRes.rows.map(r=>r.table_name);
    console.log('Found tables matching user*:', tables);

    for(const t of tables){
      const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [t]);
      console.log(`\nColumns in ${t}:`, cols.rows.map(r=>r.column_name));
    }

    await client.end();
  }catch(e){
    console.error('ERROR:', e && e.message ? e.message : e);
    process.exitCode = 1;
  }
})();
