# SEMS Implementation Guide

## Project Overview

**SEMS** (Smart Dispensing System) is an offline-first pharmacy application implementing STG (Standard Treatment Guidelines) for Ghana. The application:

- Runs completely offline after initial setup
- Calculates correct drug doses based on patient age, weight, and STG guidelines
- Stores all data locally using IndexedDB
- Syncs to cloud when internet is available
- Works on web, mobile (PWA), and desktop (Tauri .exe)

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                      │
│         (React Components + Tailwind CSS)                │
├─────────────────────────────────────────────────────────┤
│              State Management (Zustand)                  │
├─────────────────────────────────────────────────────────┤
│  Auth Service │ Dose Service │ Search │ Sync │ Print   │
├─────────────────────────────────────────────────────────┤
│          Local Database (Dexie.js / IndexedDB)          │
├─────────────────────────────────────────────────────────┤
│        Cloud API (Supabase / Custom Backend)            │
└─────────────────────────────────────────────────────────┘
```

## Project Structure Explanation

```
sems-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Main dashboard
│   │   ├── layout.tsx         # Root layout with metadata
│   │   └── globals.css        # Global Tailwind styles
│   │
│   ├── components/            # Reusable React components
│   │   ├── LoginForm.tsx      # Authentication UI
│   │   ├── DispenseForm.tsx   # Main dispense workflow
│   │   ├── DrugSearch.tsx     # Fuzzy search UI
│   │   ├── SyncStatus.tsx     # Sync indicator
│   │   └── SEMSInitializer.tsx # App init component
│   │
│   ├── lib/
│   │   └── db.ts              # Dexie database schema & helpers
│   │
│   ├── services/              # Business logic
│   │   ├── auth.ts            # Login, session, PIN verification
│   │   ├── dose.ts            # STG dose calculation engine
│   │   ├── search.ts          # Fuse.js fuzzy search wrapper
│   │   ├── sync.ts            # Cloud sync + offline queue
│   │   └── print.ts           # Label printing (thermal + PDF)
│   │
│   ├── store/
│   │   └── app.ts             # Global state (Zustand)
│   │
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   │
│   └── utils/
│       ├── sampleData.ts      # STG drugs + regimens
│       ├── initialization.ts  # DB setup on app load
│       └── dispenseHandler.ts # Dispense workflow logic
│
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icon-*.png             # App icons
│
├── __tests__/
│   ├── dose.test.ts
│   └── search.test.ts
│
├── src-tauri/
│   ├── tauri.conf.json        # Tauri desktop config
│   └── src/                   # Tauri backend (Rust)
│
├── next.config.js             # Next.js + PWA config
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript config
├── Dockerfile                 # Docker deployment
└── docker-compose.yml         # Docker composition
```

## Key Features Deep Dive

### 1. Authentication (src/services/auth.ts)

```typescript
// Simple PIN-based login (expandable to OAuth)
const user = await authService.login('pharmacist', '1234');
// Session stored in localStorage + local DB
// Auto-timeout after 30 minutes inactivity
// PIN re-confirmation for high-risk actions
```

**Demo Credentials:**
- Username: `pharmacist`
- PIN: `1234`

### 2. Dose Calculation (src/services/dose.ts)

The core engine that makes SEMS powerful:

```typescript
// Input: drug + patient info
const dose = await doseCalculationService.calculateDose(
  'drug-001', // Amoxicillin
  { age: 5, weight: 20, pregnancyStatus: 'no', allergies: [] }
);

// Output: Calculated dose + warnings
{
  doseMg: 100,              // 5 mg/kg × 20 kg
  frequency: 'Every 8 hours',
  duration: '7 days',
  route: 'oral',
  warnings: [],             // Age/pregnancy/allergy checks
  requiresPinConfirm: false
}
```

**Algorithm:**
1. Find applicable dosing regimen (age/weight match)
2. Parse dose expression (supports "5 mg/kg", "500 mg", ranges)
3. Apply weight-based calculations
4. Validate against max daily dose
5. Check contraindications (age, pregnancy, allergies)
6. Flag high-risk drugs

### 3. Drug Search (src/services/search.ts)

Powered by Fuse.js for fuzzy matching:

```typescript
// Tolerant of typos
await searchService.searchDrugs('amox');    // → Amoxicillin
await searchService.searchDrugs('trimox');  // → Amoxicillin (trade name)
await searchService.searchDrugs('malaria'); // → Artesunate, Artemether
```

### 4. Offline Sync (src/services/sync.ts)

Transparent sync engine:

**Offline:**
- All saves go to IndexedDB
- Changes queued locally

**Online:**
- Auto-detected via `navigator.onLine`
- Syncs pending records to backend
- Conflict resolution: timestamp + device ID

```typescript
// Listen to sync status
syncService.onStatusChange((status) => {
  console.log(`Online: ${status.isOnline}`);
  console.log(`Pending: ${status.pendingCount}`);
});
```

### 5. Label Printing (src/services/print.ts)

Two modes:

**Desktop (Tauri):**
- Direct ESC/POS commands to thermal printer
- Works offline
- Professional thermal label output

**Browser:**
- Print dialog
- PDF fallback
- Mobile-friendly

### 6. Local Database (src/lib/db.ts)

Dexie.js wrapping IndexedDB:

```typescript
// Schema
tables: {
  users,           // Pharmacist accounts
  drugs,           // ~500 STG medications
  doseRegimens,    // Weight/age dosing tables
  dispenseRecords, // All dispenses (synced to cloud)
  syncQueue,       // Records pending upload
  inventory,       // Optional: stock tracking
  alerts,          // System messages
  syncMetadata     // Last sync time, etc.
}
```

## Data Flow Examples

### Scenario 1: First Time Use (Offline)

```
1. User installs app (desktop or web)
2. Opens app → SEMSInitializer runs
3. initializeDatabase() loads sample drugs & regimens
4. DB ready (100% offline)
5. User can search and dispense without internet
```

### Scenario 2: Dispensing a Drug

```
1. Login with PIN → Session created (local)
2. Search "amoxicillin" → Fuse.js returns match
3. Enter patient: Age=5, Weight=20kg
4. Press "Calculate Dose"
   → doseCalculationService finds pediatric regimen
   → Applies: 25 mg/kg × 20kg = 500mg
   → Returns: 166mg every 8 hours
