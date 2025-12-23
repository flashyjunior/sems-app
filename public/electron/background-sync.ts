import { ipcMain, BrowserWindow } from 'electron';
import type { SyncService } from '../../src/services/sync';

/**
 * Background sync service for Electron
 * Syncs data with the server periodically, even when app is minimized
 */
export class ElectronBackgroundSync {
  private syncService: SyncService | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isOnline: boolean = true;
  private syncInProgress = false;

  /**
   * Initialize background sync
   */
  initialize(syncService: SyncService) {
    this.syncService = syncService;

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }

    // Set up periodic sync
    this.startPeriodicSync();

    // Register IPC handlers
    this.registerIpcHandlers();

    console.log('✓ Background sync initialized');
  }

  /**
   * Start periodic sync every 5 minutes
   */
  private startPeriodicSync() {
    // Sync immediately on startup
    this.performSync();

    // Then sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform sync
   */
  private async performSync() {
    if (!this.isOnline || !this.syncService || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      await this.syncService.syncAll();
      this.notifyRenderer('sync:completed');
    } catch (error) {
      console.error('Background sync error:', error);
      this.notifyRenderer('sync:error', { error: String(error) });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Handle going online
   */
  private handleOnline() {
    console.log('✓ Connection restored, starting sync');
    this.isOnline = true;
    this.performSync();
  }

  /**
   * Handle going offline
   */
  private handleOffline() {
    console.log('✗ Connection lost, stopping sync');
    this.isOnline = false;
  }

  /**
   * Notify renderer process of sync status changes
   */
  private notifyRenderer(channel: string, data?: unknown) {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow) {
      mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Register IPC handlers for manual sync control
   */
  private registerIpcHandlers() {
    // Manual sync trigger
    ipcMain.handle('sync:start', async () => {
      if (!this.isOnline) {
        return { success: false, error: 'No internet connection' };
      }

      try {
        await this.performSync();
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    // Stop sync
    ipcMain.handle('sync:stop', () => {
      this.stopPeriodicSync();
      return { success: true };
    });

    // Get sync status
    ipcMain.handle('sync:get-status', () => {
      return {
        isOnline: this.isOnline,
        isSyncing: this.syncInProgress,
      };
    });
  }
}

export const backgroundSync = new ElectronBackgroundSync();
