import { LocalDatabase } from '@/lib/tauri-db';
import { WebDatabase } from '@/lib/web-db';
import { logInfo, logError } from '@/lib/logger';
import { writeLog } from '@/lib/file-logger';
import { db } from '@/lib/db';
import { useAppStore } from '@/store/app';
import axios from 'axios';
import type { AxiosError } from 'axios';

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
        let syncPayload: any = null;
        
        try {
          const recordLogPrefix = `[Record ${i + 1}/${records.length}]`;
          
          // Log record details
          await writeLog({
            timestamp: Date.now(),
            level: 'info',
            category: 'sync',
            message: `${recordLogPrefix} Processing record`,
            data: { id: record.id, externalId: record.externalId, patientName: record.patientName },
          });
          
          // Map record fields - handle both camelCase and snake_case
          const stateUser = useAppStore.getState().user;
          syncPayload = {
            externalId: record.externalId || record.external_id || record.id,
            patientName: record.patientName || record.patient_name,
            patientPhoneNumber: record.patientPhoneNumber || record.patient_phone_number,
            patientAge: record.patientAge !== null && record.patientAge !== undefined ? record.patientAge : (record.patient_age || 0),
            patientWeight: record.patientWeight !== null && record.patientWeight !== undefined ? record.patientWeight : (record.patient_weight || 0),
            drugId: record.drugId || record.drug_id,
            drugName: record.drugName || record.drug_name,
            dose: typeof record.dose === 'string' ? JSON.parse(record.dose) : record.dose,
            safetyAcknowledgements: typeof record.safetyAcknowledgements === 'string' 
              ? JSON.parse(record.safetyAcknowledgements) 
              : record.safetyAcknowledgements || [],
            deviceId: record.deviceId || record.device_id,
            printedAt: record.printedAt || record.printed_at,
            isActive: record.isActive !== undefined ? record.isActive : (record.isactive !== undefined ? record.isactive : true),
            auditLog: record.auditLog 
              ? (typeof record.auditLog === 'string' ? JSON.parse(record.auditLog) : record.auditLog)
              : undefined,
            // Attach pharmacyId from the record only. Do NOT trust logged-in user's pharmacyId for sync.
            // Security: using the record's pharmacyId prevents privilege escalation by changing the user's assigned pharmacy.
            pharmacyId: record.pharmacyId || record.pharmacy_id || undefined,
          };
          
          // Check if this is an update (was previously synced, now needs sync again)
          // Only send PUT if it has a syncedAt timestamp (meaning it was successfully synced before)
          // For canceled records on first sync, send POST first - the "already exists" response
          // will trigger the PUT with the correct cloud record ID
          const isUpdate = !!record.syncedAt;
          const updatePayload = isUpdate ? {
            id: record.id,
            isActive: record.isActive !== undefined ? record.isActive : record.isactive,
          } : null;
          
          // Log payload
          await writeLog({
            timestamp: Date.now(),
            level: 'info',
            category: 'sync',
            message: `${recordLogPrefix} Payload constructed - ${isUpdate ? 'UPDATE' : 'CREATE'}`,
            data: { payload: syncPayload, updatePayload, apiBaseUrl: options.apiBaseUrl },
          });
          
          const apiUrl = `${options.apiBaseUrl}/api/dispenses`;
          const requestMethod = isUpdate ? 'PUT' : 'POST';
          const requestPayload = isUpdate ? updatePayload : syncPayload;
          
          // Log request details
          await writeLog({
            timestamp: Date.now(),
            level: 'info',
            category: 'sync',
            message: `${recordLogPrefix} Sending ${requestMethod} to API`,
            data: {
              url: apiUrl,
              method: requestMethod,
              hasAuthToken: !!options.authToken,
              authTokenPreview: options.authToken ? options.authToken.substring(0, 20) + '...' : 'MISSING',
            },
          });

          let response = await (requestMethod === 'PUT' 
            ? axios.put(apiUrl, requestPayload, {
                headers: {
                  Authorization: `Bearer ${options.authToken}`,
                  'Content-Type': 'application/json',
                },
              })
            : axios.post(apiUrl, requestPayload, {
                headers: {
                  Authorization: `Bearer ${options.authToken}`,
                  'Content-Type': 'application/json',
                },
              })
          );
          
          // Log successful response
          let responseData = response.data as any;
          
          await writeLog({
            timestamp: Date.now(),
            level: 'info',
            category: 'sync',
            message: `${recordLogPrefix} API response received`,
            data: { 
              status: response.status, 
              statusText: response.statusText,
              message: responseData?.message,
              successFlag: response.data?.success,
            },
          });

          // Debug: Log the condition check details
          await writeLog({
            timestamp: Date.now(),
            level: 'info',
            category: 'sync',
            message: `${recordLogPrefix} Checking for "already exists" condition`,
            data: {
              requestMethodCheck: requestMethod === 'POST',
              statusCheck: response.status === 200,
              messageCheck: responseData?.message?.includes('already exists'),
              actualRequestMethod: requestMethod,
              actualStatus: response.status,
              actualMessage: responseData?.message,
            },
          });

          // Check if this is a POST that returned "record already exists" (status 200)
          // Compare local isActive with cloud record's isActive
          if (requestMethod === 'POST' && response.status === 200 && responseData?.message?.includes('already exists')) {
            const cloudRecord = responseData?.record;
            const cloudIsActive = cloudRecord?.isActive;
            const localIsActive = record.isActive !== undefined ? record.isActive : true; // Default to true if not set
            
            await writeLog({
              timestamp: Date.now(),
              level: 'info',
              category: 'sync',
              message: `${recordLogPrefix} DEBUG FULL: Record already exists response`,
              data: { 
                hasCloudRecord: !!cloudRecord,
                cloudRecordKeys: cloudRecord ? Object.keys(cloudRecord) : [],
                cloudId: cloudRecord?.id,
                cloudIdType: typeof cloudRecord?.id,
                externalId: syncPayload.externalId,
                cloudIsActive,
                localIsActive,
                willTriggerPut: cloudIsActive !== localIsActive,
              },
            });
            
            await writeLog({
              timestamp: Date.now(),
              level: 'info',
              category: 'sync',
              message: `${recordLogPrefix} ENTERED: Record already exists - comparing isActive status`,
              data: { 
                externalId: syncPayload.externalId,
                cloudIsActive,
                localIsActive,
                cloudRecordId: cloudRecord?.id,
              },
            });

            // If statuses differ, send a PUT to update
            if (cloudIsActive !== localIsActive) {
              await writeLog({
                timestamp: Date.now(),
                level: 'info',
                category: 'sync',
                message: `${recordLogPrefix} CONDITION MET: isActive differs - sending PUT (cloud: ${cloudIsActive}, local: ${localIsActive})`,
                data: { externalId: syncPayload.externalId, cloudRecordId: cloudRecord?.id },
              });

              await writeLog({
                timestamp: Date.now(),
                level: 'info',
                category: 'sync',
                message: `${recordLogPrefix} DEBUG: Cloud record structure`,
                data: { 
                  cloudRecord,
                  cloudRecordId: cloudRecord?.id,
                  typeOfId: typeof cloudRecord?.id,
                },
              });

              const updatePayloadForExisting = {
                id: cloudRecord?.id || record.id,
                isActive: localIsActive,
              };

              await writeLog({
                timestamp: Date.now(),
                level: 'info',
                category: 'sync',
                message: `${recordLogPrefix} Sending PUT request with payload`,
                data: { payload: updatePayloadForExisting },
              });

              response = await axios.put(apiUrl, updatePayloadForExisting, {
                headers: {
                  Authorization: `Bearer ${options.authToken}`,
                  'Content-Type': 'application/json',
                },
              });

              responseData = response.data as any;

              await writeLog({
                timestamp: Date.now(),
                level: 'info',
                category: 'sync',
                message: `${recordLogPrefix} PUT response received`,
                data: { 
                  status: response.status, 
                  statusText: response.statusText, 
                  message: responseData?.message,
                },
              });
            } else {
              await writeLog({
                timestamp: Date.now(),
                level: 'info',
                category: 'sync',
                message: `${recordLogPrefix} isActive matches cloud (no PUT needed) - cloud: ${cloudIsActive}, local: ${localIsActive}`,
                data: { externalId: syncPayload.externalId },
              });
            }
          } else {
            await writeLog({
              timestamp: Date.now(),
              level: 'info',
              category: 'sync',
              message: `${recordLogPrefix} Condition not met for "already exists" PUT logic - skipping`,
              data: {
                reasonRequestMethodNotPost: requestMethod !== 'POST',
                reasonStatusNot200: response.status !== 200,
                reasonMessageDoesntHaveAlreadyExists: !responseData?.message?.includes('already exists'),
              },
            });
          }

          // Check if response is successful (2xx status or has success flag)
          const isSuccessful = response.status >= 200 && response.status < 300;
          const hasSuccessFlag = responseData?.success === true;
          
          // Log the result of success check
          await writeLog({
            timestamp: Date.now(),
            level: 'info',
            category: 'sync',
            message: `${recordLogPrefix} Success check`,
            data: { 
              isSuccessful,
              hasSuccessFlag,
              statusCode: response.status,
              successValue: responseData?.success,
            },
          });

          if (isSuccessful && hasSuccessFlag) {
            // Mark as synced in local database
            const externalId = syncPayload.externalId;
            
            try {
              await writeLog({
                timestamp: Date.now(),
                level: 'info',
                category: 'sync',
                message: `${recordLogPrefix} Marking as synced in local database`,
                data: { externalId },
              });
              
              await this.localDb.markAsSynced([externalId]);
              
              // Also remove from sync queue
              const queueId = `sync-${externalId}`;
              try {
                await db.syncQueue.delete(queueId);
                await writeLog({
                  timestamp: Date.now(),
                  level: 'info',
                  category: 'sync',
                  message: `${recordLogPrefix} Removed from sync queue`,
                  data: { queueId },
                });
              } catch (queueError) {
                console.warn(`[sync-manager] Failed to remove queue item ${queueId}`, queueError);
                await writeLog({
                  timestamp: Date.now(),
                  level: 'warn',
                  category: 'sync',
                  message: `${recordLogPrefix} Failed to remove from sync queue`,
                  data: { queueId, error: String(queueError) },
                });
              }
              
              await writeLog({
                timestamp: Date.now(),
                level: 'info',
                category: 'sync',
                message: `${recordLogPrefix} Successfully marked as synced`,
                data: { externalId },
              });
              
              synced++;
            } catch (markError) {
              await writeLog({
                timestamp: Date.now(),
                level: 'error',
                category: 'sync',
                message: `${recordLogPrefix} ERROR marking as synced`,
                data: { 
                  externalId, 
                  error: markError instanceof Error ? markError.message : String(markError),
                },
                stackTrace: markError instanceof Error ? markError.stack : undefined,
              });
              failed++;
            }
            
            // Log warning if it was queued (202 response)
            if (response.status === 202 && responseData?.warning) {
              logInfo(`Record synced with warning: ${responseData.warning}`, { recordId: externalId });
            } else if (synced > 0) {
              logInfo(`Record synced: ${externalId}`);
            }
          } else {
            failed++;
            const failureReason = !isSuccessful 
              ? `Bad status: ${response.status}` 
              : `Missing success flag: ${responseData?.success}`;
            
            await writeLog({
              timestamp: Date.now(),
              level: 'warn',
              category: 'sync',
              message: `${recordLogPrefix} Response validation FAILED: ${failureReason}`,
              data: { 
                status: response.status,
                successFlag: responseData?.success,
                failureReason,
                fullResponse: response.data,
              },
            });
            
            logError('Unexpected response', new Error(`Status: ${response.status}, Success: ${hasSuccessFlag}`));
          }
        } catch (error) {
          failed++;
          const recordLogPrefix = `[Record ${i + 1}/${records.length}]`;
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isAxiosError = error instanceof axios.AxiosError;
          const responseData = isAxiosError ? error.response?.data : null;
          const responseStatus = isAxiosError ? error.response?.status : null;
          const externalId = syncPayload?.externalId || record.externalId || record.external_id || record.id;
          const patientName = syncPayload?.patientName || record.patientName || record.patient_name || 'Unknown';
          
          // Extract more detailed error info
          const axiosCode = isAxiosError ? (error as AxiosError).code : undefined;
          const axiosMessage = isAxiosError ? (error as AxiosError).message : undefined;
          
          const errorDataObj = {
            recordLogPrefix,
            isAxiosError,
            status: responseStatus,
            statusText: isAxiosError ? error.response?.statusText : undefined,
            responseData: responseData,
            apiErrorMessage: typeof responseData === 'object' && responseData !== null 
              ? (responseData as any).message || (responseData as any).error 
              : String(responseData),
            recordId: externalId,
            recordName: patientName,
            errorMessage: errorMessage,
            errorType: error?.constructor?.name,
            requestUrl: `${options.apiBaseUrl}/api/dispenses`,
            axiosCode: axiosCode,
            axiosMessage: axiosMessage,
            axiosConfig: isAxiosError ? {
              baseURL: (error as AxiosError).config?.baseURL,
              url: (error as AxiosError).config?.url,
              method: (error as AxiosError).config?.method,
            } : undefined,
          };
          
          // Write error to persistent log FIRST
          await writeLog({
            timestamp: Date.now(),
            level: 'error',
            category: 'sync',
            message: `${recordLogPrefix} SYNC FAILED: ${externalId} (${patientName}) - ${errorMessage}`,
            data: errorDataObj,
            stackTrace: error instanceof Error ? error.stack : undefined,
          });
          
          logError(`${recordLogPrefix} Failed to sync record ${externalId}`, error);
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

      // Also sync ticket notes
      const notesResult = await this.syncTicketNotes(options);
      synced += notesResult.synced;
      failed += notesResult.failed;

      // Also sync tickets
      const ticketsResult = await this.syncTickets(options);
      synced += ticketsResult.synced;
      failed += ticketsResult.failed;

      // Also sync temporary drugs and regimens (admin approval workflow)
      console.log('[SyncManager.syncNow] Syncing temp tables...');
      const tempResult = await this.syncTempTables(options);
      synced += tempResult.synced;
      failed += tempResult.failed;
      console.log('[SyncManager.syncNow] Temp tables sync complete:', tempResult);

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
        this.syncNow(options).then(() => {
          // Notify all components that auto-sync completed so they can refresh
          try {
            const state = useAppStore.getState();
            useAppStore.setState({
              syncCompletedCounter: state.syncCompletedCounter + 1,
            });
          } catch (e) {
            // Ignore error if store not available
          }
        }).catch(error => {
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
   * Sync unsynced tickets from local storage to server
   */
  async syncTickets(options: SyncOptions): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    try {
      // Get unsynced tickets from localStorage
      const localTickets = JSON.parse(localStorage.getItem('local_tickets') || '[]');
      const unsyncedTickets = localTickets.filter((t: any) => !t.synced);

      if (unsyncedTickets.length === 0) {
        logInfo('No tickets to sync');
        return { synced: 0, failed: 0 };
      }

      logInfo(`Starting ticket sync of ${unsyncedTickets.length} tickets`);

      for (const ticket of unsyncedTickets) {
        try {
          // Prepare form data with attachments
          const formData = new FormData();
          formData.append('title', ticket.title);
          formData.append('description', ticket.description);
          formData.append('category', ticket.category);
          formData.append('priority', ticket.priority);

          // Add attachments if any
          if (ticket.attachments && ticket.attachments.length > 0) {
            for (const attachment of ticket.attachments) {
              // Convert base64 back to blob
              const byteCharacters = atob(attachment.data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: attachment.type });
              
              formData.append('attachments', blob, attachment.name);
            }
          }

          const response = await axios.post(
            `${options.apiBaseUrl}/api/tickets`,
            formData,
            {
              headers: {
                'Authorization': `Bearer ${options.authToken}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          if (response.status === 201 && response.data.id) {
            // Mark ticket as synced in local storage
            const updatedTickets = localTickets.map((t: any) =>
              t.id === ticket.id ? { ...t, synced: true, id: response.data.id } : t
            );
            localStorage.setItem('local_tickets', JSON.stringify(updatedTickets));
            synced++;
            logInfo(`Ticket ${ticket.ticketNumber} synced successfully`);
          } else {
            failed++;
            logError(`Unexpected response for ticket ${ticket.ticketNumber}`, new Error(`Status: ${response.status}`));
          }
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          logError(`Failed to sync ticket ${ticket.ticketNumber}`, error instanceof Error ? error : new Error(errorMessage));
          
          // Store error in local storage
          const updatedTickets = localTickets.map((t: any) =>
            t.id === ticket.id ? { ...t, syncError: errorMessage, syncRetries: (t.syncRetries || 0) + 1 } : t
          );
          localStorage.setItem('local_tickets', JSON.stringify(updatedTickets));
        }
      }

      logInfo(`Ticket sync completed: ${synced} synced, ${failed} failed`);
      return { synced, failed };
    } catch (error) {
      logError('Ticket sync failed', error instanceof Error ? error : new Error(String(error)));
      return { synced, failed };
    }
  }

  /**
   * Sync unsynced ticket notes from local storage to server
   */
  async syncTicketNotes(options: SyncOptions): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    try {
      // Get unsynced notes from localStorage
      const localNotes = JSON.parse(localStorage.getItem('local_ticket_notes') || '[]');
      const unsyncedNotes = localNotes.filter((n: any) => !n.synced);

      if (unsyncedNotes.length === 0) {
        logInfo('No ticket notes to sync');
        return { synced: 0, failed: 0 };
      }

      logInfo(`Starting ticket notes sync of ${unsyncedNotes.length} notes`);

      for (const note of unsyncedNotes) {
        try {
          const response = await axios.post(
            `${options.apiBaseUrl}/api/tickets/${note.ticketId}/notes`,
            { content: note.content },
            {
              headers: {
                'Authorization': `Bearer ${options.authToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.status === 201 && response.data.id) {
            // Mark note as synced in local storage
            const updatedNotes = localNotes.map((n: any) =>
              n.id === note.id ? { ...n, synced: true, id: response.data.id } : n
            );
            localStorage.setItem('local_ticket_notes', JSON.stringify(updatedNotes));
            synced++;
            logInfo(`Ticket note synced successfully`);
          } else {
            failed++;
            logError(`Unexpected response for ticket note`, new Error(`Status: ${response.status}`));
          }
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          logError(`Failed to sync ticket note`, error instanceof Error ? error : new Error(errorMessage));
          
          // Store error in local storage
          const updatedNotes = localNotes.map((n: any) =>
            n.id === note.id ? { ...n, syncError: errorMessage, syncRetries: (n.syncRetries || 0) + 1 } : n
          );
          localStorage.setItem('local_ticket_notes', JSON.stringify(updatedNotes));
        }
      }

      logInfo(`Ticket notes sync completed: ${synced} synced, ${failed} failed`);
      return { synced, failed };
    } catch (error) {
      logError('Ticket notes sync failed', error instanceof Error ? error : new Error(String(error)));
      return { synced, failed };
    }
  }

  /**
   * Pull dispense records from cloud to client
   */
  async pullDispenseRecords(options: SyncOptions): Promise<{ pulled: number }> {
    try {
      logInfo('Starting dispense records pull from cloud');

      const response = await axios.post(
        `${options.apiBaseUrl}/api/sync/pull-dispense-records`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${options.authToken}`,
          },
        }
      );

      if (response.data.success && response.data.records) {
        // Save to IndexedDB
        for (const record of response.data.records) {
          await db.dispenseRecords.put(record);
        }
        logInfo(`Pulled ${response.data.records.length} dispense records to IndexedDB`);
        return { pulled: response.data.records.length };
      }

      return { pulled: 0 };
    } catch (error) {
      logError('Failed to pull dispense records', error instanceof Error ? error : new Error(String(error)));
      return { pulled: 0 };
    }
  }

  /**
   * Pull tickets from cloud to client
   */
  async pullTickets(options: SyncOptions): Promise<{ pulled: number }> {
    try {
      logInfo('Starting tickets pull from cloud');

      const response = await axios.post(
        `${options.apiBaseUrl}/api/sync/pull-tickets`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${options.authToken}`,
          },
        }
      );

      if (response.data.success && response.data.tickets) {
        // Save tickets and their notes to IndexedDB
        for (const ticket of response.data.tickets) {
          const notes = ticket.notes || [];
          delete ticket.notes; // Remove notes array from ticket object

          // Save ticket
          await db.tickets.put(ticket);

          // Save notes
          for (const note of notes) {
            await db.ticketNotes.put(note);
          }
        }
        logInfo(`Pulled ${response.data.tickets.length} tickets to IndexedDB`);
        return { pulled: response.data.tickets.length };
      }

      return { pulled: 0 };
    } catch (error) {
      logError('Failed to pull tickets', error instanceof Error ? error : new Error(String(error)));
      return { pulled: 0 };
    }
  }

  /**
   * Pull system settings from cloud to IndexedDB
   */
  async pullSystemSettings(options: SyncOptions): Promise<{ pulled: boolean }> {
    try {
      logInfo('Starting system settings pull from cloud');

      const response = await axios.get(
        `${options.apiBaseUrl}/api/system-settings`,
        {
          headers: {
            'Authorization': `Bearer ${options.authToken}`,
          },
        }
      );

      logInfo('System settings API response received', { status: response.status, hasData: !!response.data });

      if (response.data && response.data.data) {
        const settings = response.data.data;
        
        logInfo('System settings data found, storing to IndexedDB', { facilityName: settings.facilityName });
        
        // Remove the numeric id if it exists, use fixed 'system-settings' id
        const { id, ...settingsData } = settings;
        
        // Save to IndexedDB with fixed ID for singleton pattern
        await db.systemSettings.put({
          ...settingsData,
          id: 'system-settings',
        });
        logInfo('Successfully pulled system settings to IndexedDB', { settingsKeys: Object.keys(settingsData) });
        return { pulled: true };
      } else if (response.data && response.data.success === true && !response.data.data) {
        logInfo('System settings endpoint returned success but with null data');
        return { pulled: false };
      }

      logInfo('No system settings data received from API');
      return { pulled: false };
    } catch (error) {
      logError('Failed to pull system settings', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return { pulled: false };
    }
  }

  /**
   * Pull drugs and dose regimens from server
   */
  async pullDrugsAndRegimens(options: SyncOptions): Promise<{ drugs: number; regimens: number }> {
    let drugs = 0;
    let regimens = 0;

    try {
      // Pull drugs
      logInfo('Pulling drugs from server...');
      const drugsResponse = await axios.get(`${options.apiBaseUrl}/api/drugs`, {
        headers: {
          Authorization: `Bearer ${options.authToken}`,
        },
      });

      if (drugsResponse.data && drugsResponse.data.data) {
        const drugList = drugsResponse.data.data;
        
        // Clear old drugs and insert new ones
        await db.drugs.clear();
        await db.drugs.bulkAdd(drugList);
        
        logInfo(`Pulled ${drugList.length} drugs`);
        drugs = drugList.length;

        // Reinitialize search service to update Fuse index with new drugs
        const { searchService } = require('@/services/search');
        await searchService.initialize();
        logInfo('Search service reinitialized with new drugs');
      }

      // Pull dose regimens
      logInfo('Pulling dose regimens from server...');
      const regimensResponse = await axios.get(`${options.apiBaseUrl}/api/dose-regimens`, {
        headers: {
          Authorization: `Bearer ${options.authToken}`,
        },
      });

      if (regimensResponse.data && regimensResponse.data.data) {
        const regimenList = regimensResponse.data.data;
        
        // Clear old regimens and insert new ones
        await db.doseRegimens.clear();
        await db.doseRegimens.bulkAdd(regimenList);
        
        logInfo(`Pulled ${regimenList.length} dose regimens`);
        regimens = regimenList.length;
      }

      return { drugs, regimens };
    } catch (error) {
      logError('Failed to pull drugs and regimens', error instanceof Error ? error : new Error(String(error)));
      return { drugs, regimens };
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

  /**
   * Sync temporary drugs and regimens to the server
   */
  async syncTempTables(options: SyncOptions): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    try {
      // Sync pending temp drugs
      const tempDrugs = await db.tempDrugs.where('status').equals('pending').toArray();
      console.log(`[SyncManager] Found ${tempDrugs.length} pending temp drugs to sync`);
      logInfo(`Syncing temp tables: Found ${tempDrugs.length} pending temp drugs`);
      
      // Map local temp drug IDs to server IDs
      const idMap = new Map<string, string>();
      
      for (const tempDrug of tempDrugs) {
        try {
          console.log(`[SyncManager] Syncing temp drug: ${tempDrug.id}`, tempDrug);
          const response = await axios.post(`${options.apiBaseUrl}/api/temp-drugs`, tempDrug, {
            headers: {
              Authorization: `Bearer ${options.authToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.status === 201 && response.data?.id) {
            // Map local ID to server ID
            idMap.set(tempDrug.id, response.data.id);
            synced++;
            console.log(`[SyncManager] [OK] Synced temp drug: ${tempDrug.id} -> server ID: ${response.data.id}`);
            logInfo(`Synced temp drug: ${tempDrug.id} -> server ID: ${response.data.id}`);
            
            // Delete from local database after successful sync to prevent duplicate syncing
            await db.tempDrugs.delete(tempDrug.id);
            console.log(`[SyncManager] [OK] Deleted synced temp drug ${tempDrug.id} from local DB`);
          }
        } catch (err) {
          failed++;
          console.error(`[SyncManager]  Failed to sync temp drug ${tempDrug.id}:`, err);
          logError(`Failed to sync temp drug ${tempDrug.id}`, err instanceof Error ? err : new Error(String(err)));
        }
      }

      // Sync pending temp regimens
      const tempRegimens = await db.tempDrugRegimens.where('status').equals('pending').toArray();
      console.log(`[SyncManager] Found ${tempRegimens.length} pending temp regimens to sync`);
      logInfo(`Syncing temp tables: Found ${tempRegimens.length} pending temp regimens`);
      
      for (const tempRegimen of tempRegimens) {
        try {
          // If the temp drug was just synced, use the new server ID
          const serverTempDrugId = idMap.get(tempRegimen.tempDrugId) || tempRegimen.tempDrugId;
          
          const regimenToSync = {
            ...tempRegimen,
            tempDrugId: serverTempDrugId,
          };
          
          console.log(`[SyncManager] Syncing temp regimen: ${tempRegimen.id}`, regimenToSync);
          const response = await axios.post(`${options.apiBaseUrl}/api/temp-drug-regimens`, regimenToSync, {
            headers: {
              Authorization: `Bearer ${options.authToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.status === 201) {
            synced++;
            console.log(`[SyncManager] [OK] Synced temp regimen: ${tempRegimen.id} (linked to temp drug: ${serverTempDrugId})`);
            logInfo(`Synced temp regimen: ${tempRegimen.id} (linked to temp drug: ${serverTempDrugId})`);
            
            // Delete from local database after successful sync to prevent duplicate syncing
            await db.tempDrugRegimens.delete(tempRegimen.id);
            console.log(`[SyncManager] [OK] Deleted synced temp regimen ${tempRegimen.id} from local DB`);
          }
        } catch (err) {
          failed++;
          console.error(`[SyncManager]  Failed to sync temp regimen ${tempRegimen.id}:`, err);
          logError(`Failed to sync temp regimen ${tempRegimen.id}`, err instanceof Error ? err : new Error(String(err)));
        }
      }
      
      console.log(`[SyncManager] Temp tables sync complete: ${synced} synced, ${failed} failed`);
      logInfo(`Temp tables sync complete: ${synced} synced, ${failed} failed`);
    } catch (error) {
      console.error('[SyncManager] Error syncing temp tables:', error);
      logError('Error syncing temp tables', error instanceof Error ? error : new Error(String(error)));
    }

    return { synced, failed };
  }

  /**
   * Pull SMTP settings from cloud to IndexedDB
   */
  async pullSMTPSettings(options: SyncOptions): Promise<{ pulled: boolean }> {
    try {
      logInfo('Starting SMTP settings pull from cloud');

      const response = await axios.get(
        `${options.apiBaseUrl}/api/sync/pull-smtp`,
        {
          headers: {
            'Authorization': `Bearer ${options.authToken}`,
          },
        }
      );

      logInfo('SMTP settings API response received', { status: response.status, hasData: !!response.data });

      if (response.data && response.data.data) {
        const settings = response.data.data;
        
        logInfo('SMTP settings data found, storing to IndexedDB', { host: settings.host });
        
        // Save to IndexedDB with fixed ID for singleton pattern
        await db.smtpSettings.put({
          ...settings,
          id: 'smtp-settings',
        });
        
        // Also save to localStorage for backward compatibility
        if (typeof window !== 'undefined') {
          localStorage.setItem('sems_smtp_settings', JSON.stringify(settings));
        }
        
        logInfo('Successfully pulled SMTP settings to IndexedDB and localStorage');
        return { pulled: true };
      } else if (response.data && response.data.success === true && !response.data.data) {
        logInfo('SMTP settings endpoint returned success but with null data');
        return { pulled: false };
      }

      logInfo('No SMTP settings data received from API');
      return { pulled: false };
    } catch (error) {
      logError('Failed to pull SMTP settings', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return { pulled: false };
    }
  }

  /**
   * Pull pharmacies from cloud to IndexedDB
   */
  async pullPharmacies(options: SyncOptions): Promise<{ pulled: number }> {
    try {
      logInfo('Starting pharmacies pull from cloud');

      const response = await axios.post(
        `${options.apiBaseUrl}/api/sync/pull-pharmacies`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${options.authToken}`,
          },
        }
      );

      if (response.data.success && response.data.pharmacies) {
        // Save to IndexedDB
        await db.pharmacies.bulkPut(response.data.pharmacies);
        logInfo(`Pulled ${response.data.pharmacies.length} pharmacies to IndexedDB`);
        return { pulled: response.data.pharmacies.length };
      }

      return { pulled: 0 };
    } catch (error) {
      logError('Failed to pull pharmacies', error instanceof Error ? error : new Error(String(error)));
      return { pulled: 0 };
    }
  }
}

export const syncManager = new SyncManager();
