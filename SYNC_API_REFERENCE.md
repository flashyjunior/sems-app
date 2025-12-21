# Sync API Reference

## SyncController API

The main service for managing sync operations.

### Initialization

```typescript
import { syncController } from '@/services/sync-controller';

await syncController.initialize({
  apiBaseUrl: 'http://localhost:3000',
  authToken: userJwtToken
});
```

**Parameters**:
- `apiBaseUrl` (string): Base URL of API server
- `authToken` (string): JWT token for authentication

**Returns**: Promise<void>

**Side Effects**:
- Loads saved sync config from localStorage
- Starts auto-sync if enabled in config
- Initializes Zustand store with sync state

---

## Methods

### triggerManualSync()

Manually synchronize all unsynced records to server.

```typescript
const result = await syncController.triggerManualSync();
// result = { synced: 15, failed: 0 }
```

**Returns**: 
```typescript
Promise<{
  synced: number;    // Count of successfully synced records
  failed: number;    // Count of failed records
}>
```

**Throws**: Error if not initialized

**Side Effects**:
- Sets `syncConfig.isSyncing = true`
- Posts records to `/api/dispenses`
- Updates Zustand store with stats
- Shows UI feedback (success/error)

**Error Cases**:
- Network unreachable: Error thrown, records retained
- Invalid token: Records retained, error shown
- Server error: Records retained, retry next cycle

---

### startAutoSync()

Begin automatic background syncing at specified interval.

```typescript
syncController.startAutoSync(300); // 5 minutes
```

**Parameters**:
- `intervalSeconds` (number): Interval in seconds (default: 300)
  - Minimum: 30
  - Maximum: 3600
  - Recommended: 300 (5 minutes)

**Returns**: void

**Throws**: 
- Error if interval outside valid range
- Error if not initialized

**Side Effects**:
- Sets `syncConfig.enabled = true`
- Stops any previous auto-sync timer
- Starts new timer with interval
- Persists config to localStorage
- Immediately executes one sync

**Example**:
```typescript
// Start syncing every 10 minutes
syncController.startAutoSync(600);

// Start syncing every minute
syncController.startAutoSync(60);
```

---

### stopAutoSync()

Stop automatic background syncing.

```typescript
syncController.stopAutoSync();
```

**Parameters**: None

**Returns**: void

**Side Effects**:
- Sets `syncConfig.enabled = false`
- Clears internal timer
- Persists config to localStorage

**Note**: Does not interrupt in-progress sync

---

### updateSyncInterval()

Change the sync interval without restarting.

```typescript
syncController.updateSyncInterval(600); // 10 minutes
```

**Parameters**:
- `intervalSeconds` (number): New interval in seconds
  - Must be between 30 and 3600
  - Will be validated

**Returns**: void

**Throws**: Error if outside valid range

**Side Effects**:
- If auto-sync enabled: Restarts timer with new interval
- If auto-sync disabled: Saves interval for later use
- Persists to localStorage

**Example**:
```typescript
// Change to 1 minute
syncController.updateSyncInterval(60);

// Change to 30 minutes  
syncController.updateSyncInterval(1800);

// Invalid - will throw
syncController.updateSyncInterval(10); // Too low
syncController.updateSyncInterval(7200); // Too high
```

---

### getSyncStats()

Get current sync statistics.

```typescript
const stats = await syncController.getSyncStats();
// stats = { 
//   unsyncedCount: 5,
//   totalRecords: 42,
//   lastSyncTime: 1703000000000
// }
```

**Returns**:
```typescript
Promise<{
  unsyncedCount: number;      // Records pending sync
  totalRecords: number;       // Total in local DB
  lastSyncTime?: number;      // Last sync timestamp
  [key: string]: any;         // Other stats
}>
```

**Throws**: Error if unable to access local DB

---

### isSyncInProgress()

Check if a sync operation is currently running.

```typescript
if (syncController.isSyncInProgress()) {
  console.log('Sync in progress...');
}
```

**Returns**: boolean
- `true` if currently syncing
- `false` if idle

**Note**: Useful for disabling buttons/UI during sync

---

## Zustand Store Integration

### Access Sync Config

```typescript
import { useAppStore } from '@/store/app';

const syncConfig = useAppStore((s) => s.syncConfig);

// Access properties
syncConfig.enabled              // boolean - auto-sync enabled?
syncConfig.intervalSeconds      // number - current interval (30-3600)
syncConfig.isSyncing           // boolean - currently syncing?
syncConfig.lastSyncTime        // number - timestamp of last sync
syncConfig.syncStats           // object - sync statistics
```

