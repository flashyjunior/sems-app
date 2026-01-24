import Dexie, { Table } from 'dexie';
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
  TempDrug,
  TempDrugRegimen,
} from '@/types';

export class SEMSDB extends Dexie {
  // Tables
  users!: Table<User>;
  roles!: Table<Role>;
  drugs!: Table<Drug>;
  doseRegimens!: Table<DoseRegimen>;
  dispenseRecords!: Table<DispenseRecord>;
  syncQueue!: Table<SyncQueueItem>;
  inventory!: Table<InventoryItem>;
  alerts!: Table<AlertMessage>;
  syncMetadata!: Table<{ key: string; value: unknown }>;
  printTemplates!: Table<PrintTemplate>;
  userProfiles!: Table<UserProfile>;
  printerSettings!: Table<PrinterSettings>;
  systemSettings!: Table<SystemSettings>;
  tickets!: Table<Ticket>;
  ticketNotes!: Table<TicketNote>;
  tempDrugs!: Table<TempDrug>;
  tempDrugRegimens!: Table<TempDrugRegimen>;

  constructor() {
    super('SEMSDB');
    this.version(1).stores({
      users: 'id, username',
      roles: 'id, name',
      drugs: 'id, genericName, tradeName',
      doseRegimens: 'id, drugId, ageGroup',
      dispenseRecords: 'id, pharmacistId, timestamp, synced',
      syncQueue: 'id, record.id',
      inventory: 'id, drugId, expiryDate',
      alerts: 'id, timestamp',
      syncMetadata: 'key',
      printTemplates: 'id, isDefault, createdAt',
      userProfiles: 'id, userId',
      printerSettings: 'id, isDefault',
      systemSettings: 'id',
    });

    // Version 2: Add ticket tables
    this.version(2)
      .stores({
        users: 'id, username',
        roles: 'id, name',
        drugs: 'id, genericName, tradeName',
        doseRegimens: 'id, drugId, ageGroup',
        dispenseRecords: 'id, pharmacistId, timestamp, synced',
        syncQueue: 'id, record.id',
        inventory: 'id, drugId, expiryDate',
        alerts: 'id, timestamp',
        syncMetadata: 'key',
        printTemplates: 'id, isDefault, createdAt',
        userProfiles: 'id, userId',
        printerSettings: 'id, isDefault',
        systemSettings: 'id',
        tickets: 'id, ticketNumber, userId, synced',
        ticketNotes: 'id, ticketId, synced',
      })
      .upgrade(async (tx) => {
        // Migration logic: tickets and ticketNotes tables will be created automatically
        console.log('Database upgraded to version 2 with ticket tables');
      });

    // Version 3: Add temporary drug tables for admin approval workflow
    this.version(3)
      .stores({
        users: 'id, username',
        roles: 'id, name',
        drugs: 'id, genericName, tradeName',
        doseRegimens: 'id, drugId, ageGroup',
        dispenseRecords: 'id, pharmacistId, timestamp, synced',
        syncQueue: 'id, record.id',
        inventory: 'id, drugId, expiryDate',
        alerts: 'id, timestamp',
        syncMetadata: 'key',
        printTemplates: 'id, isDefault, createdAt',
        userProfiles: 'id, userId',
        printerSettings: 'id, isDefault',
        systemSettings: 'id',
        tickets: 'id, ticketNumber, userId, synced',
        ticketNotes: 'id, ticketId, synced',
        tempDrugs: 'id, genericName, status, createdAt',
        tempDrugRegimens: 'id, tempDrugId, status, createdAt',
      })
      .upgrade(async (tx) => {
        // Migration logic: temp tables will be created automatically
        console.log('Database upgraded to version 3 with temporary drug tables');
      });
  }
}

export const db = new SEMSDB();

// Helper functions for database operations
export async function getOrCreateCurrentSession(userId: string) {
  const existing = await db.users.get(userId);
  if (existing) return existing;

  const user: User = {
    id: userId,
    username: userId,
    role: 'pharmacist',
    createdAt: Date.now(),
  };

  await db.users.add(user);
  return user;
}

export async function addDispenseRecord(record: DispenseRecord) {
  console.log('addDispenseRecord called with:', { 
    id: record.id, 
    synced: record.synced, 
    patientName: record.patientName 
  });
  await db.dispenseRecords.add(record);
  await db.syncQueue.add({
    id: `sync-${record.id}`,
    record,
    retries: 0,
  });
  console.log('Record added to IndexDB with synced:', record.synced);
}

export async function getPendingSyncRecords() {
  return db.syncQueue
    .filter((item) => item.retries < 3)
    .toArray();
}

export async function markRecordSynced(recordId: string) {
  console.log('markRecordSynced called for:', recordId);
  const record = await db.dispenseRecords.get(recordId);
  if (record) {
    await db.dispenseRecords.update(recordId, {
      synced: true,
      syncedAt: Date.now(),
    });
    console.log('Record marked as synced:', recordId);
  }
  await db.syncQueue.where('record.id').equals(recordId).delete();
}

// Debug function to reset all records to unsynced (for testing)
export async function resetAllRecordsToUnsynced() {
  const allRecords = await db.dispenseRecords.toArray();
  for (const record of allRecords) {
    await db.dispenseRecords.update(record.id, { synced: false });
  }
  console.log(`Reset ${allRecords.length} records to synced: false`);
  return allRecords.length;
}

export async function loadStaticDatasets(drugs: Drug[], regimens: DoseRegimen[]) {
  await db.drugs.bulkAdd(drugs);
  await db.doseRegimens.bulkAdd(regimens);
}
