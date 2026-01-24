import { Table } from 'dexie';
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
  Ticket,
  TicketNote,
} from '@/types';
import type { StorageAdapter } from './interface';
import { db, type SEMSDB } from '@/lib/db';

/**
 * IndexedDB implementation of StorageAdapter
 * Used for web browsers and Tauri app
 * Uses the shared SEMSDB instance from @/lib/db
 */
export class IndexedDBAdapter implements StorageAdapter {
  private db: SEMSDB;
  private userTable!: Table<User>;
  private roleTable!: Table<Role>;
  private drugTable!: Table<Drug>;
  private doseRegimenTable!: Table<DoseRegimen>;
  private dispenseRecordTable!: Table<DispenseRecord>;
  private syncQueueTable!: Table<SyncQueueItem>;
  private inventoryTable!: Table<InventoryItem>;
  private alertTable!: Table<AlertMessage>;
  private printTemplateTable!: Table<PrintTemplate>;
  private userProfileTable!: Table<UserProfile>;
  private printerSettingsTable!: Table<PrinterSettings>;
  private systemSettingsTable!: Table<SystemSettings>;
  private ticketTable!: Table<Ticket>;
  private ticketNoteTable!: Table<TicketNote>;
  private syncMetadataTable!: Table<{ key: string; value: unknown }>;

  constructor() {
    // Use the shared SEMSDB instance (already configured with v1 and v2 schemas)
    this.db = db;

    // Initialize table references
    this.userTable = this.db.table('users');
    this.roleTable = this.db.table('roles');
    this.drugTable = this.db.table('drugs');
    this.doseRegimenTable = this.db.table('doseRegimens');
    this.dispenseRecordTable = this.db.table('dispenseRecords');
    this.syncQueueTable = this.db.table('syncQueue');
    this.inventoryTable = this.db.table('inventory');
    this.alertTable = this.db.table('alerts');
    this.printTemplateTable = this.db.table('printTemplates');
    this.userProfileTable = this.db.table('userProfiles');
    this.printerSettingsTable = this.db.table('printerSettings');
    this.systemSettingsTable = this.db.table('systemSettings');
    this.ticketTable = this.db.table('tickets');
    this.ticketNoteTable = this.db.table('ticketNotes');
    this.syncMetadataTable = this.db.table('syncMetadata');
  }

  // ============ Users ============
  async getUser(id: string): Promise<User | undefined> {
    return this.userTable.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userTable.toArray();
  }

