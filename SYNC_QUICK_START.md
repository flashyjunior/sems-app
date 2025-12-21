# Quick Reference: IndexDB → PostgreSQL Sync

## ✨ What You Now Have

Your pharmacy application now has **three-level sync capability**:

1. **Manual Sync** - Click button to sync immediately
2. **Automatic Sync** - Background syncing on configurable intervals (30s - 1h)
3. **Configurable Intervals** - Change sync timing from UI without restarting

---

## 🚀 How to Use

### Access Sync Controls

**Location**: Top right of app header, next to username/settings

**Status Display**: 
```
● Ready (5 pending)    ← Click to expand controls
```

**Color Meanings**:
- 🟢 Green = Idle, ready to sync
- 🔵 Blue (pulsing) = Currently syncing
- 🔴 Red = Error occurred

---

### Manual Sync

1. Click the sync status indicator
2. Click **"Sync Now"** button
3. Watch for success message: ✓ Synced X records
4. Failed records retry next cycle

**Result**: All pending IndexDB records → PostgreSQL

---

### Configure Auto-Sync

1. Click sync status indicator
2. Toggle **"Auto Sync"** switch
3. If enabled, select interval from dropdown:
   - 30 seconds (demo)
   - 1 minute
   - 5 minutes ← **Recommended**
   - 10 minutes
   - 30 minutes
   - 1 hour

**Result**: Records auto-sync every N seconds

---

### View Sync Statistics

In the sync control panel, see:
- **Pending Records**: How many await syncing
- **Last Sync**: When sync last succeeded
- **Total Synced**: Lifetime count

---

## 📊 Data Flow

```
Dispense Created in Browser
        ↓
Saved to IndexDB (is_synced = false)
        ↓
User clicks "Sync" OR auto-sync timer triggers
        ↓
POST to /api/dispenses (with JWT token)
        ↓
Server validates and saves to PostgreSQL
        ↓
Browser marks record as synced in IndexDB
        ↓
Display success: "✓ Synced X records"
```

---

## ⚙️ Interval Guide

| Selection | Time | Best For |
|-----------|------|----------|
| 30s | Half minute | Testing |
| 1m | 1 minute | Very active use |
| **5m** | **5 minutes** | **DEFAULT - Recommended** |
| 10m | 10 minutes | Normal use |
| 30m | Half hour | Low bandwidth |
| 1h | One hour | Minimal connectivity |

**Rule of Thumb**: 
- Fast network → Lower interval (1-5m)
- Slow network → Higher interval (10-30m)
- Battery-sensitive → Higher interval (30m-1h)

---

## 🔒 Security

✅ All syncs require JWT authentication
✅ Duplicate prevention via unique record IDs
✅ Server-side validation of all data
✅ Rate limited (100 requests per 15 minutes)
✅ Audit logged (all syncs recorded)

---

## 🐛 Troubleshooting

### Sync button does nothing
- Check: Is user logged in?
- Check: Is internet connected?
- Try: Refresh page and retry

### "Syncing..." shows but never completes
- Issue: Network timeout or server error
- Fix: Check server is running (npm run dev)
- Fix: Check network connection
- Try: Manual retry after 30s

### Interval won't change
- Note: Changes take effect immediately
- Note: If Auto Sync OFF, interval saved but not used
- Try: Toggle Auto Sync OFF then ON to restart

### Records still in IndexDB after sync
- Note: Normal - they remain locally for archive
- Solution: Delete manually if needed (DevTools)

---

## 💾 Persistence

**Sync configuration survives**:
- ✅ Page refresh
- ✅ Browser restart
- ✅ Device restart

**Stored in**: Browser's localStorage

**Key**: `sems_sync_config`

---

## 📱 Mobile Compatibility

Works on:
- ✅ iPhone/iPad (Safari)
- ✅ Android (Chrome/Firefox)
- ✅ Windows/Mac (Chrome/Safari/Firefox)

**Battery Tip**: Use higher intervals (10-30m) on mobile to save battery

---

## 🎯 Key Features

| Feature | Status | How to Use |
|---------|--------|-----------|
| Manual Sync | ✅ | Click "Sync Now" button |
| Auto-Sync | ✅ | Toggle ON, select interval |
| Interval Config | ✅ | Click dropdown in panel |
| Error Display | ✅ | Errors show in red box |
| Progress Tracking | ✅ | "Syncing..." shows while active |
| Stats Display | ✅ | See counts in panel |
| Config Persistence | ✅ | Survives refresh |

---

## 🔍 Real-World Example

**Scenario**: Medication distribution at pharmacy counter

1. **Patient arrives offline** → Records saved to IndexDB
2. **Network returns** → "Sync Now" becomes available
3. **Pharmacist clicks** "Sync Now" → Records sent to server
4. **Success message** → "✓ Synced 3 records"
5. **Auto-Sync active** → Future records auto-sync every 5 min
6. **Manager checks logs** → PostgreSQL shows all records

---

## 📚 Documentation

For detailed information, see:
- `SYNC_IMPLEMENTATION.md` - Complete technical guide
- `SYNC_FEATURES_COMPLETE.md` - Full feature documentation

---

## ✅ Verification Checklist

After accessing the app:
- [ ] See sync status indicator in header
- [ ] Click to expand sync control panel
- [ ] See "Sync Now" button
- [ ] See "Auto Sync" toggle
- [ ] See interval dropdown
- [ ] Create test record
- [ ] Click "Sync Now"
- [ ] See success message
- [ ] Check PostgreSQL has new record

---

**That's it! Your sync system is ready to use.** 🎉

Need help? Check troubleshooting or detailed docs above.
