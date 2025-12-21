import Dexie, { Table } from 'dexie';

export interface SyncQueueItem {
  id?: number;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
  retries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number | null;
  pendingChanges: number;
}

class SyncDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem>;
  cachedData!: Table<{ key: string; data: any; timestamp: number }>;

  constructor() {
    super('SEMSSync');
    this.version(1).stores({
      syncQueue: '++id, timestamp',
      cachedData: 'key, timestamp',
    });
  }
}

const db = new SyncDatabase();

export class SyncService {
  private static instance: SyncService;
  private serverUrl: string;
  private syncInterval: number;
  private autoSync: boolean;
  private syncTimer: NodeJS.Timeout | null = null;
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  private status: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingChanges: 0,
  };

  private constructor() {
    this.serverUrl = localStorage.getItem('serverUrl') || 'http://localhost:3000';
    this.syncInterval = parseInt(localStorage.getItem('syncInterval') || '15') * 60 * 1000; // Convert to ms
    this.autoSync = localStorage.getItem('autoSync') !== 'false';

    this.init();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private init() {
    // Monitor online/offline status
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Start auto-sync if enabled
    if (this.autoSync) {
      this.startAutoSync();
    }

    // Update pending changes count
    this.updatePendingCount();
  }

  private handleOnline() {
    console.log('[SyncService] Connected to network');
    this.status.isOnline = true;
    this.notifyListeners();

    // Trigger immediate sync
    this.syncAll().catch(console.error);
  }

  private handleOffline() {
    console.log('[SyncService] Disconnected from network');
    this.status.isOnline = false;
    this.notifyListeners();
  }

  private startAutoSync() {
    console.log('[SyncService] Auto-sync enabled at ' + this.syncInterval + 'ms intervals');
    this.syncTimer = setInterval(() => {
      if (this.status.isOnline && !this.status.isSyncing) {
        this.syncAll().catch(console.error);
      }
    }, this.syncInterval);
  }

  private stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  async updateConfig(serverUrl: string, syncInterval: number, autoSync: boolean) {
    this.serverUrl = serverUrl;
    this.syncInterval = syncInterval * 60 * 1000;
    this.autoSync = autoSync;

    // Restart auto-sync
    this.stopAutoSync();
    if (autoSync) {
      this.startAutoSync();
    }

    // Test connection
    try {
      await fetch(`${this.serverUrl}/api/health/database`);
    } catch (error) {
      console.error('[SyncService] Failed to connect to new server:', error);
    }
  }

  async queueRequest(endpoint: string, method: 'POST' | 'PUT' | 'DELETE', data?: any) {
    const item: SyncQueueItem = {
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    await db.syncQueue.add(item);
    await this.updatePendingCount();

    console.log('[SyncService] Queued', method, endpoint);

    // Try to sync immediately if online
    if (this.status.isOnline) {
      this.syncAll().catch(console.error);
    }
  }

  async syncAll() {
    if (this.status.isSyncing || !this.status.isOnline) {
      return;
    }

    this.status.isSyncing = true;
    this.notifyListeners();

    try {
      const items = await db.syncQueue.toArray();
      console.log('[SyncService] Syncing', items.length, 'queued requests');

      for (const item of items) {
        try {
          const response = await fetch(`${this.serverUrl}${item.endpoint}`, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            body: item.data ? JSON.stringify(item.data) : undefined,
          });

          if (response.ok) {
            await db.syncQueue.delete(item.id!);
            console.log('[SyncService] ✓ Synced', item.method, item.endpoint);
          } else if (response.status >= 500 || item.retries < 3) {
            // Retry on server error or if retries left
            item.retries += 1;
            await db.syncQueue.put(item);
            console.warn('[SyncService] ⚠ Failed, will retry:', item.method, item.endpoint);
          } else {
            // Give up
            await db.syncQueue.delete(item.id!);
            console.error('[SyncService] ✗ Failed permanently:', item.method, item.endpoint);
          }
        } catch (error) {
          console.error('[SyncService] Sync error:', error);
          if (item.retries < 3) {
            item.retries += 1;
            await db.syncQueue.put(item);
          }
        }
      }

      this.status.lastSync = Date.now();
      await this.updatePendingCount();
    } finally {
      this.status.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async updatePendingCount() {
    this.status.pendingChanges = await db.syncQueue.count();
    this.notifyListeners();
  }

  subscribeToStatus(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    // Immediately call with current status
    listener(this.status);
    // Return unsubscribe function
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.statusListeners.forEach((listener) => listener(this.status));
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  async clearQueue() {
    await db.syncQueue.clear();
    await this.updatePendingCount();
  }
}
