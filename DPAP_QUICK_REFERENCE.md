# DPAP Integration - Quick Reference Guide

**Target Audience:** Development Team, Project Managers  
**Last Updated:** February 9, 2026

---

## TL;DR - What is DPAP?

**SEMS** is a pharmacy dispensing app (event generator).  
**DPAP** is an analytics platform that consumes those events and turns them into dashboards.

Think of it like this:
- **SEMS** = Camera recording dispensings
- **DPAP** = Film editor analyzing the footage to generate insights

---

## What's in Scope for Phase 1?

### ✅ Build
1. **Event Capture Schema** - New `dispensing_events` table in PostgreSQL
2. **Risk Scoring Engine** - Identify high-risk prescriptions
3. **Operations Dashboard** - For pharmacy managers
4. **Analytics API** - Query endpoints for data
5. **TimescaleDB** - Time-series analytics database

### ❌ NOT in Phase 1 (Future)
- Safety Dashboard
- Compliance Dashboard
- Intelligence Dashboard (Forecasting)
- FDA/MOH integrations
- Mobile apps

---

## Where Do I Start?

### For Frontend Developers
1. Read: [DPAP_ARCHITECTURE_VISUAL.md](DPAP_ARCHITECTURE_VISUAL.md) → "Operations Dashboard Component"
2. Task: Build `/analytics/operations/page.tsx` with 4 charts
3. Reference: [DPAP_PHASE1_CHECKLIST.md](DPAP_PHASE1_CHECKLIST.md) → "Week 3: Operations Dashboard UI"

### For Backend Developers
1. Read: [DPAP_INTEGRATION_ANALYSIS.md](DPAP_INTEGRATION_ANALYSIS.md) → "3. DPAP Module Structure"
2. Task: Build analytics services (`eventProcessor`, `riskScoringEngine`, `aggregationEngine`)
3. Reference: [DPAP_PHASE1_CHECKLIST.md](DPAP_PHASE1_CHECKLIST.md) → "Week 2: Analytics Foundation Services"

### For Database Engineers
1. Read: [DPAP_INTEGRATION_ANALYSIS.md](DPAP_INTEGRATION_ANALYSIS.md) → "6. Database Migration Strategy"
2. Task: Create Prisma migration + TimescaleDB setup
3. Reference: [DPAP_PHASE1_CHECKLIST.md](DPAP_PHASE1_CHECKLIST.md) → "Week 1: Database Schema Extension"

### For DevOps / Infrastructure
1. Read: [DPAP_INTEGRATION_ANALYSIS.md](DPAP_INTEGRATION_ANALYSIS.md) → "8. Technology Stack Summary"
2. Task: Add TimescaleDB + Redis to docker-compose.yml
3. Reference: [DPAP_PHASE1_CHECKLIST.md](DPAP_PHASE1_CHECKLIST.md) → "Configuration & Deployment"

---

## Key Files to Know (New DPAP Code)

```
src/
├─ app/analytics/                    (Frontend pages)
│  └─ operations/page.tsx             ← Pharmacy Manager Dashboard
├─ app/api/analytics/                (Backend API)
│  └─ dispensing/summary/route.ts     ← KPI query endpoint
├─ services/analytics/               (Business Logic)
│  ├─ eventProcessor.ts              ← Captures event flow
│  ├─ riskScoringEngine.ts           ← Calculates risk
│  └─ aggregationEngine.ts           ← Builds aggregates
├─ lib/analytics/                    (Utilities)
│  ├─ olap-schema.ts
│  ├─ risk-rules.ts
│  └─ compliance-rules.ts
└─ store/analyticsStore.ts           (Zustand state)
```

---

## Context: How Events Flow (Simplified)

