/**
 * Tauri SQLite Database Service
 * Handles all local database operations for the desktop app
 */

let dbInstance: any = null;

/**
 * Initialize the local SQLite database
 */
export async function initializeDatabase(): Promise<any> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // First check if we're in Tauri environment
    if (typeof window === 'undefined' || !(window as any).__TAURI__) {
      throw new Error('Not running in Tauri environment');
    }

    // Dynamically import Tauri SQL plugin to avoid loading in browser
    let Database: any;
    try {
      const sqlModule = await import('@tauri-apps/plugin-sql') as any;
      
      // Try different export patterns
      Database = sqlModule.Database || sqlModule.default;
      
      if (!Database) {
        console.error('Available exports:', Object.keys(sqlModule));
        throw new Error('Database class not found in @tauri-apps/plugin-sql');
      }
    } catch (importError) {
      console.error('Failed to import @tauri-apps/plugin-sql:', importError);
      throw importError;
    }
    
    console.log('✓ Tauri SQL plugin loaded');
    
    // Load database using the Tauri SQL plugin API
    dbInstance = await Database.load('sqlite:sems.db');
    console.log('✓ Database file loaded');

    // Set pragmas for better performance
    await dbInstance.execute('PRAGMA journal_mode = WAL');
    await dbInstance.execute('PRAGMA synchronous = NORMAL');

    // Create schema if it doesn't exist
    await createSchema(dbInstance);

    console.log('✓ Database initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get the database instance
 */
export function getDatabase(): any {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return dbInstance;
}

/**
 * Create database schema
 */
async function createSchema(db: any): Promise<void> {
  // Users table - for local authentication
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      fullName TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'pharmacist',
      licenseNumber TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  // Dispense Records - offline transactions
  await db.execute(`
    CREATE TABLE IF NOT EXISTS dispense_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      externalId TEXT,
      userId INTEGER NOT NULL,
      patientName TEXT NOT NULL,
      patientAge INTEGER,
      patientWeight REAL,
      drugId INTEGER,
      drugName TEXT NOT NULL,
      dose TEXT,
      safetyAcknowledgements TEXT,
      deviceId TEXT,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0,
      syncedAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Sync Configuration
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serverUrl TEXT NOT NULL,
      syncInterval INTEGER DEFAULT 15,
      autoSyncEnabled INTEGER DEFAULT 1,
      lastSyncAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  // Sync Queue - pending changes to send to server
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entityType TEXT NOT NULL,
      entityId INTEGER,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      retryCount INTEGER DEFAULT 0,
      lastRetryAt INTEGER,
      createdAt INTEGER NOT NULL
    )
  `);

  // Cached Drugs from server
  await db.execute(`
    CREATE TABLE IF NOT EXISTS drugs (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      description TEXT,
      dosageForm TEXT,
      strength TEXT,
      manufacturer TEXT,
      batchNumber TEXT,
      expiryDate TEXT,
      quantity INTEGER,
      unit TEXT,
      storageConditions TEXT,
      notes TEXT,
      syncedFromServer INTEGER DEFAULT 1,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  // Cached Dose Regimens from server
  await db.execute(`
    CREATE TABLE IF NOT EXISTS dose_regimens (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT,
      instructions TEXT,
      warnings TEXT,
      syncedFromServer INTEGER DEFAULT 1,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  console.log('✓ Database schema created');
}

/**
 * Create default admin user if none exists
 */
export async function ensureDefaultUsers(db: any): Promise<void> {
  try {
    // Check if any users exist
    const users = (await (db.select as any)(
      'SELECT COUNT(*) as count FROM users'
    )) as { count: number }[];
    
    if (users.length > 0 && users[0].count > 0) {
      return; // Users already exist
    }

    // Hash function (simple - in production use bcrypt)
    const hashPassword = (pwd: string) => Buffer.from(pwd).toString('base64');

    // Create default admin user
    const now = Date.now();
    await db.execute(
      `INSERT INTO users (email, fullName, password, role, licenseNumber, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'admin@sems.local',
        'SEMS Administrator',
        hashPassword('Admin@123'),
        'admin',
        'ADMIN-001',
        now,
        now,
      ]
    );

    // Create default pharmacist user
    await db.execute(
      `INSERT INTO users (email, fullName, password, role, licenseNumber, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'pharmacist@sems.local',
        'Default Pharmacist',
        hashPassword('Pharmacist@123'),
        'pharmacist',
        'PHARM-001',
        now,
        now,
      ]
    );

    console.log('✓ Default users created');
  } catch (error) {
    console.error('Error ensuring default users:', error);
    throw error;
  }
}

/**
 * Get sync configuration
 */
export async function getSyncConfig(db: any) {
  try {
    const configs = (await (db.select as any)(
      'SELECT * FROM sync_config LIMIT 1'
    )) as {
      id?: number;
      serverUrl: string;
      syncInterval: number;
      autoSyncEnabled: number;
      lastSyncAt: number | null;
      createdAt: number;
      updatedAt: number;
    }[];
    return configs.length > 0
      ? configs[0]
      : {
          serverUrl: '',
          syncInterval: 15,
          autoSyncEnabled: 1,
          lastSyncAt: null,
        };
  } catch (error) {
    console.error('Error getting sync config:', error);
    throw error;
  }
}

/**
 * Update sync configuration
 */
export async function updateSyncConfig(
  db: any,
  config: {
    serverUrl: string;
    syncInterval: number;
    autoSyncEnabled: boolean;
  }
) {
  try {
    const now = Date.now();
    const existing = (await (db.select as any)(
      'SELECT id FROM sync_config LIMIT 1'
    )) as { id: number }[];

    if (existing.length > 0) {
      // Update existing
      await db.execute(
        `UPDATE sync_config SET serverUrl = ?, syncInterval = ?, autoSyncEnabled = ?, updatedAt = ?
         WHERE id = ?`,
        [config.serverUrl, config.syncInterval, config.autoSyncEnabled ? 1 : 0, now, existing[0].id]
      );
    } else {
      // Insert new
      await db.execute(
        `INSERT INTO sync_config (serverUrl, syncInterval, autoSyncEnabled, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?)`,
        [config.serverUrl, config.syncInterval, config.autoSyncEnabled ? 1 : 0, now, now]
      );
    }
  } catch (error) {
    console.error('Error updating sync config:', error);
    throw error;
  }
}

/**
 * Simple password hash for demo (use bcrypt in production)
 */
export function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64');
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

