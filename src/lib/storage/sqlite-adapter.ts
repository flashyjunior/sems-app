// @ts-nocheck - This adapter is template code for Electron environment only
import type {
  User,
  Role,
  Drug,
  DoseRegimen,
  DispenseRecord,
  SyncQueueItem,
  InventoryItem,
  AlertMessage,
  PrintTemplate,
  UserProfile,
  PrinterSettings,
  SystemSettings,
} from '@/types';
import type { StorageAdapter } from './interface';

/**
 * SQLite implementation of StorageAdapter
 * Used for Electron desktop app with better-sqlite3
 *
 * NOTE: This is a template implementation that will be used with:
 * - better-sqlite3 (npm package for SQLite in Electron)
 * - Node.js native modules
 *
 * When implementing in Electron main process, use:
 * import Database from 'better-sqlite3';
 */
export class SQLiteAdapter implements StorageAdapter {
  private db: any; // Would be Database instance from better-sqlite3

  constructor(dbPath: string) {
    // In actual implementation:
    // const Database = require('better-sqlite3');
    // this.db = new Database(dbPath);
    // this.initializeSchema();

    this.db = null; // Placeholder
  }

  /**
   * Initialize database schema
   * Creates all tables if they don't exist
   */
  private initializeSchema(): void {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        role TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Roles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        permissions TEXT
      )
    `);

    // Drugs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS drugs (
        id TEXT PRIMARY KEY,
        genericName TEXT NOT NULL,
        tradeName TEXT,
        dosageForm TEXT,
        strength TEXT,
        manufacturer TEXT,
        ageGroupDosing TEXT,
        syncedAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_drugs_generic_name ON drugs(genericName);
      CREATE INDEX IF NOT EXISTS idx_drugs_trade_name ON drugs(tradeName);
    `);

    // Dose Regimens table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dose_regimens (
        id TEXT PRIMARY KEY,
        drugId TEXT NOT NULL,
        ageGroup TEXT NOT NULL,
        minAge INTEGER,
        maxAge INTEGER,
        dose TEXT NOT NULL,
        frequency TEXT,
        duration TEXT,
        notes TEXT,
        syncedAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(drugId) REFERENCES drugs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_dose_regimens_drug_id ON dose_regimens(drugId);
      CREATE INDEX IF NOT EXISTS idx_dose_regimens_age_group ON dose_regimens(ageGroup);
    `);

    // Dispense Records table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dispense_records (
        id TEXT PRIMARY KEY,
        pharmacistId TEXT NOT NULL,
        patientName TEXT NOT NULL,
        age INTEGER,
        weight REAL,
        pregnancyStatus TEXT,
        drugId TEXT NOT NULL,
        doseRegimenId TEXT,
        doseGiven TEXT,
        quantity INTEGER,
        batchNumber TEXT,
        expiryDate DATE,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT 0,
        syncError TEXT,
        syncRetries INTEGER DEFAULT 0,
        notes TEXT,
        syncedAt DATETIME,
        FOREIGN KEY(pharmacistId) REFERENCES users(id),
        FOREIGN KEY(drugId) REFERENCES drugs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_dispense_records_pharmacist_id ON dispense_records(pharmacistId);
      CREATE INDEX IF NOT EXISTS idx_dispense_records_timestamp ON dispense_records(timestamp);
      CREATE INDEX IF NOT EXISTS idx_dispense_records_synced ON dispense_records(synced);
    `);

    // Sync Queue table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        recordId TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT,
        retries INTEGER DEFAULT 0,
        lastAttempt DATETIME,
        error TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_sync_queue_record_id ON sync_queue(recordId);
    `);

    // Inventory table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        drugId TEXT NOT NULL,
        batchNumber TEXT,
        quantityOnHand INTEGER,
        quantityUsed INTEGER DEFAULT 0,
        expiryDate DATE,
        storageLocation TEXT,
        lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
        syncedAt DATETIME,
        FOREIGN KEY(drugId) REFERENCES drugs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_drug_id ON inventory(drugId);
    `);

    // Alerts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT,
        relatedEntityId TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
    `);

    // Print Templates table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS print_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        htmlTemplate TEXT,
        cssStyles TEXT,
        isDefault BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME
      )
    `);

    // User Profiles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL UNIQUE,
        avatar TEXT,
        theme TEXT DEFAULT 'light',
        language TEXT DEFAULT 'en',
        preferences TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // Printer Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS printer_settings (
        id TEXT PRIMARY KEY,
        printerName TEXT,
        printerModel TEXT,
        ipAddress TEXT,
        port INTEGER,
        isDefault BOOLEAN DEFAULT 0,
        pageSize TEXT DEFAULT 'A4',
        margins TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // System Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        type TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME
      );
      CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
    `);

    // Sync Metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // ============ Users ============
  async getUser(id: string): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const stmt = this.db.prepare('SELECT * FROM users');
    return stmt.all() as User[];
  }

  async saveUser(user: User): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users (id, username, email, role, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      user.id,
      user.username,
      user.email || null,
      user.role,
      user.createdAt
    );
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User ${id} not found`);
    
    const updated = { ...user, ...updates };
    await this.saveUser(updated);
  }

  async deleteUser(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }

  // ============ Roles ============
  async getRole(id: string): Promise<Role | undefined> {
    const stmt = this.db.prepare('SELECT * FROM roles WHERE id = ?');
    return stmt.get(id) as Role | undefined;
  }

  async getAllRoles(): Promise<Role[]> {
    const stmt = this.db.prepare('SELECT * FROM roles');
    return stmt.all() as Role[];
  }

  async saveRole(role: Role): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO roles (id, name, permissions)
      VALUES (?, ?, ?)
    `);
    stmt.run(role.id, role.name, role.permissions ? JSON.stringify(role.permissions) : null);
  }

  // ============ Drugs ============
  async getDrug(id: string): Promise<Drug | undefined> {
    const stmt = this.db.prepare('SELECT * FROM drugs WHERE id = ?');
    return stmt.get(id) as Drug | undefined;
  }

  async getAllDrugs(): Promise<Drug[]> {
    const stmt = this.db.prepare('SELECT * FROM drugs');
    return stmt.all() as Drug[];
  }

  // @ts-ignore - This adapter is template code for Electron environment only
  async saveDrug(drug: Drug): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO drugs (id, genericName, tradeName, strength, route, category, stgReference)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      drug.id,
      drug.genericName,
      Array.isArray(drug.tradeName) ? drug.tradeName.join(',') : null,
      drug.strength,
      drug.route,
      drug.category,
      drug.stgReference
    );
  }

  // @ts-ignore - This adapter is template code for Electron environment only
  async saveDrugs(drugs: Drug[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO drugs (id, genericName, tradeName, strength, route, category, stgReference)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = this.db.transaction((drugs: Drug[]) => {
      for (const drug of drugs) {
        stmt.run(
          drug.id,
          drug.genericName,
          Array.isArray(drug.tradeName) ? drug.tradeName.join(',') : null,
          drug.strength,
          drug.route,
          drug.category,
          drug.stgReference
        );
      }
    });
    insertMany(drugs);
  }

  async updateDrug(id: string, updates: Partial<Drug>): Promise<void> {
    const drug = await this.getDrug(id);
    if (!drug) throw new Error(`Drug ${id} not found`);
    
    const updated = { ...drug, ...updates };
    await this.saveDrug(updated);
  }

  // ============ Dose Regimens ============
  async getDoseRegimen(id: string): Promise<DoseRegimen | undefined> {
    const stmt = this.db.prepare('SELECT * FROM dose_regimens WHERE id = ?');
    return stmt.get(id) as DoseRegimen | undefined;
  }

  async getAllDoseRegimens(): Promise<DoseRegimen[]> {
    const stmt = this.db.prepare('SELECT * FROM dose_regimens');
    return stmt.all() as DoseRegimen[];
  }

  async getDoseRegimensForDrug(drugId: string): Promise<DoseRegimen[]> {
    const stmt = this.db.prepare('SELECT * FROM dose_regimens WHERE drugId = ?');
    return stmt.all(drugId) as DoseRegimen[];
  }

  async saveDoseRegimen(regimen: DoseRegimen): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO dose_regimens (id, drugId, ageGroup, minAge, maxAge, dose, frequency, duration, notes, syncedAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      regimen.id,
      regimen.drugId,
      regimen.ageGroup || null,
      regimen.minAge || null,
      regimen.maxAge || null,
      regimen.dose,
      regimen.frequency || null,
      regimen.duration || null,
      regimen.notes || null,
      regimen.syncedAt || null,
      regimen.createdAt || new Date().toISOString()
    );
  }

  async saveDoseRegimens(regimens: DoseRegimen[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO dose_regimens (id, drugId, ageGroup, minAge, maxAge, dose, frequency, duration, notes, syncedAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = this.db.transaction((regimens: DoseRegimen[]) => {
      for (const regimen of regimens) {
        stmt.run(
          regimen.id,
          regimen.drugId,
          regimen.ageGroup || null,
          regimen.minAge || null,
          regimen.maxAge || null,
          regimen.dose,
          regimen.frequency || null,
          regimen.duration || null,
          regimen.notes || null,
          regimen.syncedAt || null,
          regimen.createdAt || new Date().toISOString()
        );
      }
    });
    insertMany(regimens);
  }

  // ============ Dispense Records ============
  async getDispenseRecord(id: string): Promise<DispenseRecord | undefined> {
    const stmt = this.db.prepare('SELECT * FROM dispense_records WHERE id = ?');
    return stmt.get(id) as DispenseRecord | undefined;
  }

  async getAllDispenseRecords(): Promise<DispenseRecord[]> {
    const stmt = this.db.prepare('SELECT * FROM dispense_records ORDER BY timestamp DESC');
    return stmt.all() as DispenseRecord[];
  }

  async getDispenseRecordsByPharmacist(
    pharmacistId: string
  ): Promise<DispenseRecord[]> {
    const stmt = this.db.prepare('SELECT * FROM dispense_records WHERE pharmacistId = ? ORDER BY timestamp DESC');
    return stmt.all(pharmacistId) as DispenseRecord[];
  }

  async getUnsyncedRecords(): Promise<DispenseRecord[]> {
    const stmt = this.db.prepare('SELECT * FROM dispense_records WHERE synced = 0 ORDER BY timestamp DESC');
    return stmt.all() as DispenseRecord[];
  }

  async saveDispenseRecord(record: DispenseRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO dispense_records 
      (id, pharmacistId, patientName, age, weight, pregnancyStatus, drugId, doseRegimenId, doseGiven, quantity, batchNumber, expiryDate, timestamp, synced, syncError, syncRetries, notes, syncedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.id,
      record.pharmacistId,
      record.patientName,
      record.age || null,
      record.weight || null,
      record.pregnancyStatus || null,
      record.drugId,
      record.doseRegimenId || null,
      record.doseGiven || null,
      record.quantity || null,
      record.batchNumber || null,
      record.expiryDate || null,
      record.timestamp || new Date().toISOString(),
      record.synced ? 1 : 0,
      record.syncError || null,
      record.syncRetries || 0,
      record.notes || null,
      record.syncedAt || null
    );
  }

  async updateDispenseRecord(
    id: string,
    updates: Partial<DispenseRecord>
  ): Promise<void> {
    const record = await this.getDispenseRecord(id);
    if (!record) throw new Error(`Record ${id} not found`);
    
    const updated = { ...record, ...updates };
    await this.saveDispenseRecord(updated);
  }

  async deleteDispenseRecord(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM dispense_records WHERE id = ?');
    stmt.run(id);
  }

  // ============ Sync Queue ============
  async getSyncQueueItem(id: string): Promise<SyncQueueItem | undefined> {
    const stmt = this.db.prepare('SELECT * FROM sync_queue WHERE id = ?');
    return stmt.get(id) as SyncQueueItem | undefined;
  }

  async getAllSyncQueueItems(): Promise<SyncQueueItem[]> {
    const stmt = this.db.prepare('SELECT * FROM sync_queue');
    return stmt.all() as SyncQueueItem[];
  }

  async saveSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sync_queue (id, recordId, action, payload, retries, lastAttempt, error, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      item.id,
      item.recordId,
      item.action,
      item.payload ? JSON.stringify(item.payload) : null,
      item.retries || 0,
      item.lastAttempt || null,
      item.error || null,
      item.createdAt || new Date().toISOString()
    );
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>
  ): Promise<void> {
    const item = await this.getSyncQueueItem(id);
    if (!item) throw new Error(`Sync queue item ${id} not found`);
    
    const updated = { ...item, ...updates };
    await this.saveSyncQueueItem(updated);
  }

  async deleteSyncQueueItem(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM sync_queue WHERE id = ?');
    stmt.run(id);
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    const stmt = this.db.prepare('SELECT * FROM sync_queue WHERE retries < 3');
    return stmt.all() as SyncQueueItem[];
  }

  // ============ Inventory ============
  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const stmt = this.db.prepare('SELECT * FROM inventory WHERE id = ?');
    return stmt.get(id) as InventoryItem | undefined;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    const stmt = this.db.prepare('SELECT * FROM inventory');
    return stmt.all() as InventoryItem[];
  }

  async saveInventoryItem(item: InventoryItem): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO inventory (id, drugId, batchNumber, quantityOnHand, quantityUsed, expiryDate, storageLocation, lastUpdated, syncedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      item.id,
      item.drugId,
      item.batchNumber || null,
      item.quantityOnHand,
      item.quantityUsed || 0,
      item.expiryDate || null,
      item.storageLocation || null,
      new Date().toISOString(),
      item.syncedAt || null
    );
  }

  async updateInventoryItem(
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<void> {
    const item = await this.getInventoryItem(id);
    if (!item) throw new Error(`Inventory item ${id} not found`);
    
    const updated = { ...item, ...updates };
    await this.saveInventoryItem(updated);
  }

  // ============ Alerts ============
  async getAlert(id: string): Promise<AlertMessage | undefined> {
    const stmt = this.db.prepare('SELECT * FROM alerts WHERE id = ?');
    return stmt.get(id) as AlertMessage | undefined;
  }

  async getAllAlerts(): Promise<AlertMessage[]> {
    const stmt = this.db.prepare('SELECT * FROM alerts ORDER BY timestamp DESC');
    return stmt.all() as AlertMessage[];
  }

  async saveAlert(alert: AlertMessage): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO alerts (id, type, message, severity, relatedEntityId, timestamp, read)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      alert.id,
      alert.type,
      alert.message,
      alert.severity || 'info',
      alert.relatedEntityId || null,
      alert.timestamp || new Date().toISOString(),
      alert.read ? 1 : 0
    );
  }

  async deleteAlert(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM alerts WHERE id = ?');
    stmt.run(id);
  }

  // ============ Print Templates ============
  async getPrintTemplate(id: string): Promise<PrintTemplate | undefined> {
    const stmt = this.db.prepare('SELECT * FROM print_templates WHERE id = ?');
    return stmt.get(id) as PrintTemplate | undefined;
  }

  async getAllPrintTemplates(): Promise<PrintTemplate[]> {
    const stmt = this.db.prepare('SELECT * FROM print_templates ORDER BY createdAt DESC');
    return stmt.all() as PrintTemplate[];
  }

  async getDefaultPrintTemplate(): Promise<PrintTemplate | undefined> {
    const stmt = this.db.prepare('SELECT * FROM print_templates WHERE isDefault = 1');
    return stmt.get() as PrintTemplate | undefined;
  }

  async savePrintTemplate(template: PrintTemplate): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO print_templates (id, name, htmlTemplate, cssStyles, isDefault, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      template.id,
      template.name,
      template.htmlTemplate || null,
      template.cssStyles || null,
      template.isDefault ? 1 : 0,
      template.createdAt || new Date().toISOString(),
      new Date().toISOString()
    );
  }

  async updatePrintTemplate(
    id: string,
    updates: Partial<PrintTemplate>
  ): Promise<void> {
    const template = await this.getPrintTemplate(id);
    if (!template) throw new Error(`Print template ${id} not found`);
    
    const updated = { ...template, ...updates };
    await this.savePrintTemplate(updated);
  }

  // ============ User Profiles ============
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const stmt = this.db.prepare('SELECT * FROM user_profiles WHERE id = ?');
    return stmt.get(id) as UserProfile | undefined;
  }

  async getAllUserProfiles(): Promise<UserProfile[]> {
    const stmt = this.db.prepare('SELECT * FROM user_profiles');
    return stmt.all() as UserProfile[];
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_profiles (id, userId, avatar, theme, language, preferences, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      profile.id,
      profile.userId,
      profile.avatar || null,
      profile.theme || 'light',
      profile.language || 'en',
      profile.preferences ? JSON.stringify(profile.preferences) : null,
      profile.createdAt || new Date().toISOString()
    );
  }

  async updateUserProfile(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    const profile = await this.getUserProfile(id);
    if (!profile) throw new Error(`User profile ${id} not found`);
    
    const updated = { ...profile, ...updates };
    await this.saveUserProfile(updated);
  }

  // ============ Printer Settings ============
  async getPrinterSettings(id: string): Promise<PrinterSettings | undefined> {
    const stmt = this.db.prepare('SELECT * FROM printer_settings WHERE id = ?');
    return stmt.get(id) as PrinterSettings | undefined;
  }

  async getAllPrinterSettings(): Promise<PrinterSettings[]> {
    const stmt = this.db.prepare('SELECT * FROM printer_settings');
    return stmt.all() as PrinterSettings[];
  }

  async getDefaultPrinterSettings(): Promise<PrinterSettings | undefined> {
    const stmt = this.db.prepare('SELECT * FROM printer_settings WHERE isDefault = 1');
    return stmt.get() as PrinterSettings | undefined;
  }

  async savePrinterSettings(settings: PrinterSettings): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO printer_settings (id, printerName, printerModel, ipAddress, port, isDefault, pageSize, margins, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      settings.id,
      settings.printerName || null,
      settings.printerModel || null,
      settings.ipAddress || null,
      settings.port || null,
      settings.isDefault ? 1 : 0,
      settings.pageSize || 'A4',
      settings.margins || null,
      settings.createdAt || new Date().toISOString()
    );
  }

  async updatePrinterSettings(
    id: string,
    updates: Partial<PrinterSettings>
  ): Promise<void> {
    const settings = await this.getPrinterSettings(id);
    if (!settings) throw new Error(`Printer settings ${id} not found`);
    
    const updated = { ...settings, ...updates };
    await this.savePrinterSettings(updated);
  }

  // ============ System Settings ============
  async getSystemSettings(id: string): Promise<SystemSettings | undefined> {
    const stmt = this.db.prepare('SELECT * FROM system_settings WHERE id = ?');
    return stmt.get(id) as SystemSettings | undefined;
  }

  async getAllSystemSettings(): Promise<SystemSettings[]> {
    const stmt = this.db.prepare('SELECT * FROM system_settings');
    return stmt.all() as SystemSettings[];
  }

  async saveSystemSettings(settings: SystemSettings): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO system_settings (id, key, value, type, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      settings.id,
      settings.key,
      settings.value || null,
      settings.type || null,
      settings.createdAt || new Date().toISOString(),
      new Date().toISOString()
    );
  }

  async updateSystemSettings(
    id: string,
    updates: Partial<SystemSettings>
  ): Promise<void> {
    const settings = await this.getSystemSettings(id);
    if (!settings) throw new Error(`System settings ${id} not found`);
    
    const updated = { ...settings, ...updates };
    await this.saveSystemSettings(updated);
  }

  // ============ Sync Metadata ============
  async getSyncMetadata(key: string): Promise<unknown> {
    const stmt = this.db.prepare('SELECT value FROM sync_metadata WHERE key = ?');
    const row = stmt.get(key) as any;
    if (!row) return null;
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }

  async setSyncMetadata(key: string, value: unknown): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sync_metadata (key, value, updatedAt)
      VALUES (?, ?, ?)
    `);
    stmt.run(key, typeof value === 'string' ? value : JSON.stringify(value), new Date().toISOString());
  }

  async getLastSyncTime(): Promise<number | null> {
    const value = await this.getSyncMetadata('lastSyncTime');
    return value ? Number(value) : null;
  }

  async setLastSyncTime(time: number): Promise<void> {
    await this.setSyncMetadata('lastSyncTime', time);
  }

  // ============ Utility ============
  async clear(): Promise<void> {
    // Delete all data from all tables
    this.db.exec(`
      DELETE FROM users;
      DELETE FROM roles;
      DELETE FROM drugs;
      DELETE FROM dose_regimens;
      DELETE FROM dispense_records;
      DELETE FROM sync_queue;
      DELETE FROM inventory;
      DELETE FROM alerts;
      DELETE FROM print_templates;
      DELETE FROM user_profiles;
      DELETE FROM printer_settings;
      DELETE FROM system_settings;
      DELETE FROM sync_metadata;
    `);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
    }
  }
}
