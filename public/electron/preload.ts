import { contextBridge, ipcRenderer } from 'electron';
import type { DispenseRecord, Drug, DoseRegimen, User, SyncQueueItem } from '../../src/types';

/**
 * Expose safe Electron APIs to the renderer process
 * This provides database access and other Electron-specific functionality
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Database operations
   */
  db: {
    // Dispense Records
    getRecords: (filter?: string) => ipcRenderer.invoke('db:get-records', filter),
    getRecord: (recordId: string) => ipcRenderer.invoke('db:get-record', recordId),
    saveRecord: (record: DispenseRecord) => ipcRenderer.invoke('db:save-record', record),
    updateRecord: (recordId: string, updates: Partial<DispenseRecord>) =>
      ipcRenderer.invoke('db:update-record', recordId, updates),
    deleteRecord: (recordId: string) => ipcRenderer.invoke('db:delete-record', recordId),

    // Drugs
    getDrugs: () => ipcRenderer.invoke('db:get-drugs'),
    saveDrugs: (drugs: Drug[]) => ipcRenderer.invoke('db:save-drugs', drugs),

    // Dose Regimens
    getRegimens: (drugId: string) => ipcRenderer.invoke('db:get-regimens', drugId),
    saveRegimens: (regimens: DoseRegimen[]) => ipcRenderer.invoke('db:save-regimens', regimens),

    // Users
    getUsers: () => ipcRenderer.invoke('db:get-users'),
    saveUser: (user: User) => ipcRenderer.invoke('db:save-user', user),

    // Sync Queue
    getSyncQueue: () => ipcRenderer.invoke('db:get-sync-queue'),
    saveSyncItem: (item: SyncQueueItem) => ipcRenderer.invoke('db:save-sync-item', item),
    updateSyncItem: (itemId: string, updates: Partial<SyncQueueItem>) =>
      ipcRenderer.invoke('db:update-sync-item', itemId, updates),
    deleteSyncItem: (itemId: string) => ipcRenderer.invoke('db:delete-sync-item', itemId),

    // Sync Metadata
    getLastSyncTime: () => ipcRenderer.invoke('db:get-last-sync-time'),
    setLastSyncTime: (time: number) => ipcRenderer.invoke('db:set-last-sync-time', time),

    // Utilities
    clear: () => ipcRenderer.invoke('db:clear'),
  },

  /**
   * System information
   */
  system: {
    isElectron: true,
    platform: process.platform,
    nodeVersion: process.version,
  },

  /**
   * Background sync control
   */
  sync: {
    startSync: () => ipcRenderer.invoke('sync:start'),
    stopSync: () => ipcRenderer.invoke('sync:stop'),
    onSyncStatusChange: (callback: (status: string) => void) => {
      ipcRenderer.on('sync:status-changed', (_event, status) => callback(status));
    },
  },
});

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

export const electronAPI = (window as any).electronAPI;
