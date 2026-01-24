'use client';

import { useAppStore } from '@/store/app';
import { syncManager } from './sync-manager';
import { logInfo, logError } from '@/lib/logger';

export interface SyncControllerOptions {
  apiBaseUrl: string;
  authToken: string;
}

/**
 * Manages sync operations with UI integration
 */
export class SyncController {
  private options: SyncControllerOptions | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the sync controller
   */
  async initialize(options: SyncControllerOptions): Promise<void> {
    // Prevent multiple concurrent initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      this.options = options;
      
      // Load saved configuration
      const savedConfig = this.loadSyncConfig();
      useAppStore.setState({ syncConfig: savedConfig });

      // Start auto sync if enabled
      if (savedConfig.enabled) {
        this.startAutoSync(savedConfig.intervalSeconds);
      }

      this.initialized = true;
      logInfo('Sync controller initialized');
    })();

    return this.initPromise;
  }

  /**
   * Ensure controller is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    throw new Error('Sync controller not initialized - call initialize() first');
  }

  /**
   * Manual sync trigger
   */
  async triggerManualSync(): Promise<{ synced: number; failed: number }> {
    await this.ensureInitialized();

    if (!this.options) {
      throw new Error('Sync controller options not set');
    }

    useAppStore.setState({ syncConfig: { isSyncing: true } as any });

    try {
      console.log('[SyncController] Triggering manual sync with:', {
        apiBaseUrl: this.options.apiBaseUrl,
        authToken: this.options.authToken ? this.options.authToken.substring(0, 20) + '...' : 'MISSING',
      });
      
      const result = await syncManager.syncNow({
        apiBaseUrl: this.options.apiBaseUrl,
        authToken: this.options.authToken,
      });

      // Also sync temporary drugs and regimens
      console.log('[SyncController] Starting temp tables sync...');
      const tempResult = await syncManager.syncTempTables({
        apiBaseUrl: this.options.apiBaseUrl,
        authToken: this.options.authToken,
      });
      console.log('[SyncController] Temp tables sync result:', tempResult);

      // Combine results
      const totalSynced = result.synced + tempResult.synced;
      const totalFailed = result.failed + tempResult.failed;

      // Update sync stats
      const stats = await syncManager.getSyncStats();
      useAppStore.setState({
        syncConfig: {
          lastSyncTime: Date.now(),
          syncStats: stats,
          isSyncing: false,
        } as any,
      });

      console.log('[SyncController] Manual sync completed:', { totalSynced, totalFailed, dispenses: result, temp: tempResult });
      logInfo(`Manual sync completed: ${totalSynced} synced, ${totalFailed} failed (dispenses: ${result.synced}/${result.failed}, temp: ${tempResult.synced}/${tempResult.failed})`);
      return { synced: totalSynced, failed: totalFailed };
    } catch (error) {
      logError('Manual sync failed', error);
      useAppStore.setState({ syncConfig: { isSyncing: false } as any });
      throw error;
    }
  }

  /**
   * Start automatic syncing
   */
  startAutoSync(intervalSeconds: number = 300): void {
    // Synchronously ensure we have options, but don't wait for full init
    if (!this.options && !this.initialized) {
      logError('Sync controller not initialized - cannot start auto sync');
      return;
    }

    // Clear existing timer
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    const intervalMs = intervalSeconds * 1000;

    syncManager.startAutoSync(
      {
        apiBaseUrl: this.options!.apiBaseUrl,
        authToken: this.options!.authToken,
      },
      intervalMs
    );

    // Update UI state
    useAppStore.setState({
      syncConfig: {
        enabled: true,
        intervalSeconds,
      } as any,
    });

    this.saveSyncConfig({ enabled: true, intervalSeconds });
    logInfo(`Auto sync started with ${intervalSeconds}s interval`);
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync(): void {
    syncManager.stopAutoSync();

    useAppStore.setState({
      syncConfig: {
        enabled: false,
      } as any,
    });

    this.saveSyncConfig({ enabled: false });
    logInfo('Auto sync stopped');
  }

  /**
   * Update sync interval
   */
  updateSyncInterval(intervalSeconds: number): void {
    if (intervalSeconds < 30 || intervalSeconds > 3600) {
      throw new Error('Sync interval must be between 30 and 3600 seconds');
    }

    const state = useAppStore.getState();
    if (state.syncConfig.enabled) {
      this.stopAutoSync();
      this.startAutoSync(intervalSeconds);
    } else {
      useAppStore.setState({
        syncConfig: {
          intervalSeconds,
        } as any,
      });
      this.saveSyncConfig({ intervalSeconds });
    }

    logInfo(`Sync interval updated to ${intervalSeconds}s`);
  }

  /**
   * Get current sync statistics
   */
  async getSyncStats(): Promise<any> {
    try {
      return await syncManager.getSyncStats();
    } catch (error) {
      logError('Failed to get sync stats', error);
      return null;
    }
  }

  /**
   * Pull cloud data (dispense records, tickets) to client
   */
  async pullDataToClient(): Promise<void> {
    if (!this.options) {
      throw new Error('Sync controller not initialized');
    }

    try {
      logInfo('Starting data pull from cloud');
      useAppStore.setState((state) => ({
        syncConfig: {
          ...state.syncConfig,
          isSyncing: true,
        },
      }));

      // Pull dispense records
      const dispenseResult = await syncManager.pullDispenseRecords(this.options);
      logInfo(`Pulled ${dispenseResult.pulled} dispense records`);

      // Pull drugs and dose regimens (includes newly approved drugs)
      const drugsResult = await syncManager.pullDrugsAndRegimens(this.options);
      logInfo(`Pulled ${drugsResult.drugs} drugs and ${drugsResult.regimens} dose regimens`);

      // Pull tickets
      const ticketsResult = await syncManager.pullTickets(this.options);
      logInfo(`Pulled ${ticketsResult.pulled} tickets`);

      // Pull system settings
      const settingsResult = await syncManager.pullSystemSettings(this.options);
      logInfo(`Pulled system settings: ${settingsResult.pulled ? 'success' : 'failed'}`);

      logInfo('Data pull completed successfully');
    } catch (error) {
      logError('Failed to pull data from cloud', error);
    } finally {
      useAppStore.setState((state) => ({
        syncConfig: {
          ...state.syncConfig,
          isSyncing: false,
        },
      }));
    }
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return syncManager.isSyncInProgress();
  }

  /**
   * Save sync configuration to localStorage
   */
  private saveSyncConfig(config: Partial<any>): void {
    try {
      const current = this.loadSyncConfig();
      const updated = { ...current, ...config };
      localStorage.setItem('sems_sync_config', JSON.stringify(updated));
    } catch (error) {
      logError('Failed to save sync config', error);
    }
  }

  /**
   * Load sync configuration from localStorage
   */
  private loadSyncConfig(): any {
    try {
      const saved = localStorage.getItem('sems_sync_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      logError('Failed to load sync config', error);
    }

    return {
      enabled: true,
      intervalSeconds: 300,
      isSyncing: false,
    };
  }
}

export const syncController = new SyncController();
