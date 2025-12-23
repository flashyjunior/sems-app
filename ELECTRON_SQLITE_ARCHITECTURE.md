# Electron + SQLite Desktop App Architecture

## Overview

Migrate from Tauri to Electron while maintaining one shared Next.js codebase. The desktop app will use SQLite instead of IndexedDB, while keeping the same sync logic for PostgreSQL.

## Current State Analysis

### What We Have
- **Next.js frontend** - shared UI codebase ✓
- **IndexedDB abstraction** - in `src/lib/db.ts` (Dexie) ✓
- **Sync logic** - in `src/services/sync.ts` (reusable) ✓
- **PostgreSQL backend** - API routes for sync ✓

### What Needs to Change
- Replace **IndexedDB → SQLite** (desktop only)
- Create **storage abstraction layer** (works with both)
- Add **Electron shell** (replace Tauri)
- Enable **background sync** (while minimized)

---

## Implementation Plan

### Phase 1: Create Storage Abstraction Layer

**Goal:** Make database operations work with both IndexedDB and SQLite

#### Step 1: Define Storage Interface

File: `src/lib/storage/interface.ts`

```typescript
// Define what a storage adapter must implement
export interface StorageAdapter {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  saveUser(user: User): Promise<void>;
  
  // Dispense Records
  getDispenseRecord(id: string): Promise<DispenseRecord | undefined>;
  getAllDispenseRecords(): Promise<DispenseRecord[]>;
  saveDispenseRecord(record: DispenseRecord): Promise<void>;
  updateDispenseRecord(id: string, updates: Partial<DispenseRecord>): Promise<void>;
  
  // Drugs
  getDrug(id: string): Promise<Drug | undefined>;
  getAllDrugs(): Promise<Drug[]>;
  saveDrugs(drugs: Drug[]): Promise<void>;
  
  // Dose Regimens
  getDoseRegimen(id: string): Promise<DoseRegimen | undefined>;
  getDoseRegimensForDrug(drugId: string): Promise<DoseRegimen[]>;
  saveDoseRegimen(regimen: DoseRegimen): Promise<void>;
  
  // Sync Queue
  getSyncQueueItem(id: string): Promise<SyncQueueItem | undefined>;
  getAllSyncQueueItems(): Promise<SyncQueueItem[]>;
  saveSyncQueueItem(item: SyncQueueItem): Promise<void>;
  updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void>;
  deleteSyncQueueItem(id: string): Promise<void>;
  
  // Sync Metadata
  getSyncMetadata(key: string): Promise<unknown>;
  setSyncMetadata(key: string, value: unknown): Promise<void>;
}
```

#### Step 2: Web Implementation (IndexedDB)

File: `src/lib/storage/indexeddb-adapter.ts`

```typescript
import Dexie, { Table } from 'dexie';
import type { StorageAdapter } from './interface';
import type { User, DispenseRecord, Drug, DoseRegimen, SyncQueueItem } from '@/types';

export class IndexedDBAdapter implements StorageAdapter {
  private db: Dexie;

  constructor() {
    this.db = new Dexie('SEMSDB');
    this.db.version(1).stores({
      users: 'id, username',
      dispenseRecords: 'id, pharmacistId, timestamp, synced',
      drugs: 'id, genericName',
      doseRegimens: 'id, drugId',
      syncQueue: 'id',
      syncMetadata: 'key',
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return (this.db.table('users') as Table<User>).get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return (this.db.table('users') as Table<User>).toArray();
  }

  async saveUser(user: User): Promise<void> {
    await (this.db.table('users') as Table<User>).put(user);
  }

  // ... implement all other methods similarly
}
```

#### Step 3: Desktop Implementation (SQLite)

File: `src/lib/storage/sqlite-adapter.ts`

