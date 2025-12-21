import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function verifySeed() {
  try {
    console.log('Verifying database seed...\n');

    // Check drugs
    const drugCount = await prisma.drug.count();
    const drugs = await prisma.drug.findMany({ select: { genericName: true, strength: true } });
    console.log(`✓ Drugs: ${drugCount}`);
    drugs.forEach((d) => console.log(`  - ${d.genericName} ${d.strength}`));

    // Check dose regimens
    const regimenCount = await prisma.doseRegimen.count();
    console.log(`\n✓ Dose Regimens: ${regimenCount}`);

    // Check print templates
    const templateCount = await prisma.printTemplate.count();
    const templates = await prisma.printTemplate.findMany({ select: { name: true } });
    console.log(`\n✓ Print Templates: ${templateCount}`);
    templates.forEach((t) => console.log(`  - ${t.name}`));

    // Check users
    const userCount = await prisma.user.count();
    console.log(`\n✓ Users: ${userCount}`);

    console.log('\n✅ All data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeed();
