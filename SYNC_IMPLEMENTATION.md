# IndexDB to PostgreSQL Sync Implementation

## Overview

The SEMS application implements a comprehensive sync system that synchronizes medication dispense records from the browser's IndexDB (offline storage) to PostgreSQL (server database). This enables:

- ✅ **Manual Sync Trigger**: Users can manually synchronize pending records via a button click
- ✅ **Automatic Sync**: Background syncing at configurable intervals (30 seconds to 1 hour)
- ✅ **Configurable Intervals**: Users can adjust sync timing from 30s to 3600s (1 hour)
- ✅ **Offline Resilience**: Records persist locally in IndexDB until successfully synced
- ✅ **Idempotent Syncing**: Prevents duplicate records using external IDs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Browser Layer (React + Next.js)                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ SyncControl Component (UI)                             │ │
│  │ - Manual Sync Button                                   │ │
│  │ - Interval Slider (30s - 1h)                          │ │
│  │ - Auto-Sync Toggle                                     │ │
│  │ - Sync Status Display                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ SyncController Service (Business Logic)                │ │
│  │ - initialize()                                         │ │
│  │ - triggerManualSync()                                  │ │
│  │ - startAutoSync()                                      │ │
│  │ - updateSyncInterval()                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Zustand Store (useAppStore)                            │ │
│  │ - syncConfig.enabled                                   │ │
│  │ - syncConfig.intervalSeconds                           │ │
│  │ - syncConfig.isSyncing                                 │ │
│  │ - syncConfig.lastSyncTime                              │ │
│  │ - syncConfig.syncStats                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Local Storage Layer                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ IndexDB (via Dexie)                                    │ │
│  │ - DispenseRecord table                                 │ │
│  │ - is_synced flag                                       │ │
│  │ - external_id (unique identifier)                      │ │
│  │ - LocalDatabase class wrapper                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ localStorage                                           │ │
│  │ - sems_sync_config (config persistence)               │ │
│  │ - authToken (JWT for auth)                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ POST /api/dispenses
┌─────────────────────────────────────────────────────────────┐
│ API Layer (Next.js Server Routes)                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ POST /api/dispenses                                    │ │
│  │ - Validates Bearer token                               │ │
│  │ - Checks externalId uniqueness                         │ │
│  │ - Rate limited (100/900s)                              │ │
│  │ - Creates DispenseRecord in PostgreSQL                 │ │
│  │ - Logs to audit_logs table                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ GET /api/sync/status                                   │ │
│  │ - Returns unsynced record count                         │ │
│  │ - Returns last sync timestamp                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Database Layer                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ PostgreSQL (Production)                                │ │
│  │ - dispense_records table                               │ │
│  │ - audit_logs table                                     │ │
│  │ - Persistent storage                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. SyncControl Component (`src/components/SyncControl.tsx`)

**Purpose**: Provides UI for manual sync triggering and interval configuration

**Key Features**:
- Manual sync button with loading state
- Sync status indicator (idle/syncing/error)
- Auto-sync toggle (on/off)
- Interval dropdown selector (30s, 1m, 5m, 10m, 30m, 1h)
- Sync statistics display (pending records, last sync time)

**Usage**:
```tsx
import SyncControl from '@/components/SyncControl';

<SyncControl 
  apiBaseUrl="http://localhost:3000"
  authToken={yourJwtToken}
/>
```

### 2. SyncController Service (`src/services/sync-controller.ts`)

**Purpose**: Orchestrates sync operations with UI state management

**API Methods**:

#### `initialize(options: SyncControllerOptions)`
Initializes the sync controller and loads persisted configuration
```typescript
await syncController.initialize({
  apiBaseUrl: 'http://localhost:3000',
  authToken: jwtToken
});
```

#### `triggerManualSync()`
Manually triggers an immediate sync of all pending records
```typescript
const result = await syncController.triggerManualSync();
// Returns: { synced: number; failed: number }
```

#### `startAutoSync(intervalSeconds: number = 300)`
Starts background syncing at specified intervals
```typescript
syncController.startAutoSync(600); // 10 minutes
// Supported range: 30-3600 seconds
```

#### `stopAutoSync()`
Stops background syncing
```typescript
syncController.stopAutoSync();
```

#### `updateSyncInterval(intervalSeconds: number)`
Changes the sync interval without restarting the service
```typescript
syncController.updateSyncInterval(300); // 5 minutes
// Validates range: 30-3600 seconds
```

#### `getSyncStats()`
Returns current sync statistics
```typescript
const stats = await syncController.getSyncStats();
// Returns: { unsyncedCount: number; totalRecords: number; ... }
```

