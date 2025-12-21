# SEMS Architecture - Visual Guide

## System Architecture

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    CLOUD DEPLOYMENT                          ┃
┃  ┌───────────────────────────────────────────────────────┐  ┃
┃  │              PostgreSQL Database                      │  ┃
┃  │                                                       │  ┃
┃  │  Users [id, email, fullName, password, roleId]      │  ┃
┃  │  Roles [id, name, description]                       │  ┃
┃  │  Permissions [id, name, roleId]                      │  ┃
┃  │  DispenseRecords [id, userId, drugId, amount, ...]  │  ┃
┃  │  Drugs, DoseRegimens, etc.                           │  ┃
┃  │                                                       │  ┃
┃  └───────────────────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
            ↑                                    ↓
            │ Sync UP (dispense records)        │ Sync DOWN (users/roles)
            │ POST /api/dispenses               │ POST /api/sync/pull-*
            │                                   │
            │                                   ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    LOCAL DEPLOYMENT                          ┃
┃  ┌───────────────────────────────────────────────────────┐  ┃
┃  │         IndexDB (Browser) / SQLite (Desktop)         │  ┃
┃  │                                                       │  ┃
┃  │  users [synced from PostgreSQL]                      │  ┃
┃  │  roles [synced from PostgreSQL]                      │  ┃
┃  │  dispenseRecords [created locally, synced: false]    │  ┃
┃  │  syncQueue [pending sync operations]                 │  ┃
┃  │                                                       │  ┃
┃  └───────────────────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
            ↑
            │ CREATE (local)
            │ Dispense Form → addDispenseRecord()
            │
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    WEB APPLICATION                           ┃
┃  ┌───────────────────────────────────────────────────────┐  ┃
┃  │                 Next.js Frontend                      │  ┃
┃  │                                                       │  ┃
┃  │  Components:                                         │  ┃
┃  │  - DispenseForm (create records locally)            │  ┃
┃  │  - AdminUsersManager (manage users in PostgreSQL)   │  ┃
┃  │  - SyncControl (sync to cloud)                      │  ┃
┃  │  - SyncStatus (show pending records)                │  ┃
┃  │  - LoginForm (authenticate)                         │  ┃
┃  │                                                       │  ┃
┃  │  Services:                                           │  ┃
┃  │  - syncService (manage sync state)                  │  ┃
┃  │  - syncManager (handle sync operations)             │  ┃
┃  │  - db (IndexDB wrapper)                             │  ┃
┃  │                                                       │  ┃
┃  └───────────────────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Data Flow Diagram

### 1. Admin User Creation Flow

```
┌─────────────────┐
│  Admin User     │
│  Logs In        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Opens Admin    │
│  Users Panel    │ (AdminUsersManager)
└────────┬────────┘
         │
         ↓
┌──────────────────────────┐
│  Fills User Form         │
│  - Email                 │
│  - Full Name             │
│  - License #             │
│  - Password              │
│  - Role (default: pharm) │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Submits Form            │
│  POST /api/users         │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  API Validates:          │
│  - Auth required         │
│  - Admin role required   │
│  - Fields validated      │
│  - Password hashed       │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Save to PostgreSQL      │
│  User table              │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Response 201 Created    │
│  Show success message    │
└─────────────────────────┘
```

### 2. User Sync Flow

```
┌──────────────────┐
│  Admin clicks    │
│  "Sync Users"    │
│  button          │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────┐
│  POST /api/sync/pull-users
│  Authorization: Bearer JWT
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Fetch all users from    │
│  PostgreSQL              │
│  SELECT * FROM "User"    │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Convert to IndexDB      │
│  format:                 │
│  {                       │
│    id, email, fullName,  │
│    licenseNumber, ...    │
│  }                       │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Save to IndexDB         │
│  db.users.add()          │
│  or update() if exists   │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Response 200 OK         │
│  { count: X, users: [...] }
│  Show success message    │
└─────────────────────────┘
```

### 3. Dispense Record Creation Flow

```
┌─────────────────┐
│  Pharmacist     │
│  Opens app      │
│  (users synced) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Fills Dispense │
│  Form:          │
│  - Patient Name │
│  - Drug         │
│  - Dose         │
└────────┬────────┘
         │
         ↓
┌──────────────────────────┐
│  Click "Save & Print"    │
│  (or just Save)          │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Calculate dose          │
│  (validates age/weight)  │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Create record:          │
│  {                       │
│    id, userId,           │
│    drugId, dose,         │
│    synced: false,        │
│    timestamp, ...        │
│  }                       │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Save to IndexDB         │
│  db.dispenseRecords.add()│
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Update sync status      │
│  Shows "1 pending" in    │
│  navbar                  │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Show record confirmation
│  Print if needed         │
└─────────────────────────┘
```

### 4. Record Sync Flow (NEW - With Proper User FK)

```
┌──────────────────────────┐
│  User clicks Sync button │
│  or auto-sync triggers   │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Get pending records     │
│  from IndexDB:           │
│  synced = false          │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  For each record:        │
│  POST /api/dispenses     │
│  {                       │
│    userId,               │
│    drugId, dose, ...     │
│  }                       │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  API checks user exists: │
│  SELECT * FROM "User"    │
│  WHERE id = ?            │
│                          │
│  ✓ FOUND (was synced!)   │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Save record to          │
│  PostgreSQL:             │
│  INSERT INTO             │
│    "DispenseRecord"...   │
│  No FK violation!  ✓     │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  API Response 201        │
│  { success: true }       │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  sync-manager marks:     │
│  synced = true           │
│  db.markRecordSynced()   │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Update navbar:          │
│  "0 pending" ✓           │
└──────────────────────────┘
```

## Component Structure