  async saveUser(user: User): Promise<void> {
    await this.userTable.put(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await this.userTable.update(id, updates);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userTable.delete(id);
  }

  // ============ Roles ============
  async getRole(id: string): Promise<Role | undefined> {
    return this.roleTable.get(id);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleTable.toArray();
  }

  async saveRole(role: Role): Promise<void> {
    await this.roleTable.put(role);
  }

  // ============ Drugs ============
  async getDrug(id: string): Promise<Drug | undefined> {
    return this.drugTable.get(id);
  }

  async getAllDrugs(): Promise<Drug[]> {
    return this.drugTable.toArray();
  }

  async saveDrug(drug: Drug): Promise<void> {
    await this.drugTable.put(drug);
  }

  async saveDrugs(drugs: Drug[]): Promise<void> {
    await this.drugTable.bulkPut(drugs);
  }

  async updateDrug(id: string, updates: Partial<Drug>): Promise<void> {
    await this.drugTable.update(id, updates);
  }

  // ============ Dose Regimens ============
  async getDoseRegimen(id: string): Promise<DoseRegimen | undefined> {
    return this.doseRegimenTable.get(id);
  }

  async getAllDoseRegimens(): Promise<DoseRegimen[]> {
    return this.doseRegimenTable.toArray();
  }

  async getDoseRegimensForDrug(drugId: string): Promise<DoseRegimen[]> {
    return this.doseRegimenTable.where('drugId').equals(drugId).toArray();
  }

  async saveDoseRegimen(regimen: DoseRegimen): Promise<void> {
    await this.doseRegimenTable.put(regimen);
  }

  async saveDoseRegimens(regimens: DoseRegimen[]): Promise<void> {
    await this.doseRegimenTable.bulkPut(regimens);
  }

  // ============ Dispense Records ============
  async getDispenseRecord(id: string): Promise<DispenseRecord | undefined> {
    return this.dispenseRecordTable.get(id);
  }

  async getAllDispenseRecords(): Promise<DispenseRecord[]> {
    return this.dispenseRecordTable.toArray();
  }

  async getDispenseRecordsByPharmacist(
    pharmacistId: string
  ): Promise<DispenseRecord[]> {
    return this.dispenseRecordTable
      .where('pharmacistId')
      .equals(pharmacistId)
      .toArray();
  }

  async getUnsyncedRecords(): Promise<DispenseRecord[]> {
    return this.dispenseRecordTable.filter((record: DispenseRecord) => !record.synced).toArray();
  }

  async saveDispenseRecord(record: DispenseRecord): Promise<void> {
    await this.dispenseRecordTable.put(record);
  }

  async updateDispenseRecord(
    id: string,
    updates: Partial<DispenseRecord>
  ): Promise<void> {
    await this.dispenseRecordTable.update(id, updates);
  }

  async deleteDispenseRecord(id: string): Promise<void> {
    await this.dispenseRecordTable.delete(id);
  }

  // ============ Sync Queue ============
  async getSyncQueueItem(id: string): Promise<SyncQueueItem | undefined> {
    return this.syncQueueTable.get(id);
  }

  async getAllSyncQueueItems(): Promise<SyncQueueItem[]> {
    return this.syncQueueTable.toArray();
  }

  async saveSyncQueueItem(item: SyncQueueItem): Promise<void> {
    await this.syncQueueTable.put(item);
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>
  ): Promise<void> {
    await this.syncQueueTable.update(id, updates);
  }

  async deleteSyncQueueItem(id: string): Promise<void> {
    await this.syncQueueTable.delete(id);
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return this.syncQueueTable.filter((item) => item.retries < 3).toArray();
  }

  // ============ Inventory ============
  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    return this.inventoryTable.get(id);
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return this.inventoryTable.toArray();
  }

  async saveInventoryItem(item: InventoryItem): Promise<void> {
    await this.inventoryTable.put(item);
  }

  async updateInventoryItem(
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<void> {
    await this.inventoryTable.update(id, updates);
  }

  // ============ Alerts ============
  async getAlert(id: string): Promise<AlertMessage | undefined> {
    return this.alertTable.get(id);
  }

  async getAllAlerts(): Promise<AlertMessage[]> {
    return this.alertTable.toArray();
  }

  async saveAlert(alert: AlertMessage): Promise<void> {
    await this.alertTable.put(alert);
  }

  async deleteAlert(id: string): Promise<void> {
    await this.alertTable.delete(id);
  }

  // ============ Print Templates ============
  async getPrintTemplate(id: string): Promise<PrintTemplate | undefined> {
    return this.printTemplateTable.get(id);
  }

  async getAllPrintTemplates(): Promise<PrintTemplate[]> {
    return this.printTemplateTable.toArray();
  }

  async getDefaultPrintTemplate(): Promise<PrintTemplate | undefined> {
    return this.printTemplateTable.filter((t: PrintTemplate) => t.isDefault).first();
  }

  async savePrintTemplate(template: PrintTemplate): Promise<void> {
    await this.printTemplateTable.put(template);
  }

  async updatePrintTemplate(
    id: string,
    updates: Partial<PrintTemplate>
  ): Promise<void> {
    await this.printTemplateTable.update(id, updates);
  }

  // ============ User Profiles ============
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    return this.userProfileTable.get(id);
  }

  async getAllUserProfiles(): Promise<UserProfile[]> {
    return this.userProfileTable.toArray();
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.userProfileTable.put(profile);
  }

  async updateUserProfile(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    await this.userProfileTable.update(id, updates);
  }

