# DPAP Phase 1 - Developer Quick Start Guide

**Your first 30 minutes with DPAP analytics**

---

## Step 1: Understand the Architecture (5 minutes)

SEMS was a **dispensing app**. DPAP adds **analytics on top**.

```
DispenseForm (SEMS)
    ↓ [creates dispensing event]
Event Processor (DPAP)
    ↓ [enriches with drug master data]
Risk Scoring (DPAP)
    ↓ [calculates risk factors]
Aggregation Engine (DPAP)
    ↓ [summarizes by hour/day]
REST API (DPAP)
    ↓ [exposes data]
Dashboard (TO DO)
    ↓ [visualizes]
Pharmacy Manager Decision
```

**Key Insights:**
- Every dispensing = one event
- Every event = one risk score
- Events aggregate into daily metrics
- APIs serve data to dashboard

---

## Step 2: Locate the Code (2 minutes)

All DPAP files are in a new folder:

```
src/services/analytics/
├── eventProcessor.ts      ← Event capture (main entry point)
├── riskScoringEngine.ts   ← Risk calculation (120 lines of medical rules)
├── eventEnricher.ts       ← Master data lookup (drug classifications)
├── aggregationEngine.ts   ← Event → analytics (rollups & grouping)
├── utils.ts               ← UI helpers
└── index.ts               ← Export hub + guides
```

Plus 3 API routes:
```
src/app/api/analytics/dispensing/
├── summary/route.ts       ← KPI endpoint (Operations Dashboard)
├── top-medicines/route.ts ← Top drugs endpoint
└── peak-hours/route.ts    ← Hourly distribution endpoint
```

---

## Step 3: Run the Tests (5 minutes)

**First, ensure dependencies are installed:**
```bash
cd d:\DEVELOPMENTS\FLASH_DEVS\SEMS\sems-app2
npm install
```

**Run DPAP tests:**
```bash
npm test -- riskScoringEngine.test.ts
```

**What you'll see:**
```
PASS  __tests__/services/analytics/riskScoringEngine.test.ts
  Risk Scoring Engine
    Paediatric Risk Scenarios
      ✓ should flag paediatric dosing (8 ms)
      ✓ should return high risk for paediatric with contraindication (5 ms)
      ✓ should flag very low weight in neonates (3 ms)
    Geriatric Risk Scenarios
      ✓ should flag geriatric dosing (2 ms)
      ✓ should return high risk for geriatric with contraindication (4 ms)
      ✓ should increase risk for elderly on controlled drugs (3 ms)
    [... 19+ more tests ...]

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Time:        2.341 s
```

---

## Step 4: Understand Risk Scoring (5 minutes)

**The core logic is in `riskScoringEngine.ts`:**

```typescript
export function calculateRiskScores(event): RiskScores {
  let riskScore = 0;
  const flags = [];

  // 1. PAEDIATRIC RISK: +30 base, +40 if contraindicated
  if (event.patientAgeGroup === 'paediatric') {
    riskScore += 30;
    if (event.drugId in PAEDIATRIC_CONTRAINDICATIONS) {
      riskScore += 40;  // ← This is why Cipro in kids = HIGH RISK
    }
  }

  // 2. GERIATRIC RISK: +20 base, +30 if contraindicated
  else if (event.patientAgeGroup === 'geriatric') {
    riskScore += 20;
    if (event.drugId in GERIATRIC_CONTRAINDICATIONS) {
      riskScore += 30;
    }
  }

  // 3. CONTROLLED SUBSTANCE: +25
  if (event.drugIsControlled) {
    riskScore += 25;
  }

  // 4. STG DEVIATION: +35
  if (!event.stgCompliant) {
    riskScore += 35;
  }

  // 5. USER OVERRIDE: +20
  if (event.overrideFlag) {
    riskScore += 20;
  }

  // ... etc ...

  // CATEGORIZE
  return {
    score: riskScore,
    category: riskScore >= 80 ? 'critical' : 
              riskScore >= 60 ? 'high' : 
              riskScore >= 40 ? 'medium' : 
              'low',
    flags: [...all flags that triggered],
  };
}
```

**Score → Action Matrix:**
| Score | Action |
|-------|--------|
| 0-19 | ✅ Allow (green) |
| 20-39 | ℹ️ Monitor (blue) |
| 40-59 | ⚠ Review (amber) |
| 60-79 | ⚠⚠ Confirm (red) |
| 80+ | 🚨 Block (dark red) |

---

## Step 5: Test Risk Scoring Manually (5 minutes)

**Create a simple Node script:**

