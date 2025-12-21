import { db, loadStaticDatasets } from '@/lib/db';
import { searchService } from '@/services/search';
import { SAMPLE_DRUGS, SAMPLE_DOSE_REGIMENS } from '@/utils/sampleData';

/**
 * Initialize SEMS database with sample data on first run
 * In production, this would sync from the backend
 */
export async function initializeDatabase() {
  try {
    // Check if data is already loaded
    const existingDrugs = await db.drugs.toArray();
    if (existingDrugs.length > 0) {
      console.log('Database already initialized');
      return;
    }

    console.log('Initializing SEMS database...');

    // Load static data
    await loadStaticDatasets(SAMPLE_DRUGS, SAMPLE_DOSE_REGIMENS);

    // Initialize search service
    await searchService.initialize();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Simulate pulling updates from backend
 * In production, this would call the actual sync API
 */
export async function syncDatasetUpdates() {
  try {
    console.log('Checking for dataset updates...');
    // TODO: Implement actual backend sync
    // const updates = await fetch('/api/datasets/updates');
    // const data = await updates.json();
    // await loadStaticDatasets(data.drugs, data.regimens);
  } catch (error) {
    console.error('Failed to sync updates:', error);
  }
}
