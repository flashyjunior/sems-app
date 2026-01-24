import { db, markRecordSynced } from '@/lib/db';
import type { DispenseRecord, SyncStatus, PrintTemplate } from '@/types';

const SYNC_ENDPOINT = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export class SyncService {
  private isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  private syncInProgress = false;
  private syncStatusListeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  private handleOnline() {
    this.isOnline = true;
    console.log('Network online - starting sync');
    this.syncAll();
    this.pullTemplatesFromServer();
  }

  private handleOffline() {
    this.isOnline = false;
    console.log('Network offline - queuing records');
    this.notifyStatusChange();
  }

  async getSyncStatus(): Promise<SyncStatus> {
    // Check both syncQueue and unsynced dispenseRecords
    let syncQueueItems = await db.syncQueue.toArray();
    const allDispenseRecords = await db.dispenseRecords.toArray();
    const unsyncedRecords = allDispenseRecords.filter(record => !record.synced);
    
    // Clean up orphaned queue items (records that no longer exist or are synced)
    const orphanedQueueIds: string[] = [];
    for (const queueItem of syncQueueItems) {
      const recordId = queueItem.id?.replace('sync-', '');
      const record = allDispenseRecords.find(r => r.id === recordId);
      if (!record || record.synced) {
        orphanedQueueIds.push(queueItem.id);
      }
    }
    
    // Delete orphaned items
    if (orphanedQueueIds.length > 0) {
      console.log('[getSyncStatus] Cleaning up orphaned queue items:', orphanedQueueIds);
      for (const id of orphanedQueueIds) {
        try {
          await db.syncQueue.delete(id);
        } catch (e) {
          console.warn('[getSyncStatus] Failed to delete queue item:', id, e);
        }
      }
      // Refresh queue items after cleanup
      syncQueueItems = await db.syncQueue.toArray();
    }
    
    // Use the actual unsynced count, not queue count
    const pendingCount = unsyncedRecords.length;
    const errors = syncQueueItems.filter((p) => p.error);

    if (pendingCount > 0 || allDispenseRecords.length > 0) {
      console.log('Sync Status Debug:', {
        totalDispenseRecords: allDispenseRecords.length,
        syncedCount: allDispenseRecords.filter(r => r.synced).length,
        unsyncedCount: unsyncedRecords.length,
        syncQueueItems: syncQueueItems.length,
        orphanedQueueItemsDeleted: orphanedQueueIds.length,
        pendingCount,
        unsyncedRecordsDetails: unsyncedRecords.map(r => ({ id: r.id, synced: r.synced, patientName: r.patientName })),
      });
    }

    return {
      isOnline: this.isOnline,
      isSyncing: this.syncInProgress,
      lastSyncAt: await this.getLastSyncTime(),
      pendingCount,
      errorCount: errors.length,
    };
  }

  async syncAll() {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    this.notifyStatusChange();

    try {
      // Sync dispense records
      const pending = await db.syncQueue.toArray();

      for (const item of pending) {
        try {
          await this.syncRecord(item.record);
          await markRecordSynced(item.record.id);
        } catch (error) {
          item.retries++;
          item.lastAttempt = Date.now();
          item.error = String(error);

          if (item.retries >= 3) {
            console.error(`Sync failed for record ${item.record.id}:`, error);
          } else {
            await db.syncQueue.update(item.id, {
              retries: item.retries,
              lastAttempt: item.lastAttempt,
              error: item.error,
            });
          }
        }
      }

      // Sync templates
      await this.syncTemplates();

      await this.setSyncTime(Date.now());
    } finally {
      this.syncInProgress = false;
      this.notifyStatusChange();
    }
  }

  private async syncRecord(record: DispenseRecord): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Not online');
    }

    const response = await fetch(`${SYNC_ENDPOINT}/dispenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  private async syncTemplates(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const templates = await db.printTemplates.toArray();
      
      if (templates.length === 0) return;

      // Mark which templates need syncing (those modified after last sync)
      const lastSync = await this.getLastSyncTime();
      const templatesToSync = lastSync 
        ? templates.filter((t) => t.updatedAt > lastSync)
        : templates;

      for (const template of templatesToSync) {
        try {
          await this.syncTemplate(template);
        } catch (error) {
          console.warn(`Failed to sync template ${template.id}:`, error);
          // Don't fail entire sync if one template fails
        }
      }
    } catch (error) {
      console.warn('Template sync failed:', error);
    }
  }

  private async syncTemplate(template: PrintTemplate): Promise<void> {
const response = await fetch(`${SYNC_ENDPOINT}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({
        ...template,
        syncedAt: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Template sync failed: ${response.statusText}`);
    }
  }

  /**
   * Fetch updated templates from server and merge with local
   */
  async pullTemplatesFromServer(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const response = await fetch(`${SYNC_ENDPOINT}/templates`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch templates');

      const remoteTemplates: PrintTemplate[] = await response.json();
      const localTemplates = await db.printTemplates.toArray();
      const localMap = new Map(localTemplates.map((t) => [t.id, t]));

      // Merge: remote templates override local if newer
      for (const remote of remoteTemplates) {
        const local = localMap.get(remote.id);
        if (!local || remote.updatedAt > local.updatedAt) {
          await db.printTemplates.put(remote);
        }
      }

      console.log('Templates synced from server');
    } catch (error) {
      console.warn('Failed to pull templates from server:', error);
    }
  }

  private getAuthToken(): string {
    if (typeof localStorage !== 'undefined') {
      const session = localStorage.getItem('sems_auth_session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          return parsed.token || '';
        } catch {
          return '';
        }
      }
    }
    return '';
  }

  private async getLastSyncTime(): Promise<number | undefined> {
    const meta = await db.syncMetadata.get('lastSyncAt');
    return meta?.value as number | undefined;
  }

  private async setSyncTime(time: number) {
    await db.syncMetadata.put({
      key: 'lastSyncAt',
      value: time,
    });
  }

  onStatusChange(callback: (status: SyncStatus) => void) {
    this.syncStatusListeners.push(callback);
    return () => {
      this.syncStatusListeners = this.syncStatusListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  private notifyStatusChange() {
    this.getSyncStatus().then((status) => {
      this.syncStatusListeners.forEach((cb) => cb(status));
    });
  }

  // Public method to refresh sync status (called when records are added/modified)
  public refreshStatus() {
    this.notifyStatusChange();
  }
}

export const syncService = new SyncService();
