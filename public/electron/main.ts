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
    : `file://${path.join(__dirname, '../renderer/main_window/index.html')}`;

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
 * IPC Handlers - Minimal implementation
 * Database operations are handled by IndexedDB in the renderer process
 */

// Health check
ipcMain.handle('app:health', async () => {
  return { status: 'ok', version: '0.1.0' };
});

// Get app info
ipcMain.handle('app:get-info', async () => {
  return {
    name: 'SEMS',
    version: '0.1.0',
    platform: process.platform,
    nodeVersion: process.version,
  };
});

export { mainWindow };