```
1. Pharmacist fills DispenseForm (SEMS)
   └─ Selects patient age, drug, dosage, Rx or OTC

2. On save, call captureDispensingEvent() (NEW)
   └─ Enriches data with drug metadata
   └─ Calculates risk score
   └─ Saves to PostgreSQL

3. Background job aggregates events every hour
   └─ Summarizes: "100 Rx, 30 OTC, avg 2.5s time"
   └─ Saves summary to TimescaleDB

4. Dashboard queries TimescaleDB for fast results
   └─ Shows: Daily trend, top medicines, peak hours
   └─ Loads in < 3 seconds
```

---

## Risk Scoring Quick Logic

All events get a risk score (0-100). Score determines category:

| Risk Score | Category | Example |
|------------|----------|---------|
| 0-19      | **none** | Adult, common drug, STG compliant, no override |
| 20-39     | **low** | Geriatric + STG compliant |
| 40-59     | **medium** | Controlled drug, no contraindications |
| 60-79     | **high** | Paediatric + potential contraindication |
| 80+       | **critical** | Paediatric + contraindicated drug + override |

**High/Critical Events Trigger Alerts** → Clinical pharmacist reviews

---

## Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (for TimescaleDB)

### Quick Start
```bash
# 1. Install deps
npm install

# 2. Start databases
docker-compose up -d timescaledb redis

# 3. Run Prisma migration
npx prisma migrate dev --name add-dispensing-events-table

# 4. Start dev server
npm run dev

# 5. Test: Open http://localhost:3000/analytics/operations
```

### Environment Variables
```bash
# .env.local

# Existing SEMS
DATABASE_URL="postgresql://..."

# NEW analytics
TIMESCALEDB_URL="postgresql://user:pass@localhost:5432/timescale_analytics"
REDIS_URL="redis://localhost:6379"
ANALYTICS_CACHE_TTL=300  # 5 minutes

# APIs
NEXT_PUBLIC_API_BASE="http://localhost:3000"
```

---

## API Quick Reference

### Query Dashboard Data
```bash
# Get summary KPIs (total prescriptions, avg time, etc.)
GET /api/analytics/dispensing/summary?startDate=2026-02-01&endDate=2026-02-09&pharmacyId=PHA001

# Response:
{
  "totalPrescriptions": 1250,
  "totalOTC": 340,
  "avgDispensingTime": 2.3,
  "prescriptionRatio": 0.786,
  "trend": [
    { "date": "2026-02-01", "count": 186 },
    { "date": "2026-02-02", "count": 192 },
    ...
  ]
}
```

### Get Top Medicines
```bash
GET /api/analytics/dispensing/top-medicines?startDate=2026-02-01&limit=10

# Response:
[
  { "drugName": "Amoxicillin 500mg", "count": 450, "revenue": "$2,250" },
  { "drugName": "Paracetamol 500mg", "count": 380, "revenue": "$1,900" },
  ...
]
```

### Get Peak Hours
```bash
GET /api/analytics/dispensing/peak-hours?startDate=2026-02-01&endDate=2026-02-09

# Response:
{
  "hours": [0, 1, 2, ..., 23],
  "counts": [5, 8, 12, ..., 45],
  "peakHour": 14  # 2 PM is busiest
}
```

---

## Testing Checklist

### Before Committing Code
- [ ] Unit tests pass: `npm test`
- [ ] No TypeScript errors: `npm run lint`
- [ ] New files include docstrings
- [ ] Risk scoring logic validated with pharmacist

### Before Phase 1 Launch
- [ ] 100+ manual test events created and verified
- [ ] Dashboard loads in < 3 seconds
- [ ] API response < 500ms
- [ ] Access control tested (Free tier blocks analytics)
- [ ] No data loss during sync

---

## Common Tasks

### Add a New Dashboard Chart
1. Create component: `src/app/analytics/operations/components/NewChart.tsx`
2. Add data query to API if needed
3. Import in `page.tsx`
4. Test with sample data

### Add a New Risk Rule
1. Edit: `src/lib/analytics/risk-rules.ts`
2. Update `calculateRiskScores()` in `eventProcessor.ts`
3. Add test case in `__tests__/riskScoringEngine.test.ts`
4. Document in risk rule comments