  // ============ Printer Settings ============
  async getPrinterSettings(id: string): Promise<PrinterSettings | undefined> {
    return this.printerSettingsTable.get(id);
  }

  async getAllPrinterSettings(): Promise<PrinterSettings[]> {
    return this.printerSettingsTable.toArray();
  }

  async getDefaultPrinterSettings(): Promise<PrinterSettings | undefined> {
    return this.printerSettingsTable.filter((s: PrinterSettings) => s.isDefault).first();
  }

  async savePrinterSettings(settings: PrinterSettings): Promise<void> {
    await this.printerSettingsTable.put(settings);
  }

  async updatePrinterSettings(
    id: string,
    updates: Partial<PrinterSettings>
  ): Promise<void> {
    await this.printerSettingsTable.update(id, updates);
  }

  // ============ System Settings ============
  async getSystemSettings(id: string): Promise<SystemSettings | undefined> {
    return this.systemSettingsTable.get(id);
  }

  async getAllSystemSettings(): Promise<SystemSettings[]> {
    return this.systemSettingsTable.toArray();
  }

  async saveSystemSettings(settings: SystemSettings): Promise<void> {
    await this.systemSettingsTable.put(settings);
  }

  async updateSystemSettings(
    id: string,
    updates: Partial<SystemSettings>
  ): Promise<void> {
    await this.systemSettingsTable.update(id, updates);
  }

  // ============ Sync Metadata ============
  async getSyncMetadata(key: string): Promise<unknown> {
    const item = await this.syncMetadataTable.get(key);
    return item?.value;
  }

  async setSyncMetadata(key: string, value: unknown): Promise<void> {
    await this.syncMetadataTable.put({ key, value });
  }

  async getLastSyncTime(): Promise<number | null> {
    const value = await this.getSyncMetadata('lastSyncTime');
    return (value as number) || null;
  }

  async setLastSyncTime(time: number): Promise<void> {
    await this.setSyncMetadata('lastSyncTime', time);
  }

  // ============ Tickets ============
  async getTicket(id: string): Promise<Ticket | undefined> {
    return await this.ticketTable.get(id);
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return await this.ticketTable.where('userId').equals(userId).toArray();
  }

  async getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined> {
    return await this.ticketTable.where('ticketNumber').equals(ticketNumber).first();
  }

  async getUnsyncedTickets(): Promise<Ticket[]> {
    return await this.ticketTable.where('synced').equals(0).toArray();
  }

  async saveTicket(ticket: Ticket): Promise<void> {
    await this.ticketTable.put(ticket);
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
    const ticket = await this.ticketTable.get(id);
    if (!ticket) throw new Error(`Ticket ${id} not found`);
    await this.ticketTable.update(id, { ...updates, updatedAt: Date.now() });
  }

  async deleteTicket(id: string): Promise<void> {
    await this.ticketTable.delete(id);
  }

  // ============ Ticket Notes ============
  async getTicketNote(id: string): Promise<TicketNote | undefined> {
    return await this.ticketNoteTable.get(id);
  }

  async getTicketNotes(ticketId: string): Promise<TicketNote[]> {
    return await this.ticketNoteTable.where('ticketId').equals(ticketId).toArray();
  }

  async getUnsyncedTicketNotes(): Promise<TicketNote[]> {
    return await this.ticketNoteTable.where('synced').equals(0).toArray();
  }

  async saveTicketNote(note: TicketNote): Promise<void> {
    await this.ticketNoteTable.put(note);
  }

  async updateTicketNote(id: string, updates: Partial<TicketNote>): Promise<void> {
    const note = await this.ticketNoteTable.get(id);
    if (!note) throw new Error(`Ticket note ${id} not found`);
    await this.ticketNoteTable.update(id, updates);
  }

  async deleteTicketNote(id: string): Promise<void> {
    await this.ticketNoteTable.delete(id);
  }

  // ============ Utility ============
  async clear(): Promise<void> {
    await this.db.delete();
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}
