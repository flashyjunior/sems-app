import { db } from '@/lib/db';
import type { UserProfile, PrinterSettings, SystemSettings } from '@/types';

export class SettingsService {
  // User Profile Methods
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const result = await db.userProfiles.where('userId').equals(userId).first();
    return result ?? null;
  }

  async createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const newProfile: UserProfile = {
      ...profile,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.userProfiles.add(newProfile);
    return newProfile;
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt'>>
  ): Promise<UserProfile> {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const updated: UserProfile = {
      ...profile,
      ...updates,
      updatedAt: Date.now(),
    };

    await db.userProfiles.update(profile.id, updated);
    return updated;
  }

  // Printer Settings Methods
  async getPrinterSettings(printerId?: string): Promise<PrinterSettings | null> {
    if (printerId) {
      const result = await db.printerSettings.get(printerId);
      return result ?? null;
    }

    // Get default printer
    const result = await db.printerSettings
      .filter((s) => s.isDefault === true)
      .first();
    return result ?? null;
  }

  async getAllPrinterSettings(): Promise<PrinterSettings[]> {
    return await db.printerSettings.toArray();
  }

  async createPrinterSettings(settings: Omit<PrinterSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<PrinterSettings> {
    // If this is default, clear others
    if (settings.isDefault) {
      const current = await db.printerSettings
        .filter((s) => s.isDefault === true)
        .first();
      if (current) {
        await db.printerSettings.update(current.id, { isDefault: false });
      }
    }

    const newSettings: PrinterSettings = {
      ...settings,
      id: `printer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.printerSettings.add(newSettings);
    return newSettings;
  }

  async updatePrinterSettings(
    printerId: string,
    updates: Partial<Omit<PrinterSettings, 'id' | 'createdAt'>>
  ): Promise<PrinterSettings> {
    const printer = await db.printerSettings.get(printerId);
    if (!printer) {
      throw new Error('Printer settings not found');
    }

    // If setting as default, clear others
    if (updates.isDefault) {
      const current = await db.printerSettings
        .filter((s) => s.isDefault === true)
        .first();
      if (current && current.id !== printerId) {
        await db.printerSettings.update(current.id, { isDefault: false });
      }
    }

    const updated: PrinterSettings = {
      ...printer,
      ...updates,
      updatedAt: Date.now(),
    };

    await db.printerSettings.update(printerId, updated);
    return updated;
  }

  async deletePrinterSettings(printerId: string): Promise<void> {
    await db.printerSettings.delete(printerId);
  }

  async setDefaultPrinter(printerId: string): Promise<void> {
    const printer = await db.printerSettings.get(printerId);
    if (!printer) {
      throw new Error('Printer not found');
    }

    // Clear current default
    const current = await db.printerSettings
      .filter((s) => s.isDefault === true)
      .first();
    if (current && current.id !== printerId) {
      await db.printerSettings.update(current.id, { isDefault: false });
    }

    // Set new default
    await db.printerSettings.update(printerId, { isDefault: true });
  }

  // System Settings Methods
  async getSystemSettings(): Promise<SystemSettings | null> {
    const result = await db.systemSettings.get('system-settings');
    return result ?? null;
  }

  async createSystemSettings(settings: Omit<SystemSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<SystemSettings> {
    const newSettings: SystemSettings = {
      ...settings,
      id: 'system-settings',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.systemSettings.add(newSettings);
    return newSettings;
  }

  async updateSystemSettings(
    updates: Partial<Omit<SystemSettings, 'id' | 'createdAt'>>
  ): Promise<SystemSettings> {
    const settings = await this.getSystemSettings();
    if (!settings) {
      throw new Error('System settings not found');
    }

    const updated: SystemSettings = {
      ...settings,
      ...updates,
      updatedAt: Date.now(),
    };

    await db.systemSettings.update('system-settings', updated);
    return updated;
  }

  // Initialize default settings
  async initializeDefaultSettings(userId: string): Promise<void> {
    // Initialize user profile if not exists
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      await this.createUserProfile({
        id: `profile-${userId}`,
        userId,
        fullName: 'Pharmacist',
        email: 'pharmacist@hospital.local',
        licenseNumber: 'LIC-0001',
        theme: 'auto',
        language: 'en',
        defaultDoseUnit: 'mg',
        autoLock: true,
        autoLockMinutes: 15,
      });
    }

    // Initialize printer settings if not exists
    const printers = await this.getAllPrinterSettings();
    if (printers.length === 0) {
      await this.createPrinterSettings({
        name: 'Browser Printer',
        type: 'browser',
        autoReprint: false,
        repruntOnError: false,
        copies: 1,
        margins: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        },
        isDefault: true,
        enabled: true,
      });
    }

    // Initialize system settings if not exists
    const systemSettings = await this.getSystemSettings();
    if (!systemSettings) {
      await this.createSystemSettings({
        facilityName: 'Healthcare Facility',
        address: '',
        phone: '',
        email: '',
        autoSyncEnabled: true,
        autoSyncInterval: 5,
        offlineMode: true,
        dataRetention: 90,
        auditLogging: true,
      });
    }
  }
}

export const settingsService = new SettingsService();