```typescript
import type Database from 'better-sqlite3';
import type { StorageAdapter } from './interface';
import type { User, DispenseRecord, Drug, DoseRegimen, SyncQueueItem } from '@/types';

export class SQLiteAdapter implements StorageAdapter {
  constructor(private db: Database.Database) {
    this.initializeTables();
  }

  private initializeTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        role TEXT,
        createdAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS dispense_records (
        id TEXT PRIMARY KEY,
        pharmacistId TEXT,
        patientName TEXT,
        patientAge INTEGER,
        patientWeight REAL,
        drugName TEXT,
        synced INTEGER,
        timestamp INTEGER,
        syncedAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS drugs (
        id TEXT PRIMARY KEY,
        genericName TEXT,
        tradeName TEXT,
        strength TEXT,
        route TEXT,
        stgReference TEXT
      );

      CREATE TABLE IF NOT EXISTS dose_regimens (
        id TEXT PRIMARY KEY,
        drugId TEXT,
        ageMin INTEGER,
        ageMax INTEGER,
        weightMin REAL,
        weightMax REAL,
        doseMg TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        recordId TEXT,
        retries INTEGER,
        error TEXT,
        lastAttempt INTEGER
      );

      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }

  async getUser(id: string): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      createdAt: row.createdAt,
    };
  }

  async getAllDispenseRecords(): Promise<DispenseRecord[]> {
    const stmt = this.db.prepare('SELECT * FROM dispense_records ORDER BY timestamp DESC');
    return stmt.all() as DispenseRecord[];
  }

  async saveDispenseRecord(record: DispenseRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO dispense_records 
      (id, pharmacistId, patientName, patientAge, patientWeight, drugName, synced, timestamp, syncedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.id,
      record.pharmacistId,
      record.patientName,
      record.patientAge,
      record.patientWeight,
      record.drugName,
      record.synced ? 1 : 0,
      record.timestamp,
      record.syncedAt
    );
  }

  // ... implement all other methods similarly
}
```

#### Step 4: Factory & Initialization

File: `src/lib/storage/index.ts`

```typescript
import type { StorageAdapter } from './interface';
import { IndexedDBAdapter } from './indexeddb-adapter';

let storageAdapter: StorageAdapter | null = null;

export function initializeStorage(adapter: StorageAdapter) {
  storageAdapter = adapter;
}

export function getStorage(): StorageAdapter {
  if (!storageAdapter) {
    // Default to IndexedDB for web
    storageAdapter = new IndexedDBAdapter();
  }
  return storageAdapter;
}

// Export convenience functions
export const db = {
  getUser: (id: string) => getStorage().getUser(id),
  getAllUsers: () => getStorage().getAllUsers(),
  saveUser: (user) => getStorage().saveUser(user),
  getDispenseRecord: (id: string) => getStorage().getDispenseRecord(id),
  getAllDispenseRecords: () => getStorage().getAllDispenseRecords(),
  saveDispenseRecord: (record) => getStorage().saveDispenseRecord(record),
  // ... etc
};
```

---

### Phase 2: Set Up Electron Shell

#### Step 1: Install Electron Dependencies

```bash
npm install electron electron-squirrel-startup
npm install --save-dev @electron-forge/cli @electron-forge/maker-squirrel @electron-forge/maker-zip
```

#### Step 2: Create Main Process

File: `public/electron/main.ts`

```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import Database from 'better-sqlite3';
import { SQLiteAdapter } from '../src/lib/storage/sqlite-adapter';

let mainWindow: BrowserWindow | null = null;
let db: Database.Database | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load Next.js server in production, dev server in development
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize SQLite database
function initializeDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'sems.db');
  db = new Database(dbPath);
  
  // Initialize storage adapter
  const sqliteAdapter = new SQLiteAdapter(db);
  initializeStorage(sqliteAdapter);
  
  console.log(`Database initialized at: ${dbPath}`);
}

app.on('ready', () => {
  initializeDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (db) {
    db.close();
  }
});

// IPC handlers for database operations
ipcMain.handle('db:save-record', async (_, record) => {
  const adapter = new SQLiteAdapter(db!);
  await adapter.saveDispenseRecord(record);
  return true;
});

ipcMain.handle('db:get-records', async () => {
  const adapter = new SQLiteAdapter(db!);
  return adapter.getAllDispenseRecords();
});
```

#### Step 3: Create Preload Script

