(async ()=>{
  try{
    const { Client } = require('pg');
    const conn = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
    if(!conn) throw new Error('No PRISMA_DATABASE_URL / DATABASE_URL set in env');
    const client = new Client({ connectionString: conn });
    await client.connect();

    console.log('Connected to DB, running DROP INDEX IF EXISTS...');
    const idxName = 'DispenseRecord_patientPhoneNumber_idx';
    await client.query(`DROP INDEX IF EXISTS "${idxName}";`);
    console.log(`Executed: DROP INDEX IF EXISTS \"${idxName}\";`);

    await client.end();
    console.log('Done.');
  }catch(e){
    console.error('ERROR:', e && e.message ? e.message : e);
    process.exitCode = 1;
  }
})();