### Update Sync Config

```typescript
const setSyncConfig = useAppStore((s) => s.setSyncConfig);

// Update specific fields
setSyncConfig({
  intervalSeconds: 600,
  lastSyncTime: Date.now()
});
```

### Set Sync In Progress

```typescript
const setSyncInProgress = useAppStore((s) => s.setSyncInProgress);

setSyncInProgress(true);  // During sync
setSyncInProgress(false); // After sync
```

### Update Sync Stats

```typescript
const updateSyncStats = useAppStore((s) => s.updateSyncStats);

updateSyncStats({
  unsyncedCount: 5,
  lastSuccessfulSync: Date.now()
});
```

---

## REST API Endpoints

### POST /api/dispenses

Create a synced dispense record.

**URL**: `POST /api/dispenses`

**Headers**:
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body**:
```json
{
  "externalId": "ext-123456",
  "patientName": "John Doe",
  "patientAge": 45,
  "patientWeight": 75.5,
  "drugId": "drug-xyz",
  "drugName": "Aspirin",
  "dose": {
    "strength": "500mg",
    "quantity": 2,
    "unit": "tablet"
  },
  "safetyAcknowledgements": {
    "allergiesVerified": true,
    "interactionsChecked": true,
    "prescriptionValid": true
  },
  "deviceId": "device-abc",
  "printedAt": "2024-12-19T10:00:00Z",
  "auditLog": {
    "createdBy": "pharmacist-1",
    "timestamp": "2024-12-19T10:00:00Z"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "uuid-string",
  "externalId": "ext-123456",
  "userId": "user-uuid",
  "patientName": "John Doe",
  "patientAge": 45,
  "patientWeight": 75.5,
  "drugId": "drug-xyz",
  "drugName": "Aspirin",
  "dose": {...},
  "safetyAcknowledgements": {...},
  "deviceId": "device-abc",
  "printedAt": "2024-12-19T10:00:00Z",
  "auditLog": {...},
  "isActive": true,
  "createdAt": "2024-12-19T10:00:00.000Z",
  "updatedAt": "2024-12-19T10:00:00.000Z"
}
```

**Status Codes**:
- `201 Created` - Record successfully created
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid/missing JWT
- `409 Conflict` - Duplicate externalId
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Rate Limiting**:
- Limit: 100 requests
- Window: 900 seconds
- Returns 429 if exceeded

---

### GET /api/sync/status

Get current sync statistics (NEW).

**URL**: `GET /api/sync/status`

**Headers**:
```
Authorization: Bearer {JWT_TOKEN}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "unsyncedCount": 5,
    "totalRecords": 42,
    "lastSyncTime": 1703000000000
  }
}
```

**Status Codes**:
- `200 OK` - Stats retrieved
- `401 Unauthorized` - Invalid/missing JWT
- `500 Internal Server Error` - Server error

---

## SyncManager (Low-level)

For advanced users, direct access to SyncManager:

```typescript
import { syncManager } from '@/services/sync-manager';

// Direct sync
const result = await syncManager.syncNow({
  apiBaseUrl: 'http://localhost:3000',
  authToken: token,
  onProgress: (current, total) => console.log(`${current}/${total}`),
  onError: (error) => console.error(error)
});

// Manual timer management
syncManager.startAutoSync(options, 300000); // 5 minutes in ms
syncManager.stopAutoSync();

// Status checks
const isSyncing = syncManager.isSyncInProgress();
const stats = await syncManager.getSyncStats();
```

---

## LocalDatabase (Low-level)

For direct IndexDB operations:

```typescript
import { LocalDatabase } from '@/lib/tauri-db';

const db = new LocalDatabase();
await db.init();

// Get unsynced records
const records = await db.getUnsyncedRecords();

// Mark as synced
await db.markAsSynced(['ext-1', 'ext-2']);

// Get stats
const stats = await db.getSyncStats();

// Save new record
await db.saveDispense({
  external_id: 'ext-123',
  patient_name: 'John Doe',
  // ... other fields
  is_synced: false
});
```

---

## Configuration Persistence

### localStorage Format

Sync configuration stored in localStorage under key `sems_sync_config`:

```json
{
  "enabled": true,
  "intervalSeconds": 300,
  "lastSyncTime": 1703000000000,
  "isSyncing": false
}
```

### Manual Access