File: `public/electron/preload.ts`

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  saveDispenseRecord: (record: any) =>
    ipcRenderer.invoke('db:save-record', record),
  getDispenseRecords: () =>
    ipcRenderer.invoke('db:get-records'),
  
  // Background sync
  startBackgroundSync: () =>
    ipcRenderer.invoke('sync:start-background'),
  
  // Check if running in Electron
  isElectron: true,
});
```

---

### Phase 3: Update Sync Service

File: `src/services/sync.ts`

The current sync logic stays **almost the same**! Just need small updates:

```typescript
// Before: only use online/offline events from browser
// After: also handle Electron background sync

export class SyncService {
  async syncAll() {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    this.notifyStatusChange();

    try {
      // Same logic as before
      const pending = await db.getAllSyncQueueItems();

      for (const item of pending) {
        try {
          await this.syncRecord(item.record);
          await db.updateDispenseRecord(item.record.id, { synced: true });
        } catch (error) {
          // Same retry logic
        }
      }
    } finally {
      this.syncInProgress = false;
      this.notifyStatusChange();
    }
  }
}
```

---

### Phase 4: Background Sync Service (Electron Only)

File: `public/electron/background-sync.ts`

```typescript
import { ipcMain } from 'electron';
import { SyncService } from '../../src/services/sync';

export function setupBackgroundSync() {
  const syncService = new SyncService();

  // Sync on startup
  syncService.syncAll();

  // Sync every 5 minutes
  setInterval(() => {
    syncService.syncAll();
  }, 5 * 60 * 1000);

  // Sync when network comes back online
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      syncService.syncAll();
    });
  }

  // IPC handler for manual sync trigger
  ipcMain.handle('sync:start-background', async () => {
    return syncService.syncAll();
  });
}
```

---

## Implementation Checklist

### Part 1: Storage Abstraction
- [ ] Create `StorageAdapter` interface
- [ ] Implement `IndexedDBAdapter` 
- [ ] Implement `SQLiteAdapter`
- [ ] Create factory function in `src/lib/storage/index.ts`
- [ ] Update `src/lib/db.ts` to use adapter pattern

### Part 2: Electron Setup
- [ ] Install Electron & dependencies
- [ ] Create `public/electron/main.ts`
- [ ] Create `public/electron/preload.ts`
- [ ] Create `public/electron/background-sync.ts`
- [ ] Update `package.json` with Electron scripts

### Part 3: Integration
- [ ] Update sync service to handle both environments
- [ ] Add environment detection (browser vs Electron)
- [ ] Test data persistence on desktop
- [ ] Test sync with PostgreSQL

### Part 4: Distribution
- [ ] Set up electron-forge for builds
- [ ] Create installer (MSI for Windows)
- [ ] Add auto-update capability
- [ ] Test on fresh Windows installation

---

## Key Benefits

✅ **One codebase** - Same Next.js app for web and desktop
✅ **Offline-first** - SQLite on desktop, IndexedDB on web
✅ **Background sync** - Syncs even when minimized (Electron)
✅ **Real database** - SQLite is more robust than IndexedDB
✅ **Easy distribution** - NSIS installer for Windows
✅ **Familiar stack** - Uses Electron (most popular desktop framework)

---

## Migration Path

1. **Now:** Use Tauri with IndexedDB ← You are here
2. **Step 1:** Add storage abstraction (IndexedDB still works)
3. **Step 2:** Add Electron shell with SQLite
4. **Step 3:** Switch default to Electron
5. **Step 4:** Retire Tauri (keep web working)

This allows gradual migration without breaking anything!

---

## File Structure After Implementation

```
sems-app/
├── public/
│   └── electron/
│       ├── main.ts
│       ├── preload.ts
│       └── background-sync.ts
├── src/
│   ├── lib/
│   │   └── storage/
│   │       ├── interface.ts
│   │       ├── indexeddb-adapter.ts
│   │       ├── sqlite-adapter.ts
│   │       └── index.ts
│   └── services/
│       └── sync.ts (minimal changes)
└── package.json (with Electron scripts)
```
