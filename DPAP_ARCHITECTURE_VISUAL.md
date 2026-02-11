# SEMS + DPAP Integration Architecture Visual

---

## System Overview: How They Work Together

```
PHARMACY STAFF
     │
     ├─── [Pharmacist]
     │         │
     │         ├─ SEMS: Search drug
     │         ├─ SEMS: Enter patient age
     │         ├─ SEMS: Select dosage
     │         ├─ SEMS: Confirm STG
     │         ├─ SEMS: Print label
     │         │
     │         └─ Event Generated!
     │              │
     │              └─ {timestamp, drug_id, patient_age, stg_compliant, ...}
     │
     └─── [Pharmacy Manager]
              │
              ├─ DPAP: View Operations Dashboard
              ├─ DPAP: See daily trends (# dispensings)
              ├─ DPAP: See top medicines
              ├─ DPAP: See peak hours
              │
              └─ Decisions:
                  ├─ Adjust staffing for busy hours?
                  ├─ Stock more of top medicines?
                  └─ Track revenue trends?


CLINICAL PHARMACIST
     │
     └─── [Safety Officer]
              │
              ├─ DPAP: View Safety Dashboard
              ├─ DPAP: See HIGH-RISK alerts
              ├─ DPAP: See STG deviations
              ├─ DPAP: See paediatric/geriatric prescriptions
              │
              └─ Actions:
                  ├─ Review flagged dispensings
                  ├─ Document near-misses
                  └─ Update protocols?


HOSPITAL ADMINISTRATOR
     │
     └─── [Compliance Officer]
              │
              ├─ DPAP: View Compliance Dashboard
              ├─ DPAP: STG compliance score (%)
              ├─ DPAP: Antibiotic stewardship metrics
              ├─ DPAP: Controlled medicine tracking
              │
              └─ Outputs:
                  ├─ Regulatory audit reports (PDF/CSV)
                  ├─ FDA compliance submission
                  └─ MOH STG adherence report


EXECUTIVE / CHAIN DIRECTOR
     │
     └─── [Supply Chain Lead]
              │
              ├─ DPAP: View Intelligence Dashboard
              ├─ DPAP: Demand forecasting (30/60/90 days)
              ├─ DPAP: Regional consumption trends
              ├─ DPAP: Benchmarking vs other sites
              │
              └─ Strategy:
                  ├─ Forecast medicine stock levels?
                  ├─ Identify regional demand patterns?
                  └─ Where to expand next?
```

---

## Data Flow Diagram: From Dispensing to Insights

