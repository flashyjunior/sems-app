'use client';

import { db } from './db';
import { useAppStore } from '@/store/app';

/**
 * Local SQLite database for offline storage
 * Falls back to IndexedDB when Tauri is not available
 */
export class LocalDatabase {
  private db: any = null;
  private invoke: any = null;
  private isInTauri: boolean = false;

  async init(): Promise<void> {
    // Load Tauri API only when running in Tauri environment
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tauriModule = await import('@tauri-apps/api/core');
        this.invoke = tauriModule.invoke;
        this.isInTauri = true;
      } catch (e) {
        console.warn('Tauri API not available, falling back to IndexedDB');
        this.isInTauri = false;
      }
    }
  }

  /**
   * Save a dispense record locally
   */
  async saveDispense(record: any): Promise<number> {
    try {
      if (this.isInTauri && this.invoke) {
        const now = Date.now();
        const result = await this.invoke('save_dispense', {
          externalId: record.externalId,
          patientName: record.patientName,
          patientPhoneNumber: record.patientPhoneNumber,
          patientAge: record.patientAge,
          patientWeight: record.patientWeight,
          drugId: record.drugId,
          drugName: record.drugName,
          dose: JSON.stringify(record.dose),
          safetyAcknowledgements: JSON.stringify(record.safetyAcknowledgements),
          printedAt: record.printedAt,
          deviceId: record.deviceId,
          pharmacyId: record.pharmacyId || useAppStore.getState().user?.pharmacyId,
          auditLog: record.auditLog ? JSON.stringify(record.auditLog) : null,
          createdAt: now,
          updatedAt: now,
        });
        return result as number;
      } else {
        // Use IndexedDB fallback
        const record_obj = await db.dispenseRecords.add({
          ...record,
          pharmacyId: record.pharmacyId || useAppStore.getState().user?.pharmacyId,
          synced: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        return record_obj as number;
      }
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
      if (this.isInTauri && this.invoke) {
        const records = await this.invoke('get_unsynced_dispenses');
        return records as any[];
      } else {
        // Use IndexedDB fallback
        return await db.dispenseRecords.filter((r: any) => !r.synced).toArray();
      }
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
      if (this.isInTauri && this.invoke) {
        const record = await this.invoke('get_dispense', { id });
        return record;
      } else {
        // Use IndexedDB fallback
        return await db.dispenseRecords.get(id);
      }
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
      if (this.isInTauri && this.invoke) {
        const result = await this.invoke('list_dispenses', { page, limit });
        return result;
      } else {
        // Use IndexedDB fallback
        const offset = (page - 1) * limit;
        const records = await db.dispenseRecords
          .offset(offset)
          .limit(limit)
          .toArray();
        return { records, page, limit, total: await db.dispenseRecords.count() };
      }
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
      if (this.isInTauri && this.invoke) {
        try {
          await this.invoke('mark_as_synced', { externalIds });
        } catch (tauriError) {
          // Tauri command failed or not implemented, fall back to IndexedDB
          console.warn('Tauri mark_as_synced failed, falling back to IndexedDB', tauriError);
          // externalIds are actually the record IDs in IndexedDB
          const now = Date.now();
          await db.dispenseRecords.bulkUpdate(
            externalIds.map((recordId) => ({
              key: recordId,
              changes: { synced: true, syncedAt: now },
            }))
          );
        }
      } else {
        // Use IndexedDB fallback - externalIds are the record IDs
        const now = Date.now();
        await db.dispenseRecords.bulkUpdate(
          externalIds.map((recordId) => ({
            key: recordId,
            changes: { synced: true, syncedAt: now },
          }))
        );
      }
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
      if (this.isInTauri && this.invoke) {
        await this.invoke('delete_dispense', { id });
      } else {
        // Use IndexedDB fallback
        await db.dispenseRecords.delete(id);
      }
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
      if (this.isInTauri && this.invoke) {
        const stats = await this.invoke('get_sync_stats');
        return stats;
      } else {
        // Use IndexedDB fallback
        const total = await db.dispenseRecords.count();
        const synced = await db.dispenseRecords
          .filter((r: any) => r.synced === true)
          .count();
        return { total, synced, unsynced: total - synced };
      }
    } catch (error) {
      console.error('Error getting sync stats', error);
      throw error;
    }
  }
}

export const localDb = new LocalDatabase();
