// @ts-nocheck
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import type { DispenseRecord, Drug, DoseRegimen, User, SyncQueueItem } from '../../src/types';

// Storage reference - will be initialized by renderer
let storage: any = null;

let mainWindow: BrowserWindow | null = null;

/**
 * Create the main browser window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, '../../public/icon.png'),
  });

  // Load the app
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

/**
 * App event handlers
 */
app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * IPC Handlers for Database Operations
 */

// Get all dispense records
ipcMain.handle('db:get-records', async (_event, filter?: string) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');

    if (filter === 'pending') {
      return await sqliteAdapter.getUnsyncedRecords();
    }
    return await sqliteAdapter.getAllDispenseRecords();
  } catch (error) {
    console.error('Error getting records:', error);
    throw error;
  }
});

// Get single dispense record
ipcMain.handle('db:get-record', async (_event, recordId: string) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    return await sqliteAdapter.getDispenseRecord(recordId);
  } catch (error) {
    console.error('Error getting record:', error);
    throw error;
  }
});

// Save dispense record
ipcMain.handle('db:save-record', async (_event, record: DispenseRecord) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.saveDispenseRecord(record);
    return { success: true };
  } catch (error) {
    console.error('Error saving record:', error);
    throw error;
  }
});

// Update dispense record
ipcMain.handle('db:update-record', async (_event, recordId: string, updates: Partial<DispenseRecord>) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.updateDispenseRecord(recordId, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating record:', error);
    throw error;
  }
});

// Delete dispense record
ipcMain.handle('db:delete-record', async (_event, recordId: string) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.deleteDispenseRecord(recordId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
});

// Get all drugs
ipcMain.handle('db:get-drugs', async () => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    return await sqliteAdapter.getAllDrugs();
  } catch (error) {
    console.error('Error getting drugs:', error);
    throw error;
  }
});

// Save drugs (bulk)
ipcMain.handle('db:save-drugs', async (_event, drugs: Drug[]) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.saveDrugs(drugs);
    return { success: true };
  } catch (error) {
    console.error('Error saving drugs:', error);
    throw error;
  }
});

// Get dose regimens for drug
ipcMain.handle('db:get-regimens', async (_event, drugId: string) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    return await sqliteAdapter.getDoseRegimensForDrug(drugId);
  } catch (error) {
    console.error('Error getting regimens:', error);
    throw error;
  }
});

// Save dose regimens (bulk)
ipcMain.handle('db:save-regimens', async (_event, regimens: DoseRegimen[]) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.saveDoseRegimens(regimens);
    return { success: true };
  } catch (error) {
    console.error('Error saving regimens:', error);
    throw error;
  }
});

// Get all users
ipcMain.handle('db:get-users', async () => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    return await sqliteAdapter.getAllUsers();
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
});

// Save user
ipcMain.handle('db:save-user', async (_event, user: User) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.saveUser(user);
    return { success: true };
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
});

// Get sync queue items
ipcMain.handle('db:get-sync-queue', async () => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    return await sqliteAdapter.getPendingSyncItems();
  } catch (error) {
    console.error('Error getting sync queue:', error);
    throw error;
  }
});

// Save sync queue item
ipcMain.handle('db:save-sync-item', async (_event, item: SyncQueueItem) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.saveSyncQueueItem(item);
    return { success: true };
  } catch (error) {
    console.error('Error saving sync item:', error);
    throw error;
  }
});

// Update sync queue item
ipcMain.handle('db:update-sync-item', async (_event, itemId: string, updates: Partial<SyncQueueItem>) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.updateSyncQueueItem(itemId, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating sync item:', error);
    throw error;
  }
});

// Delete sync queue item
ipcMain.handle('db:delete-sync-item', async (_event, itemId: string) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.deleteSyncQueueItem(itemId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting sync item:', error);
    throw error;
  }
});

// Get last sync time
ipcMain.handle('db:get-last-sync-time', async () => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    return await sqliteAdapter.getLastSyncTime();
  } catch (error) {
    console.error('Error getting last sync time:', error);
    throw error;
  }
});

// Set last sync time
ipcMain.handle('db:set-last-sync-time', async (_event, time: number) => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.setLastSyncTime(time);
    return { success: true };
  } catch (error) {
    console.error('Error setting last sync time:', error);
    throw error;
  }
});

// Clear database
ipcMain.handle('db:clear', async () => {
  try {
    if (!sqliteAdapter) throw new Error('Database not initialized');
    await sqliteAdapter.clear();
    return { success: true };
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
});

export { mainWindow };