5. System shows STG citation + contraindication warnings
6. Click "Print & Complete"
   → printService generates thermal label
   → dispenseRecord saved locally
   → Added to sync queue
7. Record synced when online
```

### Scenario 3: Reconnecting to Internet

```
While Offline:
[User dispenses 10 drugs offline]
→ 10 records in syncQueue

When Internet Restored:
1. syncService detects connection
2. For each pending record:
   → POST to /api/dispenses
   → Await server response
   → Check for conflicts (timestamp + device ID)
   → Mark synced in local DB
3. Pull any broadcast updates (STG changes, etc.)
4. Notify user: "3 pending records synced"
```

## Environment Setup

### Development

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Open http://localhost:3000
# Use demo credentials: pharmacist / 1234
```

### Production

```bash
# Web deployment (Vercel)
npm run build
vercel deploy

# Desktop build (Tauri)
npm install -g @tauri-apps/cli
tauri build
# Output: src-tauri/target/release/bundle/

# Docker
docker-compose up -d
# Runs on http://localhost:3000
```

## Integration Points

### Backend API (if using Supabase or custom)

Your backend should expose:

```
POST /api/auth/login
  Body: { username, pin }
  Response: { user, token }

POST /api/dispenses
  Headers: Authorization: Bearer <token>
  Body: { dispenseRecord }
  Response: { id, synced: true }

GET /api/datasets/updates
  Response: { drugs: [...], regimens: [...], version: "2025-01-15" }

POST /api/sync/conflicts
  Resolve server-side conflicts for sensitive records
```

### Database (PostgreSQL via Supabase)

```sql
-- Create table for dispense records
CREATE TABLE dispenses (
  id UUID PRIMARY KEY,
  pharmacist_id UUID REFERENCES auth.users,
  drug_id TEXT,
  dose_mg FLOAT,
  patient_age INT,
  synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row-level security
ALTER TABLE dispenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own dispenses"
  ON dispenses FOR SELECT
  USING (auth.uid() = pharmacist_id);
```

## Testing

Run unit tests:

```bash
npm test
```

Example test structure:

```typescript
describe('DoseCalculationService', () => {
  it('calculates weight-based dose', async () => {
    const dose = await doseCalculationService.calculateDose(
      'drug-001',
      { age: 5, weight: 20, pregnancyStatus: 'no', allergies: [] }
    );
    expect(dose?.doseMg).toBe(100); // 5mg/kg × 20kg
  });
});
```

## Deployment Checklist

- [ ] Update API endpoint in `.env.production`
- [ ] Generate app icons (192x192, 512x512)
- [ ] Update manifest.json with app details
- [ ] Test offline functionality (DevTools → Network → Offline)
- [ ] Test sync with backend API
- [ ] Configure CORS on backend
- [ ] Enable PWA: `npm run build && npm start`
- [ ] Test Tauri build: `tauri build`
- [ ] Set up CI/CD pipeline (GitHub Actions, GitLab CI, etc.)

## Common Issues & Solutions

**Issue: "Drug search returns empty"**
- Solution: Verify `initializeDatabase()` ran successfully
- Check: DevTools → Application → IndexedDB → SEMSDB

**Issue: "Print doesn't work on mobile"**
- Solution: Use browser print dialog (PDF fallback)
- Test: Chrome → ⋮ → Print

**Issue: "Sync fails after reconnect"**
- Solution: Check backend API is running
- Verify: localStorage has auth token
- Check: Network tab for 401 auth errors

**Issue: "Tauri build fails on Windows"**
- Solution: Install Rust: `rustup-init.exe`
- Then: `cargo update && tauri build`

## Next Steps for Production

1. **Backend Setup**
   - Deploy API to Vercel, AWS, or self-hosted
   - Set up PostgreSQL database
   - Implement OAuth (Google, Microsoft ID)

2. **Offline Improvements**
   - Add background sync (Service Worker API)
   - Implement conflict resolution UI
   - Add data export/import

3. **Compliance**
   - GDPR: Audit logging, data export
   - Healthcare: Immutable audit logs, encryption
   - Validation: Drug interaction checker

4. **Mobile Optimization**
   - Add fingerprint/face recognition
   - Implement barcode scanning
   - Optimize for slow networks

5. **Analytics**
   - Track most-used drugs
   - Monitor dispense errors
   - Usage patterns by region

## Support & Documentation

- **Technical Docs**: See README.md
- **API Docs**: [Link to Swagger/Postman]
- **User Guide**: [Link to PDF manual]
- **Issue Tracker**: GitHub Issues
- **Email Support**: support@sems-pharmacy.app

---

**Version**: 0.1.0 Alpha  
**Last Updated**: December 2025  
**Maintainer**: SEMS Development Team