```
┌─────────────────────────────────────┐
│   1. DISPENSE EVENT CREATED         │
│   (SEMS DispenseForm)               │
│                                     │
│   DispenseForm.tsx                  │
│   ├─ Drug selected                  │
│   ├─ Patient age: "adult"           │
│   ├─ Dose calculated: "500mg"       │
│   ├─ STG compliant: true            │
│   ├─ Click "SAVE & PRINT"           │
│   └─ ✓ Record created               │
└────────────────┬────────────────────┘
                 │
                 ├─ Call captureDispensingEvent()
                 │
                 v
┌─────────────────────────────────────┐
│   2. EVENT ENRICHMENT & VALIDATION  │
│   (analyticsService)                │
│                                     │
│   enrichEvent({                     │
│     timestamp: now,                 │
│     pharmacy_id: "PHA001",          │
│     user_id: "USR123",              │
│     drug_code: "AMOX-500",          │
│     patient_age_group: "adult",     │
│     stg_compliant: true,            │
│     + lookup drug_class from DB     │
│     + lookup contraindications      │
│   })                                │
└────────────────┬────────────────────┘
                 │
                 ├─ validateDispensingEvent()
                 ├─ Passes validation ✓
                 │
                 v
┌─────────────────────────────────────┐
│   3. RISK SCORING                   │
│   (riskScoringEngine)               │
│                                     │
│   riskScore = 0                     │
│   patient_age = "adult" → 0         │
│   drug = AMOX (not controlled)→ 0   │
│   stg_compliant = true → 0          │
│   override = false → 0              │
│   ─────────────────                 │
│   TOTAL RISK: 0 → "none"            │
│                                     │
│   Return: {                         │
│     riskScore: 0,                   │
│     riskCategory: "none",           │
│     flags: []                       │
│   }                                 │
└────────────────┬────────────────────┘
                 │
                 ├─ saveToOLTP({...enriched...})
                 │
                 v
┌─────────────────────────────────────┐
│   4. SAVE TO POSTGRESQL (OLTP)      │
│                                     │
│   INSERT INTO dispensing_events (   │
│     event_id: UUID,                 │
│     pharmacy_id, user_id,           │
│     drug_id, drug_code,             │
│     patient_age_group,              │
│     timestamp: now,                 │
│     stg_compliant: true,            │
│     risk_category: 'none',          │
│     ...                             │
│   ) VALUES (...)                    │
│                                     │
│   ✓ Record in PostgreSQL            │
│   ✓ Event ID: event_12345           │
└────────────────┬────────────────────┘
                 │
                 ├─ queueForOLAP()
                 │
                 v
┌─────────────────────────────────────┐
│   5. QUEUE FOR ANALYTICS PROCESSING │
│   (Bull Queue in background)        │
│                                     │
│   Job: {                            │
│     type: "aggregate_metrics",      │
│     date: "2026-02-09",             │
│     pharmacy_id: "PHA001",          │
│     priority: "low"                 │
│   }                                 │
│                                     │
│   Added to processing queue         │
│   Will run in background ↓          │
└────────────────┬────────────────────┘
                 │
                 ├─ aggregationEngine.aggregateDailyMetrics()
                 │   (Runs every hour)
                 │
                 v
┌─────────────────────────────────────┐
│   6. AGGREGATE FOR OLAP             │
│   (TimescaleDB/ClickHouse)          │
│                                     │
│   SELECT                            │
│     COUNT(*) as total_dispensings,  │
│     COUNT(CASE WHEN is_prescription │
│       THEN 1 END) as prescriptions, │
│     AVG(print_duration_sec) as avg  │
│     time,                           │
│     COUNT(DISTINCT drug_id),        │
│     ...                             │
│   FROM dispensing_events            │
│   WHERE date = '2026-02-09'         │
│     AND pharmacy_id = 'PHA001'      │
│                                     │
│   INSERT INTO daily_summary (...)   │
│   ✓ Aggregates stored               │
│   ✓ Ready for fast queries          │
└────────────────┬────────────────────┘
                 │
                 ├─ Materialize continuous aggregates
                 │   (30-day rolling averages)
                 │
                 v
┌─────────────────────────────────────┐
│   7. DASHBOARD QUERIES              │
│   (Operations Dashboard)            │
│                                     │
│   GET /api/analytics/dispensing/   │
│       summary?                      │
│     startDate=2026-02-01&           │
│     endDate=2026-02-09&             │
│     pharmacyId=PHA001               │
│                                     │
│   ✓ Fast query (pre-aggregated)     │
│     Response: {                     │
│       total_prescriptions: 1250,    │
│       total_otc: 340,               │
│       avg_dispensing_time: 2.3s,    │
│       trend: [{                     │
│         date: "2026-02-01",         │
│         count: 186                  │
│       }, ... ]                      │
│     }                               │
└────────────────┬────────────────────┘
                 │
                 v
┌─────────────────────────────────────┐
│   8. DASHBOARD RENDERS              │
│   (React Components)                │
│                                     │
│   <DailyTrendChart                  │
│     data={trend}                    │
│     title="Dispensings by Day"      │
│   />                                │
│                                     │
│   ✓ Line chart: 1250 Rx, 340 OTC   │
│   ✓ Updates in real-time (5min)     │
│   ✓ Manager sees trends             │
└─────────────────────────────────────┘
```

---

## Code Skeleton: Key Integration Files

### File 1: Enhanced DispenseForm.tsx