```bash
# Create test file
cat > test-risk.js << 'EOF'
const { calculateRiskScores } = require('./src/services/analytics/riskScoringEngine.ts');

// Test 1: Safe dispensing (adult, common drug)
const safeEvent = {
  drugId: 'PARA-500',
  drugIsControlled: false,
  drugIsAntibiotic: false,
  patientAgeGroup: 'adult',
  patientIsPregnant: false,
  stgCompliant: true,
  overrideFlag: false,
};

console.log('Safe Event:', calculateRiskScores(safeEvent));
// Expected: score: 0, category: 'none', flags: []

// Test 2: High-risk (child + contraindicated antibiotic)
const highRiskEvent = {
  drugId: 'CIPRO-500',  // ← Contraindicated in children
  drugIsControlled: false,
  drugIsAntibiotic: true,
  patientAgeGroup: 'paediatric',
  patientIsPregnant: false,
  stgCompliant: true,
  overrideFlag: false,
};

console.log('High-Risk Event:', calculateRiskScores(highRiskEvent));
// Expected: score: ~70, category: 'high', flags: ['PAEDIATRIC_DOSING', 'PAEDS_CONTRAINDICATION', ...]

// Test 3: Critical (elderly + controlled + STG deviation + override)
const criticalEvent = {
  drugId: 'MORPHINE-10',
  drugIsControlled: true,  // ← +25
  drugIsAntibiotic: false,
  patientAgeGroup: 'geriatric',  // ← +20
  patientIsPregnant: false,
  stgCompliant: false,  // ← +35
  overrideFlag: true,   // ← +20
};

console.log('Critical Event:', calculateRiskScores(criticalEvent));
// Expected: score: ~100, category: 'critical', flags: [many]
EOF

# Run it
npx ts-node test-risk.js
```

**Or use the test suite:**
```bash
npm test -- riskScoringEngine.test.ts --verbose
```

---

## Step 6: Test the APIs (5 minutes)

**Assuming `npm run dev` is running on localhost:3000...**

### Query 1: Get Daily Summary KPIs

```bash
curl "http://localhost:3000/api/analytics/dispensing/summary?startDate=2026-02-01&endDate=2026-02-09"
```

**Expected Response:**
```json
{
  "data": {
    "totalPrescriptions": 1250,
    "totalOTC": 340,
    "avgDispensingTime": 2.3,
    "prescriptionRatio": 0.786,
    "highRiskEvents": 45,
    "stgComplianceRate": 94.2,
    "trend": [
      {"hour": 0, "count": 12, "prescriptionCount": 8},
      {"hour": 1, "count": 5, "prescriptionCount": 3},
      ...24 hours total
    ]
  },
  "metadata": {...}
}
```

### Query 2: Top Medicines

```bash
curl "http://localhost:3000/api/analytics/dispensing/top-medicines?startDate=2026-02-01&limit=5"
```

**Expected Response:**
```json
{
  "data": [
    {
      "drugId": "AMOX-500",
      "genericName": "Amoxicillin",
      "count": 450,
      "prescriptions": 420,
      "otc": 30,
      "mostCommonRiskLevel": "none"
    },
    ...
  ]
}
```

### Query 3: Peak Hours (for heatmap)

```bash
curl "http://localhost:3000/api/analytics/dispensing/peak-hours?startDate=2026-02-01&endDate=2026-02-09"
```

**Expected Response:**
```json
{
  "data": {
    "hours": [
      {"hour": 0, "count": 12, ...},
      ...
      {"hour": 14, "count": 189, ...},  // Peak!
      ...
    ],
    "peakHour": {"hour": 14, "count": 189, "timeRange": "14:00 - 15:00"},
    "statistics": {
      "totalTransactions": 1590,
      "busyHours": 12,
      "avgPerHour": 66.25
    }
  }
}
```

---

## Step 7: Understand Event Flow (5 minutes)

**This is how data flows through DPAP:**

### Flow 1: DispenseForm → Event Capture

```typescript
// In DispenseForm component (TO DO - needs to be added):

import { captureDispensingEvent } from '@/services/analytics/eventProcessor';

const handleSaveAndPrint = async () => {
  // 1. Save to SEMS database (existing code)
  const dispenseRecord = await saveDispenseRecord({
    userId: currentUser.id,
    drugId: form.drugId,
    dose: form.dosage,
    quantity: form.quantity,
  });

  // 2. NEW: Capture analytics event
  const event = await captureDispensingEvent({
    dispenseRecordId: dispenseRecord.id,
    timestamp: new Date(),
    pharmacyId: 'PHA001',
    userId: currentUser.id,
    drugId: form.drugId,
    patientAgeGroup: 'adult',  // NEW: from dropdown
    isPrescription: true,
    isControlledDrug: false,
    stgCompliant: true,
  });

  // 3. Check if alert needed
  if (event.highRiskFlag) {
    showAlert('High-risk dispensing detected!');
    // Require confirmation before print
  } else {
    printLabel();
  }
};
```

### Flow 2: Event Processing

