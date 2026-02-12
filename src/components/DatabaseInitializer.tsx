'use client';

import { useEffect } from 'react';
import { db } from '@/lib/db';
import { SAMPLE_DRUGS, SAMPLE_DOSE_REGIMENS } from '@/utils/sampleData';
import { templateService } from '@/services/template';

/**
 * Initialize database with sample STG data on client load
 */
export function DatabaseInitializer() {
  useEffect(() => {
    const seedDatabase = async () => {
      try {
        // Check if drugs already exist
        const existingDrugs = await db.drugs.toArray();

        if (existingDrugs.length === 0) {
          console.log('🌱 Seeding database with STG drugs...');

          // Add drugs
          await db.drugs.bulkAdd(SAMPLE_DRUGS);
          console.log('✓ Added ' + SAMPLE_DRUGS.length + ' drugs');

          // Add dose regimens
          await db.doseRegimens.bulkAdd(SAMPLE_DOSE_REGIMENS);
          console.log('✓ Added ' + SAMPLE_DOSE_REGIMENS.length + ' dose regimens');

          console.log('✓ Database seeded successfully!');
        } else {
          console.log('✓ Database already has ' + existingDrugs.length + ' drugs');
        }

        // Initialize default print templates
        await templateService.initializeDefaultTemplates();
        console.log('✓ Print templates initialized');
      } catch (error) {
        console.error('Failed to seed database:', error);
      }
    };

    seedDatabase();
  }, []);

  return null;
}