### Query Events Directly
```typescript
// For debugging
import { db } from '@/lib/db';

const events = await db.dispensing_events.findMany({
  where: {
    riskCategory: 'critical',
    timestamp: { gte: new Date('2026-02-01') }
  },
  limit: 10
});
```

---

## Troubleshooting

### Issue: Dashboard loads but shows no data
**Solution:** Check if events are being captured
```bash
# Query direct database
npx prisma studio

# Look in dispensing_events table
# If empty, check DispenseForm is calling captureDispensingEvent()
```

### Issue: API returns 403 Unauthorized
**Solution:** Check subscription tier
```typescript
// In /api/analytics/..., make sure:
const user = await getUser(request);
await requireDashboardAccess(user, 'operations');  // ← Check here
```

### Issue: Dashboard loads slow (> 3 seconds)
**Solution:** Check TimescaleDB aggregates are built
```sql
-- In PostgreSQL
SELECT * FROM daily_dispensing_summary LIMIT 1;
-- If empty, aggregation job hasn't run yet
-- Check queue/logs
```

---

## Quick Links to Full Docs

| Document | Purpose |
|----------|---------|
| [DPAP_INTEGRATION_ANALYSIS.md](DPAP_INTEGRATION_ANALYSIS.md) | Full architecture & design rationale |
| [DPAP_PHASE1_CHECKLIST.md](DPAP_PHASE1_CHECKLIST.md) | Detailed task breakdown by week |
| [DPAP_ARCHITECTURE_VISUAL.md](DPAP_ARCHITECTURE_VISUAL.md) | Code examples & integration points |
| [API_DOCS.md](API_DOCS.md) | Existing SEMS API endpoints |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | Original SEMS implementation |

---

## Questions?

### Architecture Questions
→ See [DPAP_INTEGRATION_ANALYSIS.md](DPAP_INTEGRATION_ANALYSIS.md) Section 2: "Current SEMS vs DPAP Requirements"

### Implementation Questions
→ See [DPAP_ARCHITECTURE_VISUAL.md](DPAP_ARCHITECTURE_VISUAL.md) "Code Skeleton" section

### Task Breakdown Questions
→ See [DPAP_PHASE1_CHECKLIST.md](DPAP_PHASE1_CHECKLIST.md)

### Risk Rules Questions
→ See [DPAP_INTEGRATION_ANALYSIS.md](DPAP_INTEGRATION_ANALYSIS.md) Section 3.2: "Risk Scoring Engine"

---

## Glossary

| Term | Definition |
|------|-----------|
| **SEMS** | Smart Expense/Dispensing Management System (core app) |
| **DPAP** | Dosage Printing Analytics Platform (analytics layer) |
| **Event** | Single dispensing action with metadata (drug, dose, patient age, etc.) |
| **OLTP** | Online Transaction Processing (PostgreSQL - current state) |
| **OLAP** | Online Analytical Processing (TimescaleDB - aggregated/historical) |
| **Risk Score** | Numeric (0-100) indicating medication safety risk |
| **STG** | Standard Treatment Guidelines (Ghana national guidelines) |
| **Rx** | Prescription (requires doctor note) |
| **OTC** | Over-the-counter (no prescription) |
| **Hypertable** | TimescaleDB time-series table (auto-partitioned) |

---

## Success = We're Done When...

✅ Pharmacist can see daily dispensing trends  
✅ Manager knows which medicines are top sellers  
✅ Manager knows what time of day is busiest  
✅ High-risk prescriptions are flagged  
✅ Dashboard loads in < 3 seconds  
✅ Team can deploy to production confidently

---

**Status:** Ready to start Phase 1 implementation  
**Go/No-Go Decision:** Pending stakeholder approval  
**Next Step:** Sprint planning with frontend + backend leads