```typescript
// src/components/DispenseForm.tsx (MODIFIED)
import { captureDispensingEvent } from '@/services/analytics/eventProcessor';

export function DispenseForm() {
  const [form, setForm] = useState({
    drugId: '',
    dosage: '',
    quantity: '',
    patientAgeGroup: 'adult',  // NEW: select dropdown
    isPrescription: true,       // NEW: toggle
    // ... existing fields
  });

  const [riskIndicator, setRiskIndicator] = useState<RiskLevel>('none');

  const handleDrugSelect = (drug: Drug) => {
    setForm(prev => ({ ...prev, drugId: drug.id }));
    
    // NEW: Check if controlled drug
    if (drug.isControlled) {
      setRiskIndicator('medium');
    }
  };

  const handleAgeGroupChange = (ageGroup: string) => {
    setForm(prev => ({ ...prev, patientAgeGroup: ageGroup }));
    
    // NEW: Adjust risk indicator based on age + current drug
    const drug = drugs.find(d => d.id === form.drugId);
    if (ageGroup === 'paediatric' && drug?.hasContraindicationsInChildren) {
      setRiskIndicator('high');
    }
  };

  const handleSaveAndPrint = async () => {
    try {
      // 1. Save dispense record (existing SEMS logic)
      const dispenseRecord = await saveDispenseRecord({
        userId: currentUser.id,
        drugId: form.drugId,
        dose: form.dosage,
        quantity: form.quantity,
      });

      // 2. NEW: Capture enriched event for DPAP
      const event = await captureDispensingEvent({
        dispenseRecordId: dispenseRecord.id,
        timestamp: new Date(),
        pharmacyId: currentPharmacy.id,
        userId: currentUser.id,
        drugId: form.drugId,
        patientAgeGroup: form.patientAgeGroup,
        isPrescription: form.isPrescription,
        isControlledDrug: drugs.find(d => d.id === form.drugId)?.isControlled,
        // ... other fields from enrichment
      });

      // 3. Check if high-risk alert should be shown
      if (event.highRiskFlag) {
        showAlert({
          type: 'warning',
          title: 'High-Risk Dispensing',
          message: `This prescription has been flagged as high-risk: ${event.riskFlags.join(', ')}`,
          actions: [
            { label: 'Proceed', onClick: () => print(dispenseRecord) },
            { label: 'Review', onClick: () => openReviewModal(event) },
          ]
        });
      } else {
        print(dispenseRecord);
      }
    } catch (error) {
      console.error('Error saving dispensing event:', error);
      showAlert({ type: 'error', message: 'Failed to save event' });
    }
  };

  return (
    <form onSubmit={handleSaveAndPrint}>
      {/* Existing fields */}
      <input placeholder="Drug name..." />
      <input placeholder="Dosage..." />

      {/* NEW: Patient age group selector */}
      <select value={form.patientAgeGroup} onChange={(e) => handleAgeGroupChange(e.target.value)}>
        <option value="paediatric">Paediatric (0-12)</option>
        <option value="adult">Adult (13-64)</option>
        <option value="geriatric">Geriatric (65+)</option>
      </select>

      {/* NEW: Prescription toggle */}
      <label>
        <input 
          type="checkbox" 
          checked={form.isPrescription}
          onChange={(e) => setForm(prev => ({ ...prev, isPrescription: e.target.checked }))}
        />
        This is a prescription
      </label>

      {/* NEW: Risk indicator badge */}
      {riskIndicator !== 'none' && (
        <div className={`risk-badge risk-${riskIndicator}`}>
          ⚠ {riskIndicator.toUpperCase()} RISK
        </div>
      )}

      <button type="submit">Save & Print</button>
    </form>
  );
}
```

### File 2: Event Processor Service

