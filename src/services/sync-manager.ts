import { LocalDatabase } from '@/lib/tauri-db';
import { WebDatabase } from '@/lib/web-db';
import { logInfo, logError } from '@/lib/logger';
import { writeLog } from '@/lib/file-logger';
import axios from 'axios';

interface SyncOptions {
  apiBaseUrl: string;
  authToken: string;
  onProgress?: (current: number, total: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Manages syncing of local dispense records to the server
 */
export class SyncManager {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private localDb: LocalDatabase | WebDatabase;
  private isWebMode: boolean;

  constructor() {
    // Determine if running in web browser or Tauri desktop
    this.isWebMode = typeof window !== 'undefined' && !(window as any).__TAURI__;
    
    if (this.isWebMode) {
      this.localDb = new WebDatabase();
    } else {
      this.localDb = new LocalDatabase();
    }
    
    this.localDb.init().catch(console.error);
  }

  /**
   * Manual sync of all unsynced records
   */
  async syncNow(options: SyncOptions): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) {
      logInfo('Sync already in progress');
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const records = await this.localDb.getUnsyncedRecords();
      
      if (records.length === 0) {
        logInfo('No records to sync');
        return { synced: 0, failed: 0 };
      }

      logInfo(`Starting sync of ${records.length} records`);
      await writeLog({
        timestamp: Date.now(),
        level: 'info',
        category: 'sync',
        message: `Starting sync of ${records.length} unsynced records`,
        data: { recordCount: records.length },
      });

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        try {
          const response = await axios.post(
            `${options.apiBaseUrl}/api/dispenses`,
            {
              externalId: record.external_id,
              patientName: record.patient_name,
              patientAge: record.patient_age,
              patientWeight: record.patient_weight,
              drugId: record.drug_id,
              drugName: record.drug_name,
              dose: JSON.parse(record.dose),
              safetyAcknowledgements: JSON.parse(record.safety_acknowledgements),
              deviceId: record.device_id,
              printedAt: record.printed_at,
              auditLog: record.audit_log ? JSON.parse(record.audit_log) : undefined,
            },
            {
              headers: {
                Authorization: `Bearer ${options.authToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          // Check if response is successful (2xx status or has success flag)
          const isSuccessful = response.status >= 200 && response.status < 300;
          const responseData = response.data as any;
          const hasSuccessFlag = responseData?.success === true;

          if (isSuccessful && hasSuccessFlag) {
            // Mark as synced in local database
            await this.localDb.markAsSynced([record.external_id]);
            synced++;
            
            // Log warning if it was queued (202 response)
            if (response.status === 202 && responseData?.warning) {
              logInfo(`Record synced with warning: ${responseData.warning}`, { recordId: record.external_id });
            } else {
              logInfo(`Record synced: ${record.external_id}`);
            }
          } else {
            failed++;
            logError('Unexpected response', new Error(`Status: ${response.status}, Success: ${hasSuccessFlag}`));
          }
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          const responseData = error instanceof axios.AxiosError ? error.response?.data : null;
          const errorData = error instanceof axios.AxiosError ? {
            status: error.response?.status,
            statusText: error.response?.statusText,
            responseData: responseData,
            apiErrorMessage: typeof responseData === 'object' && responseData !== null ? (responseData as any).message || (responseData as any).error : null,
            recordId: record.external_id,
            recordName: record.patient_name,
          } : {
            recordId: record.external_id,
            recordName: record.patient_name,
          };
          
          logError(`Failed to sync record ${record.external_id}`, error);
          await writeLog({
            timestamp: Date.now(),
            level: 'error',
            category: 'sync',
            message: `Sync failed for record: ${record.external_id} (${record.patient_name}) - ${errorMessage}`,
            data: errorData,
            stackTrace: error instanceof Error ? error.stack : undefined,
          });
        }

        // Call progress callback
        if (options.onProgress) {
          options.onProgress(i + 1, records.length);
        }
      }

      logInfo(`Sync completed: ${synced} synced, ${failed} failed`);
      await writeLog({
        timestamp: Date.now(),
        level: failed > 0 ? 'warn' : 'info',
        category: 'sync',
        message: `Sync completed: ${synced} synced, ${failed} failed`,
        data: { synced, failed, total: records.length },
      });
      return { synced, failed };
    } catch (error) {
      this.isSyncing = false;
      logError('Sync error', error);
      await writeLog({
        timestamp: Date.now(),
        level: 'error',
        category: 'sync',
        message: 'Sync operation failed',
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
        stackTrace: error instanceof Error ? error.stack : undefined,
      });
      if (options.onError) {
        options.onError(error as Error);
      }
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Start automatic sync at regular intervals
   */
  startAutoSync(options: SyncOptions, intervalMs: number = 300000): void {
    // Clear existing interval if any
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Initial sync
    this.syncNow(options).catch(error => {
      logError('Auto sync failed on startup', error);
    });

    // Set up interval
    this.syncInterval = setInterval(() => {
      if (!this.isSyncing) {
        this.syncNow(options).catch(error => {
          logError('Auto sync error', error);
        });
      }
    }, intervalMs);

    logInfo(`Auto sync started with interval ${intervalMs}ms`);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logInfo('Auto sync stopped');
    }
  }

  /**
   * Check sync status
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<any> {
    try {
      return await this.localDb.getSyncStats();
    } catch (error) {
      logError('Error getting sync stats', error);
      throw error;
    }
  }
}

export const syncManager = new SyncManager();
