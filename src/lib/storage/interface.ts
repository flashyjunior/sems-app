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

/**
 * StorageAdapter Interface
 * 
 * Defines all database operations that can work with any backend:
 * - IndexedDB (web)
 * - SQLite (Electron desktop)
 * - Future: Other databases
 */
export interface StorageAdapter {
  // ============ Users ============
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  saveUser(user: User): Promise<void>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // ============ Roles ============
  getRole(id: string): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  saveRole(role: Role): Promise<void>;

  // ============ Drugs ============
  getDrug(id: string): Promise<Drug | undefined>;
  getAllDrugs(): Promise<Drug[]>;
  saveDrug(drug: Drug): Promise<void>;
  saveDrugs(drugs: Drug[]): Promise<void>;
  updateDrug(id: string, updates: Partial<Drug>): Promise<void>;

  // ============ Dose Regimens ============
  getDoseRegimen(id: string): Promise<DoseRegimen | undefined>;
  getAllDoseRegimens(): Promise<DoseRegimen[]>;
  getDoseRegimensForDrug(drugId: string): Promise<DoseRegimen[]>;
  saveDoseRegimen(regimen: DoseRegimen): Promise<void>;
  saveDoseRegimens(regimens: DoseRegimen[]): Promise<void>;

  // ============ Dispense Records ============
  getDispenseRecord(id: string): Promise<DispenseRecord | undefined>;
  getAllDispenseRecords(): Promise<DispenseRecord[]>;
  getDispenseRecordsByPharmacist(
    pharmacistId: string
  ): Promise<DispenseRecord[]>;
  getUnsyncedRecords(): Promise<DispenseRecord[]>;
  saveDispenseRecord(record: DispenseRecord): Promise<void>;
  updateDispenseRecord(
    id: string,
    updates: Partial<DispenseRecord>
  ): Promise<void>;
  deleteDispenseRecord(id: string): Promise<void>;

  // ============ Sync Queue ============
  getSyncQueueItem(id: string): Promise<SyncQueueItem | undefined>;
  getAllSyncQueueItems(): Promise<SyncQueueItem[]>;
  saveSyncQueueItem(item: SyncQueueItem): Promise<void>;
  updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>
  ): Promise<void>;
  deleteSyncQueueItem(id: string): Promise<void>;
  getPendingSyncItems(): Promise<SyncQueueItem[]>;

  // ============ Inventory ============
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  saveInventoryItem(item: InventoryItem): Promise<void>;
  updateInventoryItem(
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<void>;

  // ============ Alerts ============
  getAlert(id: string): Promise<AlertMessage | undefined>;
  getAllAlerts(): Promise<AlertMessage[]>;
  saveAlert(alert: AlertMessage): Promise<void>;
  deleteAlert(id: string): Promise<void>;

  // ============ Print Templates ============
  getPrintTemplate(id: string): Promise<PrintTemplate | undefined>;
  getAllPrintTemplates(): Promise<PrintTemplate[]>;
  getDefaultPrintTemplate(): Promise<PrintTemplate | undefined>;
  savePrintTemplate(template: PrintTemplate): Promise<void>;
  updatePrintTemplate(
    id: string,
    updates: Partial<PrintTemplate>
  ): Promise<void>;

  // ============ User Profiles ============
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  getAllUserProfiles(): Promise<UserProfile[]>;
  saveUserProfile(profile: UserProfile): Promise<void>;
  updateUserProfile(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<void>;

  // ============ Printer Settings ============
  getPrinterSettings(id: string): Promise<PrinterSettings | undefined>;
  getAllPrinterSettings(): Promise<PrinterSettings[]>;
  getDefaultPrinterSettings(): Promise<PrinterSettings | undefined>;
  savePrinterSettings(settings: PrinterSettings): Promise<void>;
  updatePrinterSettings(
    id: string,
    updates: Partial<PrinterSettings>
  ): Promise<void>;

  // ============ System Settings ============
  getSystemSettings(id: string): Promise<SystemSettings | undefined>;
  getAllSystemSettings(): Promise<SystemSettings[]>;
  saveSystemSettings(settings: SystemSettings): Promise<void>;
  updateSystemSettings(
    id: string,
    updates: Partial<SystemSettings>
  ): Promise<void>;

  // ============ Sync Metadata ============
  getSyncMetadata(key: string): Promise<unknown>;
  setSyncMetadata(key: string, value: unknown): Promise<void>;
  getLastSyncTime(): Promise<number | null>;
  setLastSyncTime(time: number): Promise<void>;

  // ============ Tickets ============
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketsByUser(userId: string): Promise<Ticket[]>;
  getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined>;
  getUnsyncedTickets(): Promise<Ticket[]>;
  saveTicket(ticket: Ticket): Promise<void>;
  updateTicket(id: string, updates: Partial<Ticket>): Promise<void>;
  deleteTicket(id: string): Promise<void>;

  // ============ Ticket Notes ============
  getTicketNote(id: string): Promise<TicketNote | undefined>;
  getTicketNotes(ticketId: string): Promise<TicketNote[]>;
  getUnsyncedTicketNotes(): Promise<TicketNote[]>;
  saveTicketNote(note: TicketNote): Promise<void>;
  updateTicketNote(id: string, updates: Partial<TicketNote>): Promise<void>;
  deleteTicketNote(id: string): Promise<void>;

  // ============ Utility ============
  clear(): Promise<void>;
  close(): Promise<void>;
}