```
App
├── Layout
│   ├── Navbar
│   │   ├── SyncStatus
│   │   │   └── Shows pending count
│   │   ├── SyncControl
│   │   │   └── Manual sync button
│   │   ├── AdminUsersManager ⭐ NEW
│   │   │   ├── User list
│   │   │   ├── Create form
│   │   │   └── Sync button
│   │   └── LoginForm
│   │
│   └── Main Content
│       ├── DispenseForm
│       │   └── Creates records locally
│       ├── DrugSearch
│       ├── SettingsMenu
│       └── etc.
│
└── Services
    ├── syncService
    ├── syncManager
    ├── doseCalculationService
    ├── dispenseService
    ├── authService
    └── db (IndexDB)
```

## API Endpoints Overview

```
Authentication:
  POST   /api/auth/login              Login with email/password
  POST   /api/auth/logout             Logout and invalidate token

User Management:
  GET    /api/users                   List all users (admin)
  POST   /api/users                   Create new user (admin)
  GET    /api/users/:id               Get user details (admin)

Synchronization:
  POST   /api/sync/pull-users         Download users from PostgreSQL ⭐ NEW
  POST   /api/sync/pull-roles         Download roles from PostgreSQL ⭐ NEW
  POST   /api/sync/status             Get current sync status
  GET    /api/dispenses               List dispense records
  POST   /api/dispenses               Create/sync dispense record
  GET    /api/dispenses/:id           Get record details

Dispense Operations:
  POST   /api/dispenses               Create or sync records
  GET    /api/dispenses/search        Search records
  POST   /api/dispenses/:id/print     Get print preview

Settings:
  GET    /api/system-settings         Get system settings
  PUT    /api/system-settings         Update settings (admin)
  GET    /api/printer-settings        Get printer config
  PUT    /api/printer-settings        Update printer (admin)

Health:
  GET    /api/health                  Health check
  GET    /api/audit-logs              View activity logs (admin)
```

## Database Schema (Relevant Tables)

```
PostgreSQL

┌─────────────┐
│   User      │
├─────────────┤
│ id (PK)     │
│ email (U)   │
│ fullName    │
│ password    │
│ roleId (FK) │
│ isActive    │
│ createdAt   │
└─────────────┘
       ↑
       │ (1:N)
       │
┌─────────────────────┐
│  DispenseRecord     │
├─────────────────────┤
│  id (PK)            │
│  userId (FK) ──────→│  User
│  drugId (FK) ──────→│  Drug
│  dose               │
│  timestamp          │
│  synced (NEW)       │
│  createdAt          │
└─────────────────────┘
```

## Sequence Diagram: Admin Setup

```
Admin          Browser          API           PostgreSQL
  │              │              │                │
  ├─ Login ─────→│              │                │
  │              ├─ POST auth ──→│─ validate ────→│
  │              │              │                │
  │              │←─ 200 OK ────│← select user ─│
  │              │ (JWT token)  │                │
  │←─ Navigate ──│              │                │
  │              │              │                │
  ├─ Open Admin Panel           │                │
  │              │              │                │
  │              ├─ GET users ──→│─ SELECT * ────→│
  │              │              │                │
  │              │←─ 200 OK ────│← users[] ─────│
  │              │              │                │
  ├─ Fill form                  │                │
  ├─ Create user                │                │
  │              │              │                │
  │              ├─ POST /users→│─ validate ────→│
  │              │ (user data)  ├─ hash pwd ─→  │
  │              │              │                │
  │              │              │─ INSERT ──────→│
  │              │              │                │
  │              │←─ 201 ──────│← id, email ───│
  │              │              │                │
  │←─ Show success               │                │
  │              │              │                │
  ├─ Sync to local              │                │
  │              │              │                │
  │              ├─ POST /pull ─→│─ SELECT * ────→│
  │              │   /users     │                │
  │              │              │← users[] ─────│
  │              │              │                │
  │              ├─ Save to IndexDB              │
  │              │              │                │
  │              │←─ 200 OK ────│                │
  │              │              │                │
  │←─ Show "Synced"             │                │
```

## Before & After Comparison

### BEFORE (Broken ❌)
```
Local DB             API           PostgreSQL
  │                  │                │
  ├─ Create user ─────→ POST /users ──→ ✗ User doesn't exist
  │  (localStorage)     returns 202      Foreign Key Error
  │                     (success)     But DB save fails
  │
  ├─ Create record ─────→ POST /dispenses
  │  synced: false       Tries to insert
  │                      with userId=X
  │                      ✗ FK fails (user X not in DB)
  │
  └─ Mark synced: true   BUT NOTHING SAVED TO DB!
     (wrong info)
```

### AFTER (Fixed ✅)
```
PostgreSQL           API           Local DB
  │                  │                │
  ├─ Admin creates ──────→ POST /users
  │  user via form        Creates user
  │                       Returns 201 (success)
  │
  ├─ Admin clicks ─────────→ POST /pull-users
  │  "Sync to Local"           Fetches users from DB
  │                            Saves to IndexDB
  │                            Returns count
  │
  │                       Local DB now has users ✓
  │
  │                       User creates record
  │                       └─→ synced: false
  │
  │                       User clicks sync
  │                       └─→ POST /dispenses
  │                            userId exists locally ✓
  │                            userId exists in DB ✓
  │
  ├─ Record saved ←─── API validates FK
  │  Successfully       Returns 201 (success) ✓
  │                  
  │                       Local DB marks synced: true ✓
  │
  └─ All data consistent!
```

---

## Summary

The new architecture ensures:
- ✅ Users are created in PostgreSQL (source of truth)
- ✅ Users are synced down to local databases
- ✅ Dispense records have valid user FK references
- ✅ Sync operations succeed with proper error handling
- ✅ Data is consistent between cloud and local