```
Input Event:
{
  drugId: 'CIPRO-500',
  patientAgeGroup: 'paediatric',
  isPrescription: true,
  stgCompliant: true,
  ...
}
    ↓
[Enricher] Add master data
{
  drugId: 'CIPRO-500',
  drugGenericName: 'Ciprofloxacin',
  drugClass: 'antibiotic',
  drugIsControlled: false,
  drugIsAntibiotic: true,
  ...
}
    ↓
[Risk Scorer] Calculate risk
{
  riskScore: 70,
  riskCategory: 'high',
  riskFlags: ['PAEDIATRIC_DOSING', 'PAEDS_CONTRAINDICATION', 'ANTIBIOTIC_STEWARDSHIP_FLAG'],
  highRiskFlag: true,
}
    ↓
[Save to DB] Store in PostgreSQL
    ↓
[Aggregation] Every hour: summarize events into daily_summary
    ↓
[API] Query fast-aggregated data for dashboard
```

---

## Step 8: Key Files to Read (in order)

Start with these (shortest to longest):

1. **`index.ts`** (150 lines) - Overview + quick start patterns
2. **`utils.ts`** (250 lines) - UI helpers (easier to understand)
3. **`riskScoringEngine.ts`** (350 lines) - Core risk logic
4. **`eventProcessor.ts`** (250 lines) - Orchestration
5. **`aggregationEngine.ts`** (420 lines) - Transformations
6. **`eventEnricher.ts`** (280 lines) - Master data

**Time:** ~45 minutes to read everything

---

## Step 9: Your First Integration Task

**Easy:**
1. Look at `DispenseForm.tsx` (existing component)
2. Add patient age group dropdown:
   ```tsx
   <select value={patientAge} onChange={(e) => setPatientAge(e.target.value)}>
     <option>Paediatric (0-12)</option>
     <option>Adult (13-64)</option>
     <option>Geriatric (65+)</option>
   </select>
   ```
3. On "Save & Print" button, call:
   ```typescript
   const event = await captureDispensingEvent({...});
   if (event.highRiskFlag) showAlert('High-risk!');
   ```

**That's it!** Now SEMS captures analytics events.

---

## Step 10: Common Questions

**Q: Where does the data come from?**  
A: Currently mock data in `aggregationEngine.ts`. After Prisma migration, it'll query PostgreSQL `dispensing_events` table.

**Q: How do I add custom risk rules?**  
A: Edit `riskScoringEngine.ts` → add new condition in `calculateRiskScores()` → increment `riskScore` and add flag → test with new test case.

**Q: Can I test without a database?**  
A: Yes! Everything works in-memory. APIs return mock data. No DB setup needed for Phase 1 development.

**Q: Where does the dashboard go?**  
A: Create `src/app/analytics/operations/page.tsx` in Week 3. It'll call these APIs to display charts.

**Q: How's it different from operations APIs in existing SEMS?**  
A: Existing SEMS tracks **user transactions**. DPAP tracks **pharmacy events** for analytics. Different purpose, different structure.

---

## Your Checklist for Today

- ✅ Read this guide
- ✅ Run `npm test -- riskScoringEngine.test.ts`
- ✅ Read `src/services/analytics/index.ts`
- ✅ Read `src/services/analytics/riskScoringEngine.ts`
- ✅ Curl one of the APIs
- ✅ Understand risk score ranges (0-19=safe, 80+=critical)
- ✅ Know where to make first integration (DispenseForm)

---

## Next Steps (Week 3)

After you're comfortable with this architecture:

1. **UI Components**
   - Create `/analytics/operations/page.tsx`
   - Build DailyTrendChart, TopMedicinesChart, PeakHoursHeatmap
   - Wire up to API endpoints

2. **Database**
   - Create Prisma migration: `dispensing_events` table
   - Run migration: `npx prisma migrate dev`
   - Replace mock data with real PostgreSQL queries

3. **Integration**
   - Update DispenseForm to capture events
   - Test end-to-end: form → DB → API → dashboard
   - Show dashboard to pharmacy manager

---

## Useful Commands

```bash
# Run tests
npm test -- riskScoringEngine.test.ts

# Run with coverage
npm test -- riskScoringEngine.test.ts --coverage

# Start dev server
npm run dev

# Type-check (no build)
npx tsc --noEmit

# Lint check
npm run lint

# Check for unused code
npx knip

# Format code
npx prettier --write src/services/analytics/**/*.ts
```

---

## Resources

- **Architecture:** Read [DPAP_INTEGRATION_ANALYSIS.md](DPAP_INTEGRATION_ANALYSIS.md)
- **Implementation Plan:** See [DPAP_PHASE1_CHECKLIST.md](DPAP_PHASE1_CHECKLIST.md)
- **Visual Guide:** Check [DPAP_ARCHITECTURE_VISUAL.md](DPAP_ARCHITECTURE_VISUAL.md)
- **Type System:** Reference [src/types/analytics.ts](src/types/analytics.ts)
- **API Examples:** Find [src/app/api/analytics/...](src/app/api/analytics/)

---

**You're ready! Start with the tests. 🚀**

