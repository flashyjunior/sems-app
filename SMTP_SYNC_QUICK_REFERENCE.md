# SMTP Cloud-to-Client Sync - Quick Reference

## The Journey of SMTP Settings

### 🌩️ In the Cloud (PostgreSQL)
```
Admin saves SMTP settings in UI
          ↓
    PUT /api/settings/smtp
          ↓
   PostgreSQL stores settings
   (Single source of truth)
```

### 📡 Pulling to Clients
```
Client App (Desktop/Mobile/Web)
          ↓
  "Sync Data" button clicked
          ↓
   GET /api/sync/pull-smtp
          ↓
  Reads PostgreSQL
          ↓
  Returns config (password hidden)
          ↓
  Client saves to localStorage
  "sems_smtp_settings"
```

### 📧 Sending Emails
```
Ticket created on client
          ↓
   Check: Is SMTP cached locally?
          ├─→ YES: Use local config + Nodemailer
          │        └─→ Send email immediately (fast!)
          │
          └─→ NO: Use server-side email service
                  └─→ Request API to send email
```

---

## What Syncs?

| Data | Where Stored | Sync Direction | When |
|------|-------------|-----------------|------|
| **Drugs** | PostgreSQL | Cloud → Client | Manual or auto sync |
| **Roles** | PostgreSQL | Cloud → Client | Manual or auto sync |
| **Users** | PostgreSQL | Cloud → Client | Manual or auto sync |
| **Templates** | PostgreSQL | Cloud → Client | Manual or auto sync |
| **Printer Settings** | PostgreSQL | Cloud → Client | Manual or auto sync |
| **SMTP Settings** | PostgreSQL | Cloud → Client | Manual or auto sync ✨ NEW |
| **Dispense Records** | IndexedDB/SQLite | Client → Cloud | Auto when synced |
| **Tickets** | PostgreSQL | Both ways | Up on creation, down on update |

---

## Key Points

### ✅ Benefits
- **Offline capable:** Emails can be sent without internet
- **Faster:** No server round-trip needed every time
- **Resilient:** If cloud unavailable, local settings work
- **Bandwidth efficient:** Sync only when needed

### 🔒 Security
- Password never sent to client
- Only admins can pull SMTP settings
- All communication encrypted with HTTPS
- Settings stored in browser/app local storage

### 🚀 Scalability
- Hundreds of clients can share same SMTP config
- Central control (one admin updates all)
- Works across devices/browsers

---

## Files Created/Modified

```
NEW:
  src/app/api/sync/pull-smtp/route.ts
  SMTP_SYNC_ARCHITECTURE.md

MODIFIED:
  src/components/DataSyncManager.tsx
```

---

## How to Use

### For Admins
1. Go to Settings → Email Configuration
2. Enter SMTP details (Gmail, Office365, etc.)
3. Click "Test Connection"
4. Click "Save Settings"
5. Settings automatically sync to cloud

### For Clients/Devices
1. Click Settings → "Sync Data" (or auto-syncs)
2. SMTP settings pulled from cloud
3. Cached locally for email sending
4. Emails sent using cached config

### For Developers
```javascript
// In email.service.ts
const smtpSettings = JSON.parse(
  localStorage.getItem('sems_smtp_settings') || '{}'
);

const transporter = nodemailer.createTransport({
  host: smtpSettings.host,
  port: smtpSettings.port,
  secure: smtpSettings.secure,
  auth: {
    user: smtpSettings.username,
    pass: smtpSettings.password
  }
});
```

---

## Testing Checklist

- [ ] Admin logs in with SEMS admin account
- [ ] Navigate to Settings > Email Configuration
- [ ] Save valid SMTP settings
- [ ] Check browser DevTools → Application → LocalStorage
- [ ] Look for `sems_smtp_settings` key
- [ ] Click "Sync Data" button
- [ ] Verify timestamp updated
- [ ] Create a ticket
- [ ] Verify email sent using local SMTP config
- [ ] Go offline (DevTools → Offline)
- [ ] Create another ticket
- [ ] Verify it queued (works offline)
- [ ] Go online and sync
- [ ] Verify queued emails sent

---

## See Also

- [SMTP Settings Configuration Guide](DOCUMENTATION_INDEX_ADMIN.md)
- [Ticketing System Architecture](SYNC_VISUAL_GUIDE.md)
- [Email Service Implementation](src/services/email.service.ts)