```typescript
// Read
const config = JSON.parse(
  localStorage.getItem('sems_sync_config') || '{}'
);

// Write
localStorage.setItem('sems_sync_config', JSON.stringify({
  enabled: true,
  intervalSeconds: 600
}));

// Clear
localStorage.removeItem('sems_sync_config');
```

---

## Error Handling

### Try/Catch Pattern

```typescript
try {
  const result = await syncController.triggerManualSync();
  console.log(`Success: ${result.synced} synced`);
} catch (error) {
  console.error('Sync failed:', error.message);
  // Handle error (show user, retry, etc.)
}
```

### Common Errors

| Error | Cause | Handle |
|-------|-------|--------|
| "Sync controller not initialized" | `initialize()` not called | Call `initialize()` on app start |
| "Sync interval must be between 30 and 3600 seconds" | Invalid interval | Use valid range |
| Network timeout | Server unreachable | Retry, check connection |
| 401 Unauthorized | Invalid JWT | Re-login user |
| 409 Conflict | Duplicate record | Already synced (idempotent) |
| 429 Too Many Requests | Rate limit hit | Back off and retry |

---

## Type Definitions

```typescript
interface SyncConfig {
  enabled: boolean;
  intervalSeconds: number;
  lastSyncTime?: number;
  isSyncing: boolean;
  syncStats?: {
    unsyncedCount: number;
    lastSuccessfulSync?: number;
  };
}

interface SyncControllerOptions {
  apiBaseUrl: string;
  authToken: string;
}

interface SyncResult {
  synced: number;
  failed: number;
}

interface SyncStats {
  unsyncedCount: number;
  totalRecords: number;
  lastSyncTime?: number;
}
```

---

## Best Practices

### 1. Always Initialize
```typescript
// ✅ Do this
await syncController.initialize({...});

// ❌ Don't skip this
```

### 2. Use Proper Error Handling
```typescript
// ✅ Good
try {
  await syncController.triggerManualSync();
} catch (error) {
  showErrorToUser(error);
}

// ❌ Bad
await syncController.triggerManualSync();
```

### 3. Respect Rate Limits
```typescript
// ✅ Good - wait between manual syncs
await syncController.triggerManualSync();
await delay(1000);
await syncController.triggerManualSync();

// ❌ Bad - rapid-fire syncs
for (let i = 0; i < 10; i++) {
  syncController.triggerManualSync();
}
```

### 4. Check Before Updating UI
```typescript
// ✅ Good - use store for reactive updates
const { syncConfig } = useAppStore();
if (!syncConfig.isSyncing) {
  <button>Sync</button>
}

// ❌ Bad - manual state management
if (!await syncController.isSyncInProgress()) {
  // Might be out of sync
}
```

### 5. Use Recommended Intervals
```typescript
// ✅ Recommended: 5 minutes for normal use
syncController.updateSyncInterval(300);

// ⚠️ Use 30s+ only for testing
syncController.updateSyncInterval(30);

// ⚠️ Use 1h+ only for low-bandwidth
syncController.updateSyncInterval(3600);
```

---

## Examples

### Complete Initialization

```typescript
'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { syncController } from '@/services/sync-controller';

export function AppInitializer() {
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('authToken');
      if (token) {
        syncController.initialize({
          apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
          authToken: token
        }).catch(console.error);
      }
    }
  }, [user]);

  return null;
}
```

### Sync Control Component

```typescript
'use client';
import { syncController } from '@/services/sync-controller';
import { useAppStore } from '@/store/app';

export function SyncButton() {
  const { syncConfig } = useAppStore();

  const handleSync = async () => {
    try {
      const result = await syncController.triggerManualSync();
      alert(`Synced ${result.synced} records`);
    } catch (error) {
      alert(`Sync failed: ${error.message}`);
    }
  };

  return (
    <button 
      onClick={handleSync} 
      disabled={syncConfig.isSyncing}
    >
      {syncConfig.isSyncing ? 'Syncing...' : 'Sync Now'}
    </button>
  );
}
```

### Interval Configuration

```typescript
export function IntervalSelector() {
  const { syncConfig, setSyncConfig } = useAppStore();

  const handleChange = (value: string) => {
    const interval = parseInt(value);
    syncController.updateSyncInterval(interval);
    setSyncConfig({ intervalSeconds: interval });
  };

  return (
    <select 
      value={syncConfig.intervalSeconds} 
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value={30}>30 seconds</option>
      <option value={300}>5 minutes</option>
      <option value={600}>10 minutes</option>
      <option value={3600}>1 hour</option>
    </select>
  );
}
```

---

**End of API Reference**
