# SMTP Settings Cloud-to-Client Sync Architecture

## Overview

SMTP settings are stored in PostgreSQL (cloud database) and synchronized to client devices through a pull-based sync system. Clients cache the settings locally and use them for email operations without needing to fetch from the server every time.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUD (PostgreSQL)                            │
│           SMTP Settings (Single Source of Truth)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ host: smtp.gmail.com                                     │  │
│  │ port: 587                                                │  │
│  │ username: sems@example.com                               │  │
│  │ password: [encrypted]                                    │  │
│  │ fromEmail: noreply@sems.com                              │  │
│  │ fromName: SEMS Support                                   │  │
│  │ enabled: true                                            │  │
│  │ adminEmail: admin@sems.com                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
          When Admin Changes SMTP Settings
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│        API: PUT /api/settings/smtp (Admin Only)                 │
│                                                                  │
│  1. Validates admin role                                        │
│  2. Saves/updates to PostgreSQL                                 │
│  3. Response: { success: true, id: "..." }                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
          Clients Pull Updated Settings
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│        API: GET /api/sync/pull-smtp (All Users)                 │
│                                                                  │
│  1. Fetches from PostgreSQL                                     │
│  2. Hides password (returns "***HIDDEN***")                     │
│  3. Returns timestamp and all config                            │
│  4. CORS enabled for cross-device sync                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│            CLIENT DEVICE (Web/Desktop/Mobile)                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Local Storage (IndexedDB/LocalStorage)          │   │
│  │                                                          │   │
│  │ Key: "sems_smtp_settings"                              │   │
│  │ Value: {                                                │   │
│  │   host: "smtp.gmail.com",                              │   │
│  │   port: 587,                                           │   │
│  │   username: "sems@example.com",                        │   │
│  │   fromEmail: "noreply@sems.com",                       │   │
│  │   enabled: true,                                       │   │
│  │   updatedAt: 1704880000000                             │   │
│  │ }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │    Email Service (sendTicketNotificationEmail, etc)     │   │
│  │                                                          │   │
│  │  1. Reads SMTP config from local storage                │   │
│  │  2. Uses Nodemailer to send emails                      │   │
│  │  3. Works offline if settings cached                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Sync Process Flow

### Step 1: Admin Changes SMTP Settings
```javascript
// In SMTPSettings Component
const handleSave = async () => {
  const response = await fetch('/api/settings/smtp', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  });
  // Settings saved to PostgreSQL ✓
}
```

### Step 2: Client Triggers Sync (Manual or Auto)
```javascript
// In DataSyncManager Component
const handleSyncAll = async () => {
  const smtpResponse = await fetch('/api/sync/pull-smtp', {
    headers: {
      'Authorization': `Bearer ${authToken}'
    }
  });
  
  if (smtpResponse.ok) {
    const smtpData = await smtpResponse.json();
    // Save to local storage
    localStorage.setItem('sems_smtp_settings', JSON.stringify(smtpData.data));
  }
}
```

### Step 3: Email Service Uses Local Settings
```javascript
// In email.service.ts
export async function sendTicketNotificationEmail(params) {
  // Read from local storage (cached from cloud)
  const localSettings = JSON.parse(
    localStorage.getItem('sems_smtp_settings') || '{}'
  );
  
  // Create transporter with local settings
  const transporter = nodemailer.createTransport({
    host: localSettings.host,
    port: localSettings.port,
    secure: localSettings.secure,
    auth: {
      user: localSettings.username,
      pass: localSettings.password // NOTE: Never exposed to client
    }
  });
  
  // Send email
  await transporter.sendMail({...})
}
```

## Sync Endpoints

### GET /api/sync/pull-smtp

**Purpose:** Download SMTP settings from cloud to client  
**Authentication:** Required (Bearer token)  
**Access:** Admin users only  
**CORS:** Enabled

**Response (200 OK):**
```json
{
  "success": true,
  "message": "SMTP settings fetched successfully",
  "data": {
    "id": "smtp-1",
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": true,
    "username": "sems@example.com",
    "password": "***HIDDEN***",
    "fromEmail": "noreply@sems.com",
    "fromName": "SEMS Support",
    "adminEmail": "admin@sems.com",
    "replyToEmail": "support@sems.com",
    "enabled": true,
    "testStatus": "success",
    "lastTestedAt": 1704880000000,
    "updatedAt": 1704880000000
  },
  "timestamp": "2026-01-10T12:00:00.000Z"
}
```

**Response (200 OK, No Settings):**
```json
{
  "success": true,
  "message": "No SMTP settings configured",
  "data": null,
  "timestamp": "2026-01-10T12:00:00.000Z"
}
```

## Sync Triggers

### 1. Manual Sync (User Initiated)
- User clicks "Sync Data" button in Settings
- DataSyncManager calls all pull endpoints
- Includes `/api/sync/pull-smtp`

### 2. Auto Sync (Scheduled)
- Runs at regular intervals (configurable)
- Can pull SMTP settings as part of full sync
- Keeps client up-to-date with cloud settings

### 3. On Connection Restore
- When device comes online after being offline
- Automatically syncs all settings including SMTP

### 4. On Settings Save
- After admin saves new SMTP settings
- Can trigger broadcast to all clients
- Or clients can pull on next scheduled sync

## Data Flow for Tickets

```
Ticket Created (On Client)
    ↓
    ├─→ Sync UP to /api/dispenses (sends to PostgreSQL)
    │       └─→ Server stores ticket
    │
    └─→ Send Notification Email
            └─→ Check local SMTP settings
                └─→ If exists: Use local cached settings
                └─→ If not: Fall back to server-side email

