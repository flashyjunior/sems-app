import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  console.log('Creating or upserting demo pharmacy...');

  // Use findFirst then create if missing because `name` is not a unique field in schema
  let pharmacy = await prisma.pharmacy.findFirst({ where: { name: 'Demo Pharmacy' } });
  if (!pharmacy) {
    pharmacy = await prisma.pharmacy.create({
      data: {
        name: 'Demo Pharmacy',
        licenseNumber: 'DEMO-001',
        location: 'Main Street',
        address: '123 Demo St',
        phone: '+10000000000',
        email: 'demo@pharmacy.local',
        isActive: true,
      },
    });
  } else {
    pharmacy = await prisma.pharmacy.update({ where: { id: pharmacy.id }, data: { isActive: true, phone: '+10000000000', email: 'demo@pharmacy.local' } });
  }

  console.log('Upserted pharmacy:', { id: pharmacy.id, name: pharmacy.name });

  // Try to find pharmacist user
  const pharmacistEmail = 'pharmacist@sems.local';
  const user = await prisma.user.findUnique({ where: { email: pharmacistEmail } });
  if (!user) {
    console.warn('User not found:', pharmacistEmail);
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { pharmacyId: pharmacy.id } });
    console.log(`Assigned pharmacy ${pharmacy.id} -> user ${user.email}`);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
