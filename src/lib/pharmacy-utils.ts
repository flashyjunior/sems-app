/**
 * Pharmacy Utility Functions
 * Manages outlet/pharmacy configuration for multi-pharmacy support
 */

import prisma from '@/lib/prisma';
import { logError } from '@/lib/logger';

/**
 * Get the pharmacy ID for this outlet/installation
 * Each physical location has one pharmacy ID set in system settings
 */
export async function getOutletPharmacyId(): Promise<string> {
  try {
    const settings = await prisma.systemSettings.findFirst();

    if (!settings?.pharmacyId) {
      throw new Error(
        'Pharmacy ID not configured. Please set up the pharmacy outlet in system settings.'
      );
    }

    return settings.pharmacyId;
  } catch (error) {
    logError('Failed to get outlet pharmacy ID', error);
    throw error;
  }
}

/**
 * Get the full pharmacy details for this outlet
 */
export async function getOutletPharmacy() {
  try {
    const pharmacyId = await getOutletPharmacyId();

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
    });

    if (!pharmacy) {
      throw new Error(`Pharmacy with ID ${pharmacyId} not found`);
    }

    return pharmacy;
  } catch (error) {
    logError('Failed to get outlet pharmacy details', error);
    throw error;
  }
}

/**
 * Set the pharmacy ID for this outlet/installation
 * This should only be called during initial setup
 */
export async function setOutletPharmacyId(pharmacyId: string): Promise<void> {
  try {
    // Verify the pharmacy exists
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
    });

    if (!pharmacy) {
      throw new Error(`Pharmacy with ID ${pharmacyId} not found`);
    }

    // Update or create system settings with the pharmacy ID
    const existingSettings = await prisma.systemSettings.findFirst();

    if (existingSettings) {
      await prisma.systemSettings.update({
        where: { id: existingSettings.id },
        data: { pharmacyId },
      });
    } else {
      await prisma.systemSettings.create({
        data: {
          facilityName: pharmacy.name,
          pharmacyId,
          autoSyncEnabled: true,
          syncInterval: 300,
          dataRetention: 365,
          auditLogging: true,
        },
      });
    }
  } catch (error) {
    logError('Failed to set outlet pharmacy ID', error);
    throw error;
  }
}

/**
 * Get all pharmacies (for admin setup)
 */
export async function getAllPharmacies() {
  try {
    return await prisma.pharmacy.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    logError('Failed to get pharmacies', error);
    throw error;
  }
}