#### `isSyncInProgress()`
Checks if a sync operation is currently running
```typescript
const isSyncing = syncController.isSyncInProgress();
```

### 3. SyncManager Service (`src/services/sync-manager.ts`)

**Purpose**: Low-level sync operations and record batching

**Key Methods**:
- `syncNow(options)` - Executes batch sync to server
- `startAutoSync(options, intervalMs)` - Background sync with interval
- `stopAutoSync()` - Halts background sync
- `getSyncStats()` - Returns sync statistics
- `isSyncInProgress()` - Boolean sync status

### 4. LocalDatabase Class (`src/lib/tauri-db.ts`)

**Purpose**: Wraps Dexie IndexDB with type-safe operations

**Key Methods**:
- `getUnsyncedRecords()` - Fetches records with `is_synced = false`
- `markAsSynced(externalIds)` - Marks records as synced
- `getSyncStats()` - Returns unsynced count and stats
- `saveDispense(record)` - Persists new dispense record

## Data Flow

### Manual Sync Flow

1. **User Action**: Clicks "Sync Now" button in SyncControl
2. **UI Update**: Button shows loading state, status changes to "Syncing..."
3. **Controller**: `triggerManualSync()` called on SyncController
4. **Database Query**: Fetches unsynced records from IndexDB via LocalDatabase
5. **Batch POST**: Sends records to `/api/dispenses` endpoint
   - Includes Bearer token in Authorization header
   - Validates externalId for idempotency
   - Each record posted individually with error handling
6. **Server Processing**: 
   - Validates JWT token
   - Checks externalId uniqueness (prevents duplicates)
   - Creates DispenseRecord in PostgreSQL
   - Logs action to audit_logs
   - Returns 201 Created
7. **Local Update**: Records marked as `is_synced = true` in IndexDB
8. **State Update**: Zustand store updated with sync stats
9. **UI Feedback**: Shows success message with count of synced records

### Automatic Sync Flow

1. **Initialization**: App startup calls `syncController.initialize()`
2. **Config Load**: Loads saved sync config from localStorage
3. **Interval Start**: If enabled, starts background timer (default 300s)
4. **Periodic Execution**: Every N seconds, `syncNow()` executes if not already syncing
5. **Record Processing**: Same as manual sync (steps 4-8 above)
6. **Persistence**: Sync config saved to localStorage (survives page refresh)
7. **User Notification**: UI shows last sync time and pending count

## Configuration

### Sync Interval Settings

| Interval | Seconds | Use Case |
|----------|---------|----------|
| 30 seconds | 30 | High-frequency syncing (testing/demo) |
| 1 minute | 60 | Very frequent updates |
| 5 minutes | 300 | **Default** - Balanced approach |
| 10 minutes | 600 | Lower bandwidth requirement |
| 30 minutes | 1800 | Minimal background activity |
| 1 hour | 3600 | Very low-frequency syncing |

### Validation Rules

- **Minimum**: 30 seconds (prevents server overload)
- **Maximum**: 3600 seconds / 1 hour (ensures timely sync)
- **Persistence**: Config saved to `localStorage.sems_sync_config`
- **Survival**: Survives page refresh and browser restart

## API Endpoints

### POST `/api/dispenses`

**Purpose**: Accept synced dispense records from browser

