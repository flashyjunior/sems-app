/**
 * Web-based local database using IndexedDB via Dexie.js
 * Used for the browser-based web version and sync functionality
 */

import { db } from './db';
import type { DispenseRecord, SyncQueueItem } from '@/types';

export class WebDatabase {
  async init(): Promise<void> {
    // Dexie.js initializes automatically
    // Just ensure the database is accessible
    try {
      await db.isOpen();
    } catch (error) {
      console.error('Failed to initialize web database:', error);
    }
  }

  /**
   * Save a dispense record locally to IndexedDB
   */
  async saveDispense(record: any): Promise<string> {
    try {
      // Generate ID if not present
      const id = record.id || `dispense-${Date.now()}-${Math.random()}`;
      
      const dispenseRecord: DispenseRecord = {
        id,
        pharmacistId: record.pharmacistId || 'unknown',
        patientName: record.patientName,
        patientPhoneNumber: record.patientPhoneNumber,
        patientAge: record.patientAge,
        patientWeight: record.patientWeight,
        drugId: record.drugId,
        drugName: record.drugName,
        dose: record.dose,
        safetyAcknowledgements: record.safetyAcknowledgements || [],
        printedAt: record.printedAt || Date.now(),
        deviceId: record.deviceId || 'web',
        timestamp: Date.now(),
        synced: false,
        auditLog: [],
      };

      // Save to dispenseRecords table
      await db.dispenseRecords.add(dispenseRecord);

      // Add to sync queue
      const syncItem: SyncQueueItem = {
        id: `sync-${id}`,
        record: dispenseRecord,
        retries: 0,
      };
      await db.syncQueue.add(syncItem);

      return id;
    } catch (error) {
      console.error('Error saving dispense record to IndexedDB', error);
      throw error;
    }
  }

  /**
   * Get all unsynced dispense records
   */
  async getUnsyncedRecords(): Promise<any[]> {
    try {
      // Get records where synced = false using .filter() instead of .where()
      const records = await db.dispenseRecords
        .filter((record) => !record.synced)
        .toArray();

      return records.map((record) => ({
        id: record.id,
        external_id: record.id,
        patient_name: record.patientName,
        patient_phone_number: record.patientPhoneNumber,
        patient_age: record.patientAge,
        patient_weight: record.patientWeight,
        drug_id: record.drugId,
        drug_name: record.drugName,
        dose: JSON.stringify(record.dose),
        safety_acknowledgements: JSON.stringify(record.safetyAcknowledgements),
        printed_at: record.printedAt,
        device_id: record.deviceId,
        pharmacist_id: record.pharmacistId,
        created_at: record.timestamp,
        isActive: record.isActive !== undefined ? record.isActive : true,
      }));
    } catch (error) {
      console.error('Error fetching unsynced records from IndexedDB', error);
      throw error;
    }
  }

  /**
   * Get dispense record by ID
   */
  async getDispense(id: string): Promise<any> {
    try {
      const record = await db.dispenseRecords.get(id);
      if (!record) throw new Error(`Record ${id} not found`);
      return record;
    } catch (error) {
      console.error('Error fetching dispense record from IndexedDB', error);
      throw error;
    }
  }

  /**
   * Get all dispense records with pagination
   */
  async listDispenses(page: number = 1, limit: number = 20): Promise<any> {
    try {
      const offset = (page - 1) * limit;
      const records = await db.dispenseRecords
        .orderBy('timestamp')
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();

      const total = await db.dispenseRecords.count();

      return {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error listing dispense records from IndexedDB', error);
      throw error;
    }
  }

  /**
   * Mark records as synced
   */
  async markAsSynced(externalIds: string[]): Promise<void> {
    try {
      // Update all matching records to synced = true
      const now = Date.now();
      await db.dispenseRecords.bulkUpdate(
        externalIds.map((externalId) => ({
          key: externalId,
          changes: { synced: true, syncedAt: now },
        }))
      );

      // Remove from sync queue
      await db.syncQueue.where('record.id').anyOf(externalIds).delete();
    } catch (error) {
      console.error('Error marking records as synced in IndexedDB', error);
      throw error;
    }
  }

  /**
   * Delete dispense record (soft delete not applicable, just remove)
   */
  async deleteDispense(id: string): Promise<void> {
    try {
      await db.dispenseRecords.delete(id);
      await db.syncQueue.where('record.id').equals(id).delete();
    } catch (error) {
      console.error('Error deleting dispense record from IndexedDB', error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<any> {
    try {
      const total = await db.dispenseRecords.count();
      const synced = await db.dispenseRecords
        .filter((record) => record.synced)
        .count();
      const unsynced = total - synced;
      const queueLength = await db.syncQueue.count();

      return {
        total,
        synced,
        unsynced,
        queueLength,
        syncPercentage: total > 0 ? Math.round((synced / total) * 100) : 0,
      };
    } catch (error) {
      console.error('Error getting sync stats from IndexedDB', error);
      throw error;
    }
  }
}

export const webDb = new WebDatabase();