```typescript
// src/services/analytics/eventProcessor.ts (NEW)

import { db } from '@/lib/db';
import { calculateRiskScores } from './riskScoringEngine';
import { enrichEvent } from './eventEnricher';
import { dispensingEventQueue } from '@/lib/queue';

export interface DispensingEventInput {
  dispenseRecordId: string;
  timestamp: Date;
  pharmacyId: string;
  userId: string;
  drugId: string;
  patientAgeGroup: 'paediatric' | 'adult' | 'geriatric';
  isPrescription: boolean;
  isControlledDrug: boolean;
}

export interface DispensingEventOutput {
  eventId: string;
  riskScore: number;
  riskCategory: 'none' | 'low' | 'medium' | 'high' | 'critical';
  riskFlags: string[];
  highRiskFlag: boolean;
  stgCompliant: boolean;
}

/**
 * Main entry point: Capture a dispensing event
 * Flow: Validate → Enrich → Risk Score → Save OLTP → Queue OLAP
 */
export async function captureDispensingEvent(
  input: DispensingEventInput
): Promise<DispensingEventOutput> {
  try {
    // 1. Validate input
    const validated = validateDispensingEvent(input);

    // 2. Enrich with master data
    const enriched = await enrichEvent(validated);

    // 3. Calculate risk scores
    const riskScores = calculateRiskScores(enriched);

    // 4. Check STG compliance
    const stgCompliant = await checkSTGCompliance(enriched, riskScores);

    // 5. Create final event object
    const event = {
      eventId: crypto.randomUUID(),
      pharmacyId: input.pharmacyId,
      userId: input.userId,
      drugId: input.drugId,
      patientAgeGroup: input.patientAgeGroup,
      isPrescription: input.isPrescription,
      timestamp: input.timestamp,
      ...enriched,
      riskScore: riskScores.score,
      riskCategory: riskScores.category,
      riskFlags: riskScores.flags,
      highRiskFlag: riskScores.category in ['high', 'critical'],
      stgCompliant,
    };

    // 6. Save to OLTP (PostgreSQL)
    const saved = await saveToOLTP(event);

    // 7. Queue for OLAP processing
    await dispensingEventQueue.add('process_event', { eventId: saved.eventId });

    return {
      eventId: saved.eventId,
      riskScore: event.riskScore,
      riskCategory: event.riskCategory,
      riskFlags: event.riskFlags,
      highRiskFlag: event.highRiskFlag,
      stgCompliant: event.stgCompliant,
    };
  } catch (error) {
    console.error('[DPAP] Error capturing dispensing event:', error);
    throw new AnalyticsError('Failed to capture dispensing event', error);
  }
}

export async function saveToOLTP(event: any) {
  return await db.dispensing_events.create({
    eventId: event.eventId,
    pharmacyId: event.pharmacyId,
    userId: event.userId,
    drugId: event.drugId,
    drugCode: event.drugCode,
    drugGenericName: event.drugGenericName,
    drugClass: event.drugClass,
    drugIsControlled: event.drugIsControlled,
    patientAgeGroup: event.patientAgeGroup,
    isPrescription: event.isPrescription,
    isOTC: !event.isPrescription,
    timestamp: event.timestamp,
    stgCompliant: event.stgCompliant,
    riskCategory: event.riskCategory,
    riskScore: event.riskScore,
    highRiskFlag: event.highRiskFlag,
    // ... other fields
  });
}

function validateDispensingEvent(input: DispensingEventInput) {
  const errors = [];

  if (!input.pharmacyId) errors.push('pharmacyId required');
  if (!input.userId) errors.push('userId required');
  if (!input.drugId) errors.push('drugId required');
  if (!['paediatric', 'adult', 'geriatric'].includes(input.patientAgeGroup)) {
    errors.push('Invalid patientAgeGroup');
  }

  if (errors.length > 0) {
    throw new ValidationError(`Event validation failed: ${errors.join(', ')}`);
  }

  return input;
}

async function checkSTGCompliance(enriched: any, riskScores: any): Promise<boolean> {
  // TODO: Implement STG rule engine
  // Return true if dispensing follows Ghana STG guidelines
  return !riskScores.flags.includes('STG_DEVIATION');
}
```

### File 3: Risk Scoring Engine