Admin Saves SMTP Settings
    ↓
    └─→ PUT /api/settings/smtp
            └─→ Saved to PostgreSQL
            └─→ Next sync pulls to clients
                    ↓
                    └─→ Clients cache locally
                            ↓
                            └─→ Email service uses cached settings
```

## Security Considerations

### Password Protection
- **Never sent to client in full form**
- Always returns `***HIDDEN***` to client
- Real password only used on server for test endpoint

### Authentication
- All pull endpoints require bearer token
- Admin-only verification happens server-side
- No sensitive data exposed to non-admin users

### TLS/SSL
- SMTP port 587 uses STARTTLS
- Settings include `secure` flag for TLS configuration
- Email credentials never logged or stored in plain text

## Client-Side Caching Strategy

### Storage Locations
1. **Browser:** `localStorage['sems_smtp_settings']`
2. **Electron/Tauri:** Native file system with encryption
3. **Mobile:** Platform-specific secure storage

### Cache Invalidation
- Manual: When user clicks sync button
- Automatic: Based on `updatedAt` timestamp
- Smart: Only update if newer timestamp from server

### Fallback Behavior
- If cached settings unavailable: Try server-side email
- If network unavailable: Queue notifications for later
- If both fail: Log error and notify admin

## Example: Adding SMTP to Dispense Record Sync

```typescript
// When sending dispense record
async function syncDispenseRecord(record) {
  try {
    // First try: Use local SMTP if available
    const localSmtp = JSON.parse(
      localStorage.getItem('sems_smtp_settings') || 'null'
    );
    
    if (localSmtp?.enabled) {
      await sendEmailUsingLocalSmtp(record, localSmtp);
    } else {
      // Fallback: Request server to send
      await fetch('/api/dispenses/notify', {
        method: 'POST',
        body: JSON.stringify({ recordId: record.id })
      });
    }
    
    // Then sync the record
    await syncRecordToCloud(record);
  } catch (error) {
    // Queue for retry
    await queueForSync(record);
  }
}
```

## Implementation Checklist

✅ Created `/api/sync/pull-smtp` endpoint  
✅ Added SMTP sync to DataSyncManager  
✅ Updated SMTPSettings component  
✅ Password protection in responses  
✅ CORS headers enabled  
✅ Authentication verification  
✅ Error handling and logging  
✅ TypeScript types defined  

## Related Files

- **Endpoint:** [src/app/api/sync/pull-smtp/route.ts](src/app/api/sync/pull-smtp/route.ts)
- **Component:** [src/components/DataSyncManager.tsx](src/components/DataSyncManager.tsx)  
- **Settings:** [src/components/SMTPSettings.tsx](src/components/SMTPSettings.tsx)
- **Email Service:** [src/services/email.service.ts](src/services/email.service.ts)
- **Database:** [prisma/schema.prisma](prisma/schema.prisma) (SMTPSettings model)

## Testing SMTP Sync

```bash
# 1. Save SMTP settings in UI (admin user)
# 2. Open browser DevTools → Application → LocalStorage
# 3. Look for 'sems_smtp_settings' key
# 4. Click "Sync Data" button
# 5. Verify localStorage has updated SMTP config
# 6. Verify email service can send using cached settings
# 7. Test with offline mode - emails should still queue
```
