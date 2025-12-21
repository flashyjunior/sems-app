# Tauri Desktop App - SQLite Sync Implementation

## Architecture Overview

```
┌─────────────────────────┐
│  Tauri Desktop App      │
│  (Windows .exe)         │
└────────┬────────────────┘
         │
         ├─── Rust Backend (main.rs)
         │    ├─ SQLite Database (local)
         │    └─ Tauri Commands
         │
         └─── TypeScript Frontend
              ├─ localDb (tauri-db.ts)
              └─ syncManager (sync-manager.ts)
                      │
                      ▼
         ┌─────────────────────────┐
         │  Server API             │
         │  /api/dispenses         │
         └────────┬────────────────┘
                  │
                  ▼
         ┌─────────────────────────┐
         │ PostgreSQL (Production) │
         │ sems_db                 │
         └─────────────────────────┘
```

## Local SQLite Database Schema

### Tables

**dispense_records**
- `id` - Primary key (auto-increment)
- `external_id` - Unique identifier for sync tracking
- `patient_name` - Patient name (optional)
- `patient_age` - Patient age (optional)
- `patient_weight` - Patient weight in kg (optional)
- `drug_id` - Drug identifier
- `drug_name` - Drug name
- `dose` - JSON stringified dose calculation
- `safety_acknowledgements` - JSON stringified array
- `printed_at` - Timestamp when printed
- `device_id` - Device identifier
- `audit_log` - JSON stringified audit log
- `is_synced` - Boolean flag (0 = unsynced, 1 = synced)
- `synced_at` - Timestamp when synced
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

Indexes:
- `idx_dispense_external_id` - For lookup by external ID
- `idx_dispense_drug_id` - For filtering by drug
- `idx_dispense_created_at` - For sorting by date
- `idx_dispense_is_synced` - For finding unsynced records

**sync_metadata**
- `id` - Primary key
- `last_sync` - Timestamp of last sync
- `last_sync_count` - Number of records in last sync
- `created_at` - Creation timestamp

## Components

### 1. Tauri Backend (src-tauri/src/main.rs)

Rust-based backend with SQLite integration and Tauri commands:

**Commands:**
- `save_dispense` - Insert a new dispense record
- `get_unsynced_dispenses` - Fetch all unsynced records
- `get_dispense` - Fetch single record by ID
- `list_dispenses` - List records with pagination
- `mark_as_synced` - Mark records as synced after server upload
- `delete_dispense` - Delete a record (soft delete)
- `get_sync_stats` - Get sync statistics

### 2. TypeScript Database Wrapper (src/lib/tauri-db.ts)

Provides TypeScript interface to Tauri commands:

```typescript
// Usage
import { localDb } from '@/lib/tauri-db';

// Save locally
const id = await localDb.saveDispense({
  externalId: 'unique-id-123',
  drugId: 'drug-001',
  drugName: 'Aspirin',
  dose: { ... },
  safetyAcknowledgements: ['ack1', 'ack2'],
  deviceId: 'device-001'
});

// Get unsynced records
const records = await localDb.getUnsyncedRecords();

// Mark as synced
await localDb.markAsSynced(['unique-id-123']);
```

### 3. Sync Manager (src/services/sync-manager.ts)

Handles syncing records from local SQLite to server PostgreSQL:

```typescript
import { syncManager } from '@/services/sync-manager';

// Manual sync
const result = await syncManager.syncNow({
  apiBaseUrl: 'http://localhost:3000',
  authToken: 'your-jwt-token',
  onProgress: (current, total) => {
    console.log(`Syncing ${current}/${total}`);
  },
  onError: (error) => {
    console.error('Sync failed:', error);
  }
});
// Result: { synced: 5, failed: 0 }

// Auto sync every 5 minutes
syncManager.startAutoSync({
  apiBaseUrl: 'http://localhost:3000',
  authToken: token,
}, 300000);

// Get stats
const stats = await syncManager.getSyncStats();
// { synced: 10, unsynced: 5, total: 15, uniqueDrugs: 3 }
```