```typescript
// src/services/analytics/riskScoringEngine.ts (NEW)

import { PAEDIATRIC_CONTRAINDICATIONS, GERIATRIC_CONTRAINDICATIONS } from '@/lib/analytics/risk-rules';

export interface RiskScores {
  score: number;
  category: 'none' | 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
}

export function calculateRiskScores(event: any): RiskScores {
  let riskScore = 0;
  const flags: string[] = [];

  // 1. PAEDIATRIC RISK (0-12 years)
  if (event.patientAgeGroup === 'paediatric') {
    riskScore += 30;
    flags.push('PAEDIATRIC_DOSING');

    // Check contraindications
    if (event.drugId in PAEDIATRIC_CONTRAINDICATIONS) {
      riskScore += 40;
      flags.push('PAEDS_CONTRAINDICATION');
    }

    // Weight-based dosing
    if (event.patientWeightKg && event.patientWeightKg < 5) {
      riskScore += 20;
      flags.push('VERY_LOW_WEIGHT');
    }
  }

  // 2. GERIATRIC RISK (65+ years)
  else if (event.patientAgeGroup === 'geriatric') {
    riskScore += 20;
    flags.push('GERIATRIC_DOSING');

    if (event.drugId in GERIATRIC_CONTRAINDICATIONS) {
      riskScore += 30;
      flags.push('GERIATRIC_CONTRAINDICATION');
    }
  }

  // 3. CONTROLLED MEDICINE RISK
  if (event.drugIsControlled) {
    riskScore += 25;
    flags.push('CONTROLLED_SUBSTANCE');
  }

  // 4. STG DEVIATION
  if (!event.stgCompliant) {
    riskScore += 35;
    flags.push('STG_DEVIATION');
  }

  // 5. OVERRIDE FLAG
  if (event.overrideFlag) {
    riskScore += 20;
    flags.push('USER_OVERRIDE');
  }

  // 6. ANTIBIOTIC WITHOUT INDICATION
  if (event.drugClass === 'antibiotic' && !event.indicationCode) {
    riskScore += 15;
    flags.push('ANTIBIOTIC_NO_INDICATION');
  }

  // 7. PREGNANCY RISK
  if (event.patientIsPregnant && event.drugClass in PREGNANCY_CONTRAINDICATIONS) {
    riskScore += 40;
    flags.push('PREGNANCY_CONTRAINDICATION');
  }

  // Determine category
  const category =
    riskScore >= 80
      ? 'critical'
      : riskScore >= 60
      ? 'high'
      : riskScore >= 40
      ? 'medium'
      : riskScore >= 20
      ? 'low'
      : 'none';

  return { score: riskScore, category, flags };
}
```

### File 4: Analytics API Route

```typescript
// src/app/api/analytics/dispensing/summary/route.ts (NEW)

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/requireAuth';
import { requireDashboardAccess } from '@/lib/middleware/requireDashboardAccess';
import { db } from '@/lib/db';

interface QueryParams {
  startDate: string;  // ISO date: "2026-02-01"
  endDate: string;
  pharmacyId?: string;
  interval?: 'day' | 'hour';
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await requireAuth(request);

    // 2. Check dashboard access
    await requireDashboardAccess(user, 'operations');

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const query: QueryParams = {
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      pharmacyId: searchParams.get('pharmacyId'),
      interval: (searchParams.get('interval') as 'day' | 'hour') || 'day',
    };

    // 4. Validate dates
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601: YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // 5. Query pre-aggregated OLAP data (TimescaleDB)
    const summaries = await db.daily_summary.findMany({
      where: {
        time: { gte: start, lte: end },
        ...(query.pharmacyId && { pharmacyId: query.pharmacyId }),
      },
      orderBy: { time: 'asc' },
    });

    if (summaries.length === 0) {
      return NextResponse.json(
        {
          totalPrescriptions: 0,
          totalOTC: 0,
          avgDispensingTime: 0,
          prescriptionRatio: 0,
          trend: [],
        },
        { status: 200 }
      );
    }

    // 6. Calculate KPIs
    const totalPrescriptions = summaries.reduce((sum, s) => sum + (s.totalPrescriptions || 0), 0);
    const totalOTC = summaries.reduce((sum, s) => sum + (s.totalOTC || 0), 0);
    const avgDispensingTime =
      summaries.reduce((sum, s) => sum + (s.avgDispensingTimeSec || 0), 0) / summaries.length;
    const prescriptionRatio = totalPrescriptions / (totalPrescriptions + totalOTC);

    // 7. Format trend
    const trend = summaries.map(s => ({
      date: s.time.toISOString().split('T')[0],
      count: s.totalDispensingS,
    }));

    return NextResponse.json({
      totalPrescriptions,
      totalOTC,
      avgDispensingTime,
      prescriptionRatio,
      trend,
      _metadata: {
        periodStart: query.startDate,
        periodEnd: query.endDate,
        recordsAnalyzed: summaries.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[ANALYTICS] Error in /api/analytics/dispensing/summary:', error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'ANALYTICS_ERROR' },
      { status: 500 }
    );
  }
}
```

### File 5: Operations Dashboard Component

