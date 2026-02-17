(async ()=>{
  try{
    const { Client } = require('pg');
    const conn = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
    if(!conn) throw new Error('No PRISMA_DATABASE_URL / DATABASE_URL set in env');
    const client = new Client({ connectionString: conn });
    await client.connect();

    console.log('Dropping index if exists: DispenseRecord_patientPhoneNumber_idx');
    await client.query('DROP INDEX IF EXISTS "DispenseRecord_patientPhoneNumber_idx";');
    console.log('Done.');

    await client.end();
  }catch(e){
    console.error('ERROR:', e && e.message ? e.message : e);
    process.exitCode = 1;
  }
})();
