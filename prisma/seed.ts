import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  try {
    console.log('🔄 Starting database seeding...');

    // Create roles
    console.log('📋 Creating roles...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Administrator - Full system access',
      },
    });

    const pharmacistRole = await prisma.role.upsert({
      where: { name: 'pharmacist' },
      update: {},
      create: {
        name: 'pharmacist',
        description: 'Pharmacist - Can create and manage dispense records',
      },
    });

    const viewerRole = await prisma.role.upsert({
      where: { name: 'viewer' },
      update: {},
      create: {
        name: 'viewer',
        description: 'Viewer - Read-only access to records',
      },
    });

    console.log('✓ Roles created:', {
      admin: adminRole.id,
      pharmacist: pharmacistRole.id,
      viewer: viewerRole.id,
    });

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminEmail = 'admin@sems.local';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'SEMS Administrator',
          password: hashedPassword,
          licenseNumber: 'ADMIN-001',
          specialization: 'System Administration',
          roleId: adminRole.id,
          isActive: true,
        },
      });

      console.log('✓ Admin user created:', {
        id: admin.id,
        email: admin.email,
      });
    } else {
      console.log('ℹ️  Admin user already exists:', adminEmail);
    }

    // Create pharmacist user
    console.log('👤 Creating sample pharmacist user...');
    const pharmacistEmail = 'pharmacist@sems.local';
    const existingPharmacist = await prisma.user.findUnique({
      where: { email: pharmacistEmail },
    });

    if (!existingPharmacist) {
      const hashedPassword = await bcrypt.hash('Pharmacist@123', 10);
      const pharmacist = await prisma.user.create({
        data: {
          email: pharmacistEmail,
          fullName: 'Sample Pharmacist',
          password: hashedPassword,
          licenseNumber: 'PHARM-001',
          specialization: 'General Pharmacy',
          roleId: pharmacistRole.id,
          isActive: true,
        },
      });

      console.log('✓ Pharmacist user created:', {
        id: pharmacist.id,
        email: pharmacist.email,
      });
    } else {
      console.log('ℹ️  Pharmacist user already exists:', pharmacistEmail);
    }

    // Seed Drugs
    console.log('');
    console.log('💊 Seeding drugs...');
    const drugsData = [
      {
        id: 'drug-001',
        genericName: 'Paracetamol',
        tradeName: ['Acetaminophen', 'Tylenol', 'Panadol'],
        strength: '500mg',
        route: 'oral',
        category: 'Analgesic/Antipyretic',
        stgReference: 'STG-2024-001',
        contraindications: ['Severe hepatic impairment', 'Hypersensitivity to paracetamol'],
        pregnancyCategory: 'A',
        warnings: ['Do not exceed 4g/day', 'Risk of hepatotoxicity with overdose', 'Use with caution in patients with liver disease'],
      },
      {
        id: 'drug-002',
        genericName: 'Amoxicillin',
        tradeName: ['Amoxil', 'Polymox', 'Moxatag'],
        strength: '250mg/500mg',
        route: 'oral',
        category: 'Antibiotic - Penicillin',
        stgReference: 'STG-2024-002',
        contraindications: ['Penicillin allergy', 'Mononucleosis', 'Severe renal impairment'],
        pregnancyCategory: 'B',
        warnings: ['Risk of allergic reactions', 'Take with food if GI upset occurs', 'Complete full course of therapy'],
      },
      {
        id: 'drug-003',
        genericName: 'Metformin',
        tradeName: ['Glucophage', 'Fortamet', 'Glumetza'],
        strength: '500mg/850mg/1000mg',
        route: 'oral',
        category: 'Antidiabetic',
        stgReference: 'STG-2024-003',
        contraindications: ['Renal impairment (eGFR <30)', 'Acute illness', 'Hypersensitivity'],
        pregnancyCategory: 'B',
        warnings: ['Risk of lactic acidosis', 'Monitor renal function regularly', 'Hold before radiographic contrast procedures'],
      },
      {
        id: 'drug-004',
        genericName: 'Lisinopril',
        tradeName: ['Prinivil', 'Zestril', 'Qbrelis'],
        strength: '2.5mg/5mg/10mg/40mg',
        route: 'oral',
        category: 'ACE Inhibitor - Antihypertensive',
        stgReference: 'STG-2024-004',
        contraindications: ['Pregnancy', 'History of angioedema', 'Bilateral renal artery stenosis'],
        pregnancyCategory: 'D',
        warnings: ['Monitor BP regularly', 'Risk of hyperkalemia', 'Persistent dry cough may occur', 'Do not use in pregnancy'],
      },
      {
        id: 'drug-005',
        genericName: 'Ibuprofen',
        tradeName: ['Advil', 'Motrin', 'Brufen'],
        strength: '200mg/400mg/600mg',
        route: 'oral',
        category: 'NSAID - Analgesic',
        stgReference: 'STG-2024-005',
        contraindications: ['Active GI ulcer', 'Severe renal disease', 'NSAID hypersensitivity'],
        pregnancyCategory: 'D',
        warnings: ['GI bleeding risk especially in elderly', 'Cardiovascular risk with prolonged use', 'Take with food', 'Do not exceed 3200mg/day without medical supervision'],
      },
      {
        id: 'drug-006',
        genericName: 'Azithromycin',
        tradeName: ['Zithromax', 'Zmax'],
        strength: '250mg/500mg',
        route: 'oral',
        category: 'Antibiotic - Macrolide',
        stgReference: 'STG-2024-006',
        contraindications: ['Macrolide hypersensitivity', 'QT prolongation history'],
        pregnancyCategory: 'B',
        warnings: ['May cause QT prolongation', 'Complete full course', 'Take on empty stomach or with food'],
      },
      {
        id: 'drug-007',
        genericName: 'Omeprazole',
        tradeName: ['Prilosec', 'Losec'],
        strength: '20mg/40mg',
        route: 'oral',
        category: 'Proton Pump Inhibitor',
        stgReference: 'STG-2024-007',
        contraindications: ['Hypersensitivity to omeprazole'],
        pregnancyCategory: 'C',
        warnings: ['Long-term use may reduce B12 absorption', 'May interact with clopidogrel', 'Take before meals'],
      },
      {
        id: 'drug-008',
        genericName: 'Atorvastatin',
        tradeName: ['Lipitor', 'Sortis'],
        strength: '10mg/20mg/40mg/80mg',
        route: 'oral',
        category: 'Statin - Lipid-lowering',
        stgReference: 'STG-2024-008',
        contraindications: ['Active liver disease', 'Pregnancy', 'Lactation'],
        pregnancyCategory: 'X',
        warnings: ['Monitor liver function', 'May cause muscle pain/myopathy', 'Take with or without food'],
      },
      {
        id: 'drug-009',
        genericName: 'Amlodipine',
        tradeName: ['Norvasc', 'Amlodipin'],
        strength: '2.5mg/5mg/10mg',
        route: 'oral',
        category: 'Calcium Channel Blocker',
        stgReference: 'STG-2024-009',
        contraindications: ['Hypersensitivity', 'Cardiogenic shock'],
        pregnancyCategory: 'C',
        warnings: ['May cause ankle edema', 'Monitor BP regularly', 'May cause flushing and headache'],
      },
      {
        id: 'drug-010',
        genericName: 'Ciprofloxacin',
        tradeName: ['Cipro', 'Ciproxin'],
        strength: '250mg/500mg/750mg',
        route: 'oral',
        category: 'Antibiotic - Fluoroquinolone',
        stgReference: 'STG-2024-010',
        contraindications: ['Tendon disorders', 'QT prolongation', 'Hypersensitivity'],
        pregnancyCategory: 'C',
        warnings: ['Risk of tendinopathy', 'May cause photosensitivity', 'Avoid in pregnancy and nursing'],
      },
    ];

    for (const drug of drugsData) {
      await prisma.drug.upsert({
        where: { id: drug.id },
        update: drug,
        create: drug,
      });
    }
    console.log(`✓ ${drugsData.length} drugs seeded`);

    // Seed Dose Regimens
    console.log('');
    console.log('📋 Seeding dose regimens...');
    const regimensData = [
      // Paracetamol regimens
      {
        id: 'regimen-001',
        drugId: 'drug-001',
        ageMin: 18,
        ageMax: 65,
        weightMin: 50,
        ageGroup: 'adult',
        doseMg: '500-1000mg',
        frequency: 'Every 4-6 hours',
        duration: 'As needed',
        maxDoseMgDay: '4000mg',
        route: 'oral',
        instructions: 'Take with water after meals to reduce GI upset. Maximum 4 doses per day.',
      },
      {
        id: 'regimen-002',
        drugId: 'drug-001',
        ageMin: 12,
        ageMax: 18,
        weightMin: 30,
        ageGroup: 'pediatric',
        doseMg: '250-500mg',
        frequency: 'Every 4-6 hours',
        duration: 'As needed',
        maxDoseMgDay: '2000mg',
        route: 'oral',
        instructions: 'Dosage based on weight: 15mg/kg per dose. Do not exceed 5 doses per day.',
      },
      // Amoxicillin regimens
      {
        id: 'regimen-003',
        drugId: 'drug-002',
        ageMin: 18,
        ageMax: 65,
        weightMin: 50,
        ageGroup: 'adult',
        doseMg: '250-500mg',
        frequency: 'Three times daily',
        duration: '7-14 days',
        maxDoseMgDay: '3000mg',
        route: 'oral',
        instructions: 'Take with food if GI upset occurs. Complete the full course even if feeling better.',
      },
      {
        id: 'regimen-004',
        drugId: 'drug-002',
        ageMin: 6,
        ageMax: 12,
        weightMin: 20,
        ageGroup: 'pediatric',
        doseMg: '125-250mg',
        frequency: 'Three times daily',
        duration: '7-10 days',
        maxDoseMgDay: '750mg',
        route: 'oral',
        instructions: 'Dosage based on weight: 25mg/kg/day in divided doses. Take with or without food.',
      },
      // Metformin regimens
      {
        id: 'regimen-005',
        drugId: 'drug-003',
        ageMin: 18,
        ageMax: 65,
        weightMin: 50,
        ageGroup: 'adult',
        doseMg: '500-850mg',
        frequency: 'Twice daily',
        duration: 'Long-term',
        maxDoseMgDay: '2550mg',
        route: 'oral',
        instructions: 'Take with meals. Monitor renal function every 6-12 months. Start low and titrate gradually.',
      },
      {
        id: 'regimen-006',
        drugId: 'drug-003',
        ageMin: 10,
        ageMax: 17,
        weightMin: 25,
        ageGroup: 'pediatric',
        doseMg: '500-1000mg',
        frequency: 'Twice daily',
        duration: 'Long-term',
        maxDoseMgDay: '2000mg',
        route: 'oral',
        instructions: 'For type 2 diabetes in children. Start with 500mg daily and titrate. Take with meals.',
      },
      // Lisinopril regimens
      {
        id: 'regimen-007',
        drugId: 'drug-004',
        ageMin: 18,
        ageMax: 65,
        weightMin: 50,
        ageGroup: 'adult',
        doseMg: '10-40mg',
        frequency: 'Once daily',
        duration: 'Long-term',
        maxDoseMgDay: '40mg',
        route: 'oral',
        instructions: 'Take at the same time daily. Monitor BP regularly. Report persistent dry cough.',
      },
      {
        id: 'regimen-008',
        drugId: 'drug-004',
        ageMin: 6,
        ageMax: 16,
        weightMin: 20,
        ageGroup: 'pediatric',
        doseMg: '0.07mg/kg',
        frequency: 'Once daily',
        duration: 'Long-term',
        maxDoseMgDay: '5mg',
        route: 'oral',
        instructions: 'For hypertension in children. Start with lowest dose and titrate. Monitor BP.',
      },
      // Ibuprofen regimens
      {
        id: 'regimen-009',
        drugId: 'drug-005',
        ageMin: 18,
        ageMax: 65,
        weightMin: 50,
        ageGroup: 'adult',
        doseMg: '400-600mg',
        frequency: 'Every 4-6 hours',
        duration: 'As needed',
        maxDoseMgDay: '3200mg',
        route: 'oral',
        instructions: 'Take with food or milk. Maximum 3200mg/day without medical supervision. Do not use long-term.',
      },
      {
        id: 'regimen-010',
        drugId: 'drug-005',
        ageMin: 12,
        ageMax: 18,
        weightMin: 30,
        ageGroup: 'pediatric',
        doseMg: '200-400mg',
        frequency: 'Every 4-6 hours',
        duration: 'As needed',
        maxDoseMgDay: '1200mg',
        route: 'oral',
        instructions: 'Dosage based on weight: 5-10mg/kg per dose. Take with food. Maximum 4 doses per day.',
      },
    ];

    for (const regimen of regimensData) {
      await prisma.doseRegimen.upsert({
        where: { id: regimen.id },
        update: regimen,
        create: regimen,
      });
    }
    console.log(`✓ ${regimensData.length} dose regimens seeded`);

    // Seed Print Templates
    console.log('');
    console.log('🖨️  Seeding print templates...');
    const templatesData = [
      {
        id: 'template-001',
        name: 'Standard Label',
        description: 'Standard dispensing label template',
        htmlTemplate: `<div style="width: 80mm; font-family: monospace; padding: 5mm;">
          <h3>DISPENSE LABEL</h3>
          <p><strong>Drug:</strong> {{drugName}}</p>
          <p><strong>Strength:</strong> {{strength}}</p>
          <p><strong>Dose:</strong> {{dose}}</p>
          <p><strong>Frequency:</strong> {{frequency}}</p>
          <p><strong>Duration:</strong> {{duration}}</p>
          <p><strong>Route:</strong> {{route}}</p>
          <hr />
          <p><strong>Instructions:</strong></p>
          <p>{{instructions}}</p>
          <hr />
          <p style="font-size: 0.8em;"><strong>Pharmacist:</strong> {{pharmacistName}}</p>
          <p style="font-size: 0.8em;"><strong>Date:</strong> {{date}} {{time}}</p>
        </div>`,
        escposTemplate: `|cF|
|bC|DISPENSE LABEL|N|
|N|
Drug: {{drugName}}
Strength: {{strength}}
Dose: {{dose}}
Frequency: {{frequency}}
Duration: {{duration}}
______________________
Pharm: {{pharmacistName}}
Date: {{date}}`,
        isDefault: true,
      },
      {
        id: 'template-002',
        name: 'Detailed Label',
        description: 'Detailed dispensing label with warnings',
        htmlTemplate: `<div style="width: 80mm; font-family: monospace; padding: 5mm; font-size: 10px;">
          <h3>MEDICATION DISPENSE</h3>
          <p><strong>Patient:</strong> {{patientName}} (Age: {{patientAge}}, Wt: {{patientWeight}}kg)</p>
          <hr />
          <p><strong>Drug:</strong> {{drugName}} {{strength}}</p>
          <p><strong>Dosage:</strong> {{dose}}</p>
          <p><strong>Frequency:</strong> {{frequency}}</p>
          <p><strong>Duration:</strong> {{duration}}</p>
          <p><strong>Route:</strong> {{route}}</p>
          <hr />
          <p><strong>Instructions:</strong></p>
          <p>{{instructions}}</p>
          <hr />
          <p style="color: red;"><strong>⚠ Warnings:</strong></p>
          <p>{{warnings}}</p>
          <hr />
          <p style="font-size: 8px;"><strong>Pharmacist:</strong> {{pharmacistName}}</p>
          <p style="font-size: 8px;"><strong>Date:</strong> {{date}} {{time}}</p>
        </div>`,
        isDefault: false,
      },
      {
        id: 'template-003',
        name: 'Minimal Label',
        description: 'Minimal label for quick printing',
        htmlTemplate: `<div style="width: 58mm; font-family: monospace; padding: 3mm; font-size: 9px;">
          <p><strong>{{drugName}}</strong></p>
          <p>{{dose}} - {{frequency}}</p>
          <p style="font-size: 7px;">{{date}}</p>
        </div>`,
        escposTemplate: `{{drugName}}
{{dose}} - {{frequency}}
{{date}}`,
        isDefault: false,
      },
    ];

    for (const template of templatesData) {
      await prisma.printTemplate.upsert({
        where: { id: template.id },
        update: template,
        create: template,
      });
    }
    console.log(`✓ ${templatesData.length} print templates seeded`);

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Database seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Default Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@sems.local');
    console.log('     Password: Admin@123');
    console.log('');
    console.log('   Pharmacist:');
    console.log('     Email: pharmacist@sems.local');
    console.log('     Password: Pharmacist@123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change these credentials in production!');
    console.log('═══════════════════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