```typescript
// src/app/analytics/operations/page.tsx (NEW)

'use client';

import { useState, useEffect } from 'react';
import { DailyTrendChart } from './components/DailyTrendChart';
import { TopMedicinesChart } from './components/TopMedicinesChart';
import { PeakHoursHeatmap } from './components/PeakHoursHeatmap';
import { KPISummary } from './components/KPISummary';
import { FilterBar } from './components/FilterBar';

interface DashboardData {
  totalPrescriptions: number;
  totalOTC: number;
  avgDispensingTime: number;
  prescriptionRatio: number;
  trend: Array<{ date: string; count: number }>;
  topMedicines: Array<{ name: string; count: number }>;
  peakHours: { hours: number[]; counts: number[]; peakHour: number };
}

export default function OperationsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    pharmacyId: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        interval: 'day',
        ...(filters.pharmacyId && { pharmacyId: filters.pharmacyId }),
      });

      const response = await fetch(`/api/analytics/dispensing/summary?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Operations Dashboard</h1>

      <FilterBar filters={filters} onFiltersChange={setFilters} />

      {loading ? (
        <div className="loading">Loading analytics...</div>
      ) : data ? (
        <>
          <KPISummary data={data} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyTrendChart data={data.trend} />
            <PeakHoursHeatmap data={data.peakHours} />
          </div>

          <TopMedicinesChart data={data.topMedicines} />
        </>
      ) : null}
    </div>
  );
}
```

---

## Summary of Integration Points

| File | Modification | Purpose |
|------|--------------|---------|
| `DispenseForm.tsx` | Add patient age group + disposition toggle | Capture event metadata |
| `eventProcessor.ts` | NEW | Main orchestrator for event flow |
| `riskScoringEngine.ts` | NEW | Calculate risk scores based on rules |
| `aggregationEngine.ts` | NEW | Transform events to analytics aggregates |
| `/api/analytics/...` | NEW | Expose aggregated data to frontend |
| `operations/page.tsx` | NEW | Render operations dashboard |
| `analyticsStore.ts` | NEW | Manage dashboard filters + state |
| `schema.prisma` | Add DispensingEvent model | Time-series event storage |
| `docker-compose.yml` | Add TimescaleDB service | Analytics database |

---

## Testing Strategy

### Unit Tests
```typescript
// __tests__/services/analytics/riskScoringEngine.test.ts

describe('riskScoringEngine', () => {
  test('should flag paediatric contraindications', () => {
    const event = {
      patientAgeGroup: 'paediatric',
      drugId: 'STREP-1000', // streptomycin (contraindicated in children)
      drugIsControlled: false,
      stgCompliant: true,
      overrideFlag: false,
    };

    const scores = calculateRiskScores(event);

    expect(scores.category).toBe('high');
    expect(scores.flags).toContain('PAEDS_CONTRAINDICATION');
    expect(scores.score).toBeGreaterThan(60);
  });

  test('should calculate combined risks', () => {
    const event = {
      patientAgeGroup: 'geriatric',
      drugId: 'CIPRO-500', // controlled drug
      drugIsControlled: true,
      stgCompliant: false,
      overrideFlag: true,
    };

    const scores = calculateRiskScores(event);

    expect(scores.category).toBe('critical');
    expect(scores.flags).toHaveLength(4);
  });
});
```

### Integration Test
```typescript
// __tests__/api/analytics/dispensing.test.ts

describe('GET /api/analytics/dispensing/summary', () => {
  test('should return correct KPIs for date range', async () => {
    // Insert 100 test events
    await db.dispensing_events.createMany([...testEvents]);

    // Query API
    const response = await fetch(
      '/api/analytics/dispensing/summary?startDate=2026-02-01&endDate=2026-02-09'
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.totalPrescriptions).toBe(100);
    expect(data.trend.length).toBe(9); // 9 days
  });
});
```

---

## Deployment Checklist

Before going live with DPAP:

- [ ] TimescaleDB deployed and tested
- [ ] Analytics services passing all unit tests
- [ ] Operations Dashboard tested with 100k events
- [ ] API response times < 500ms
- [ ] Access control verified (tiers work correctly)
- [ ] Documentation updated
- [ ] Team trained
- [ ] Backup strategy in place
- [ ] Monitoring + alerting configured
- [ ] Rollback plan documented

