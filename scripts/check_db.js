(async()=>{
  try {
    const prisma = require('../src/lib/prisma').default;
    const r = await prisma.user.findFirst({ select: { id: true } });
    console.log('SUCCESS', r);
    await prisma.$disconnect();
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : e);
    process.exitCode = 1;
  }
})();
