/**
 * Local SQLite database for offline storage
 */
export class LocalDatabase {
  private db: any = null;
  private invoke: any = null;

  async init(): Promise<void> {
    // Database is auto-initialized by Tauri on app startup
    // via migrations in main.rs
    // Load Tauri API only when running in Tauri environment
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        // @ts-ignore - Tauri API not available in dev mode
        // const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
        // this.invoke = tauriInvoke;
      } catch (e) {
        console.warn('Tauri API not available, running in web mode');
      }
    }
  }

  /**
   * Save a dispense record locally
   */
  async saveDispense(record: any): Promise<number> {
    try {
      if (!this.invoke) throw new Error('Tauri API not initialized');
      const now = Date.now();
      const result = await this.invoke('save_dispense', {
        externalId: record.externalId,
        patientName: record.patientName,
        patientAge: record.patientAge,
        patientWeight: record.patientWeight,
        drugId: record.drugId,
        drugName: record.drugName,
        dose: JSON.stringify(record.dose),
        safetyAcknowledgements: JSON.stringify(record.safetyAcknowledgements),
        printedAt: record.printedAt,
        deviceId: record.deviceId,
        auditLog: record.auditLog ? JSON.stringify(record.auditLog) : null,
        createdAt: now,
        updatedAt: now,
      });
      return result as number;
    } catch (error) {
      console.error('Error saving dispense record locally', error);
      throw error;
    }
  }

  /**
   * Get all unsynced dispense records
   */
  async getUnsyncedRecords(): Promise<any[]> {
    try {
      if (!this.invoke) throw new Error('Tauri API not initialized');
      const records = await this.invoke('get_unsynced_dispenses');
      return records as any[];
    } catch (error) {
      console.error('Error fetching unsynced records', error);
      throw error;
    }
  }

  /**
   * Get dispense record by ID
   */
  async getDispense(id: number): Promise<any> {
    try {
      if (!this.invoke) throw new Error('Tauri API not initialized');
      const record = await this.invoke('get_dispense', { id });
      return record;
    } catch (error) {
      console.error('Error fetching dispense record', error);
      throw error;
    }
  }

  /**
   * Get all dispense records with pagination
   */
  async listDispenses(page: number = 1, limit: number = 20): Promise<any> {
    try {
      if (!this.invoke) throw new Error('Tauri API not initialized');
      const result = await this.invoke('list_dispenses', { page, limit });
      return result;
    } catch (error) {
      console.error('Error listing dispense records', error);
      throw error;
    }
  }

  /**
   * Mark records as synced
   */
  async markAsSynced(externalIds: string[]): Promise<void> {
    try {
      if (!this.invoke) throw new Error('Tauri API not initialized');
      await this.invoke('mark_as_synced', { externalIds });
    } catch (error) {
      console.error('Error marking records as synced', error);
      throw error;
    }
  }

  /**
   * Delete dispense record (soft delete)
   */
  async deleteDispense(id: number): Promise<void> {
    try {
      if (!this.invoke) throw new Error('Tauri API not initialized');
      await this.invoke('delete_dispense', { id });
    } catch (error) {
      console.error('Error deleting dispense record', error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<any> {
    try {
      if (!this.invoke) throw new Error('Tauri API not initialized');
      const stats = await this.invoke('get_sync_stats');
      return stats;
    } catch (error) {
      console.error('Error getting sync stats', error);
      throw error;
    }
  }
}

export const localDb = new LocalDatabase();