## Usage in React Components

### Example: Dispense Form with Local Save

```typescript
import { localDb } from '@/lib/tauri-db';
import { syncManager } from '@/services/sync-manager';

export function DispenseForm() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndSync = async (formData) => {
    try {
      setIsSaving(true);

      // 1. Save to local SQLite
      const recordId = await localDb.saveDispense({
        externalId: generateUUID(), // Unique ID for sync
        patientName: formData.patientName,
        patientAge: formData.patientAge,
        patientWeight: formData.patientWeight,
        drugId: formData.drugId,
        drugName: formData.drugName,
        dose: formData.dose,
        safetyAcknowledgements: formData.acks,
        deviceId: getDeviceId(),
      });

      showSuccess('Record saved locally');

      // 2. Try to sync if online
      if (navigator.onLine) {
        const syncResult = await syncManager.syncNow({
          apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
          authToken: getToken(),
        });

        if (syncResult.synced > 0) {
          showSuccess('Record synced to server');
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAndSync}>
      {/* form fields */}
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save & Sync'}
      </button>
    </form>
  );
}
```

### Example: Sync Status Display

```typescript
export function SyncStatus() {
  const [stats, setStats] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      const s = await syncManager.getSyncStats();
      setStats(s);
    };

    loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncManager.syncNow({
        apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
        authToken: getToken(),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!stats) return null;

  return (
    <div className="sync-status">
      <div>Synced: {stats.synced}</div>
      <div>Unsynced: {stats.unsynced}</div>
      <div>Total: {stats.total}</div>
      <button onClick={handleManualSync} disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}
```

## Server-Side Integration

The dispense records sync to the existing `/api/dispenses` endpoint:

```
POST /api/dispenses
Content-Type: application/json
Authorization: Bearer {jwt-token}

{
  "externalId": "unique-id-123",
  "patientName": "John Doe",
  "patientAge": 45,
  "patientWeight": 75.5,
  "drugId": "drug-001",
  "drugName": "Aspirin",
  "dose": { ... },
  "safetyAcknowledgements": ["ack1"],
  "deviceId": "device-001"
}
```

Response:
```json
{
  "success": true,
  "dispense": {
    "id": 1,
    "externalId": "unique-id-123",
    "userId": 5,
    "drugName": "Aspirin",
    "createdAt": "2025-12-19T10:00:00Z",
    ...
  }
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Rust (https://rustup.rs/)
# Then install Tauri CLI
npm install @tauri-apps/cli -D
npm install @tauri-apps/api

# Install other needed packages
npm install axios
```

### 2. Build Tauri App

```bash
# Development
npm run tauri dev

# Production
npm run tauri build
```

### 3. Configuration

Set environment variables in `.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://sems:sems_secure_pwd@localhost:5432/sems_db
JWT_SECRET=your-secret
```

## Offline-First Features

✅ **Works Offline**
- Users can dispense medications even without internet
- All records stored locally in SQLite
- Auto-sync when connection restored

✅ **Data Integrity**
- `externalId` prevents duplicates on sync
- Timestamps track when records were created vs synced
- Audit logs capture all operations

✅ **Sync Reliability**
- Automatic retries on sync failure
- Progress tracking for long syncs
- Error handling and reporting
- Manual sync trigger available

✅ **Production Ready**
- Database indexes for performance
- Transaction support (ready to add)
- Encrypted local storage (ready to add)
- Conflict resolution (ready to add)

## Next Steps

1. **Build Tauri app** - `npm run tauri dev`
2. **Test locally** - Create dispense records offline
3. **Test sync** - Go online and verify records sync to PostgreSQL
4. **Check pgAdmin** - View synced records at http://localhost:5050
5. **Add encryption** - Use `tauri-plugin-stronghold` for secure local storage
6. **Add conflict resolution** - Handle duplicate syncs gracefully
