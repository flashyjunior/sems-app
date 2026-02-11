/**
 * Analytics Test Data Seeding Script
 * Generates realistic dispensing events for testing analytics
 * 
 * Usage: npm run seed-analytics
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

// Test data generators
const PHARMACIES = ['PHA001', 'PHA002', 'PHA003'];
const DRUGS = [
  { id: 'drug-001', name: 'Paracetamol', code: 'PAR', fullName: 'Paracetamol (Acetaminophen) 500mg' },
  { id: 'drug-002', name: 'Amoxicillin', code: 'AMX', fullName: 'Amoxicillin 250mg Capsules' },
  { id: 'drug-003', name: 'Metformin', code: 'MET', fullName: 'Metformin HCl 500mg Tablets' },
  { id: 'drug-004', name: 'Lisinopril', code: 'LIS', fullName: 'Lisinopril 10mg Tablets' },
  { id: 'drug-005', name: 'Ibuprofen', code: 'IBU', fullName: 'Ibuprofen 200mg Tablets' },
  { id: 'drug-006', name: 'Azithromycin', code: 'AZI', fullName: 'Azithromycin 500mg Tablets' },
  { id: 'drug-007', name: 'Omeprazole', code: 'OME', fullName: 'Omeprazole 20mg Capsules' },
  { id: 'drug-008', name: 'Atorvastatin', code: 'ATO', fullName: 'Atorvastatin 20mg Tablets' },
];

const RISK_CATEGORIES = ['none', 'low', 'medium', 'high', 'critical'];
const PATIENT_AGE_GROUPS = ['paediatric', 'adult', 'geriatric'];
const OVERRIDE_REASONS = [
  'Invalid quantity',
  'Dose too high',
  'Patient allergy not recorded',
  'Drug interaction',
  'Pharmacist override',
  'Patient request',
];

interface DispensingEventData {
  dispenseRecordId: string;
  timestamp: Date;
  pharmacyId: string;
  userId: number;
  drugId: string;
  drugName: string;
  genericName: string;
  patientAgeGroup: string;
  isPrescription: boolean;
  riskCategory: string;
  riskScore: number;
  stgCompliant: boolean;
  overrideFlag: boolean;
  isControlledDrug: boolean;
  isAntibiotic: boolean;
  patientIsPregnant: boolean;
  riskFlags: string;
}

// Helper functions
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateDispensingEvent(date: Date): DispensingEventData {
  const drug = getRandomElement(DRUGS);
  const isHighRisk = Math.random() > 0.85; // 15% high-risk events
  const isDeviation = Math.random() > 0.9; // 10% non-compliant
  
  const riskCategory = isHighRisk
    ? getRandomElement(['high', 'critical'])
    : getRandomElement(['none', 'low', 'medium']);
  
  const riskScore: number = {
    'none': getRandomInt(0, 20),
    'low': getRandomInt(20, 40),
    'medium': getRandomInt(40, 60),
    'high': getRandomInt(60, 80),
    'critical': getRandomInt(80, 100),
  }[riskCategory] as number;

  const riskFlags = isHighRisk 
    ? JSON.stringify(['potential_interaction', 'high_quantity', 'age_risk'])
    : JSON.stringify([]);

  return {
    dispenseRecordId: randomUUID(),
    timestamp: date,
    pharmacyId: getRandomElement(PHARMACIES),
    userId: getRandomInt(1, 5), // Random user ID 1-5
    drugId: drug.id,
    drugName: drug.fullName,
    genericName: drug.name,
    patientAgeGroup: getRandomElement(PATIENT_AGE_GROUPS),
    isPrescription: Math.random() > 0.3, // 70% prescriptions
    riskCategory,
    riskScore,
    stgCompliant: !isDeviation,
    overrideFlag: isDeviation,
    isControlledDrug: Math.random() > 0.85, // 15% controlled
    isAntibiotic: drug.code === 'AMX', // Only Amoxicillin
    patientIsPregnant: Math.random() > 0.95, // 5% pregnant patients
    riskFlags,
  };
}

async function seedAnalyticsData() {
  console.log(' Starting Analytics Data Seeding...\n');

  try {
    // Generate events for the last 30 days
    const eventsToCreate: DispensingEventData[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Generate more events during business hours (7 AM - 7 PM)
    let currentDate = new Date(thirtyDaysAgo);
    while (currentDate < now) {
      // Skip weekends for more realistic data
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Generate 20-50 events per day
        const eventsPerDay = getRandomInt(20, 50);
        
        for (let i = 0; i < eventsPerDay; i++) {
          // Random hour between 7 AM and 7 PM
          const hour = getRandomInt(7, 19);
          const minute = getRandomInt(0, 59);
          
          const eventDate = new Date(currentDate);
          eventDate.setHours(hour, minute, 0, 0);
          
          eventsToCreate.push(generateDispensingEvent(eventDate));
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(` Generated ${eventsToCreate.length} dispensing events`);
    console.log(` Date range: ${thirtyDaysAgo.toLocaleDateString()} to ${now.toLocaleDateString()}`);

    // Create events in database
    console.log('\n Uploading to database...');
    
    let created = 0;
    for (let i = 0; i < eventsToCreate.length; i += 100) {
      const batch = eventsToCreate.slice(i, i + 100);
      
      for (const event of batch) {
        try {
          await prisma.dispensingEvent.create({
            data: {
              dispenseRecordId: event.dispenseRecordId,
              timestamp: event.timestamp,
              pharmacyId: event.pharmacyId,
              userId: event.userId,
              drugId: event.drugId,
              drugName: event.drugName,
              genericName: event.genericName,
              patientAgeGroup: event.patientAgeGroup,
              isPrescription: event.isPrescription,
              riskCategory: event.riskCategory,
              riskScore: event.riskScore,
              stgCompliant: event.stgCompliant,
              overrideFlag: event.overrideFlag,
              isControlledDrug: event.isControlledDrug,
              isAntibiotic: event.isAntibiotic,
              patientIsPregnant: event.patientIsPregnant,
              riskFlags: event.riskFlags,
            },
          });
          created++;
        } catch (err) {
          // Ignore duplicate or unique constraint errors
          if ((err as any).code !== 'P2002') {
            throw err;
          }
        }
      }

      console.log(`  [OK] Processed ${Math.min(i + 100, eventsToCreate.length)}/${eventsToCreate.length}`);
    }

    console.log(`\n[OK] Successfully created ${created} dispensing events\n`);

    // Summary stats
    const stats = await prisma.dispensingEvent.groupBy({
      by: ['riskCategory'],
      _count: true,
    });

    console.log('[chart] Data Summary:');
    stats.forEach((stat: any) => {
      console.log(`  - ${stat.riskCategory}: ${stat._count} events`);
    });

    const totalEvents = await prisma.dispensingEvent.count();
    const compliantCount = await prisma.dispensingEvent.count({
      where: { stgCompliant: true },
    });

    console.log(`\n  Total Events: ${totalEvents}`);
    console.log(`  Compliant: ${compliantCount} (${((compliantCount / totalEvents) * 100).toFixed(1)}%)`);
    console.log(`  Non-Compliant: ${totalEvents - compliantCount} (${(((totalEvents - compliantCount) / totalEvents) * 100).toFixed(1)}%)`);

    console.log('\n Seeding complete! Dashboard data is ready for testing.\n');

  } catch (error) {
    console.error(' Error during seeding:', error);
    process.exit(1);
  }
}

// Run seeding
seedAnalyticsData();