**Request**:
```javascript
{
  externalId: string,        // Unique identifier (prevents duplicates)
  patientName: string,
  patientAge: number,
  patientWeight: number,
  drugId: string,
  drugName: string,
  dose: object,              // JSON serialized
  safetyAcknowledgements: object,  // JSON serialized
  deviceId: string,
  printedAt: ISO8601 string,
  auditLog?: object
}
```

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "externalId": "string",
  "userId": "uuid",
  "patientName": "string",
  ...
}
```

**Rate Limiting**: 100 requests per 900 seconds window

### GET `/api/sync/status`

**Purpose**: Get current sync statistics

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
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

## Error Handling

### Sync Failures

Records that fail to sync are:
- **Retained** in IndexDB (not marked as synced)
- **Retried** in the next sync cycle
- **Logged** with detailed error information
- **Surfaced** to user via error message

### Common Errors

| Error | Cause | Resolution |
|-------|-------|-----------|
| 401 Unauthorized | Invalid/expired JWT | Re-login user |
| 409 Conflict | Duplicate externalId | Data already synced |
| 429 Too Many Requests | Rate limit exceeded | Back off and retry |
| 500 Server Error | Database/API error | Retry on next cycle |

## Zustand Store Integration

### Sync Configuration State

```typescript
interface SyncConfig {
  enabled: boolean;              // Auto-sync enabled/disabled
  intervalSeconds: number;       // Sync interval (30-3600)
  lastSyncTime?: number;         // Timestamp of last sync
  isSyncing: boolean;            // Currently syncing?
  syncStats?: {
    unsyncedCount: number;       // Records pending sync
    lastSuccessfulSync?: number; // Timestamp of last success
  };
}
```

### Store Methods

```typescript
const setSyncConfig = useAppStore((s) => s.setSyncConfig);
const setSyncInProgress = useAppStore((s) => s.setSyncInProgress);
const updateSyncStats = useAppStore((s) => s.updateSyncStats);
```

## Testing the Sync System

### Manual Testing

1. **Start Application**:
   ```bash
   npm run dev
   ```

2. **Create Offline Records**:
   - Stop network connectivity
   - Create dispense records
   - Records saved to IndexDB

3. **Check IndexDB**:
   - Open DevTools → Application → IndexedDB
   - Verify records in `sems` database

4. **Trigger Manual Sync**:
   - Restore network connection
   - Click "Sync Now" button
   - Observe synced records count

5. **Verify PostgreSQL**:
   - Open pgAdmin: `http://localhost:5050`
   - Query: `SELECT * FROM dispense_records ORDER BY created_at DESC`
   - Verify records appear with matching data

### API Testing

**Manual Sync via cURL**:
```bash
curl -X POST http://localhost:3000/api/dispenses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "ext-123",
    "patientName": "John Doe",
    "patientAge": 45,
    "patientWeight": 75.5,
    "drugId": "drug-456",
    "drugName": "Aspirin",
    "dose": {"strength": "500mg", "quantity": 2},
    "safetyAcknowledgements": {"verified": true},
    "deviceId": "device-789",
    "printedAt": "2024-12-19T10:00:00Z"
  }'
```

### Monitoring

**Check Sync Logs**:
```typescript
// In browser console
localStorage.getItem('sems_sync_config')
// Shows current sync configuration

// In server logs
// Enables sync-related debug logging
// via syncController and syncManager
```

## Performance Considerations

### Batch Syncing
- Records sent individually to allow partial failure handling
- Failed records retained for retry
- Concurrent syncs prevented via `isSyncing` flag

### Interval Optimization
- Default 5 minutes balances responsiveness and resource usage
- Adjustable based on:
  - Network bandwidth
  - Server capacity
  - User requirements
  - Battery life (mobile)

### Database Indexing
- Indexes on `external_id` ensure idempotency checks are fast
- Indexes on `is_synced` optimize unsynced record queries
- Soft delete via `isActive` flag supports audit trails

## Security

### Authentication
- All sync endpoints require valid JWT token
- Token includes userId for access control
- 24-hour token expiry enforces re-authentication

### Idempotency
- `externalId` field ensures duplicate-safe syncing
- Server rejects duplicate externalIds (returns 409)
- Prevents data loss on network retries

### Rate Limiting
- 100 requests per 900 seconds per IP
- Protects server from sync flooding
- Prevents abuse of medication dispensing

### Data Validation
- Zod schemas validate all input fields
- Type checking on both client and server
- JSON serialization for complex objects

## Troubleshooting

### Sync Not Triggering

**Check**:
1. Auto-sync enabled: `localStorage.getItem('sems_sync_config')`
2. Auth token valid: Check browser DevTools → Application → Cookies
3. Network connectivity: Open DevTools → Network tab
4. Server running: Test `curl http://localhost:3000/api/dispenses`

**Fix**:
```typescript
// Reset sync config
localStorage.removeItem('sems_sync_config');
// Re-initialize
location.reload();
```

### Records Not Syncing

**Check**:
1. Records in IndexDB: DevTools → Application → IndexedDB → sems
2. `is_synced` flag: Should be `false` for unsynced records
3. Server logs: Check for error messages

**Fix**:
```typescript
// Manually trigger sync
const result = await syncController.triggerManualSync();
console.log(result); // Shows { synced: X, failed: Y }
```

### High Sync Interval

**Adjust**:
```typescript
// Change to 1 minute
syncController.updateSyncInterval(60);

// Or via UI
// SyncControl dropdown → 1 minute
```

## Future Enhancements

- [ ] Sync conflict resolution (server-side wins)
- [ ] Bandwidth-aware interval adjustment
- [ ] Compression for large payloads
- [ ] P2P sync between devices
- [ ] Historical sync statistics dashboard
- [ ] Offline queue visualization
- [ ] Partial sync (selective records)
