import type { StorageAdapter } from './interface';
import { IndexedDBAdapter } from './indexeddb-adapter';

// Global storage instance
let storageInstance: StorageAdapter | null = null;

/**
 * Get the current storage adapter instance
 * Returns IndexedDBAdapter by default on web/Tauri (uses shared SEMSDB instance)
 * Can be replaced with SQLiteAdapter on Electron
 */
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    initializeStorage();
  }
  return storageInstance!;
}

/**
 * Initialize the storage adapter
 * By default, uses IndexedDBAdapter which uses the shared SEMSDB instance
 * Call setStorage() to use a different adapter
 */
export function initializeStorage(adapter?: StorageAdapter): void {
  if (adapter) {
    storageInstance = adapter;
  } else {
    storageInstance = new IndexedDBAdapter();
  }
}

/**
 * Set a custom storage adapter
 * Useful for switching between implementations
 */
export function setStorage(adapter: StorageAdapter): void {
  storageInstance = adapter;
}

/**
 * Reset storage (for testing or cleanup)
 */
export function resetStorage(): void {
  storageInstance = null;
}

// Convenience exports for common operations
export async function getUsers() {
  return getStorage().getAllUsers();
}

export async function getDispenseRecords() {
  return getStorage().getAllDispenseRecords();
}

export async function getDrugs() {
  return getStorage().getAllDrugs();
}

export async function getUnsyncedRecords() {
  return getStorage().getUnsyncedRecords();
}

export async function getPendingSyncItems() {
  return getStorage().getPendingSyncItems();
}

export async function getLastSyncTime() {
  return getStorage().getLastSyncTime();
}

export async function setLastSyncTime(time: number) {
  return getStorage().setLastSyncTime(time);
}

// Re-export adapter classes for direct usage if needed
export { IndexedDBAdapter } from './indexeddb-adapter';
export type { StorageAdapter } from './interface';
