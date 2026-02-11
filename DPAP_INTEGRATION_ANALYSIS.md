# Dosage Printing Analytics Platform (DPAP) - Integration with SEMS

**Date:** February 9, 2026  
**Status:** Architecture & Integration Analysis  
**Target:** Phase 1 Integration Plan

---

## Executive Summary

SEMS (Smart Expense Management System) is a **dispensing event generator**. DPAP is an **analytics intelligence platform**. Together, they form a complete pharmaceutical operational and compliance ecosystem:

- **SEMS** = Core dispensing application (event source)
- **DPAP** = Analytics and intelligence layer (event consumer)

**Integration Strategy:** Extend SEMS with a modular DPAP analytics engine that transforms dispensing events into operational, clinical, compliance, and market intelligence dashboards.

---

## 1. Current SEMS Architecture vs DPAP Requirements

### Current SEMS Stack
```
Frontend: Next.js 14 + React + TypeScript
Database: PostgreSQL (cloud) + IndexedDB/Dexie (local)
Services: Auth, Dose Calculation, Drug Search, Cloud Sync, Printing
State: Zustand
Deployment: Web (Vercel), Desktop (Tauri), Mobile (PWA)
```

### DPAP Requirements
```
Event Ingestion: Capture dispensing events with rich metadata
OLTP Database: Operational database for real-time queries
OLAP Database: Analytics database (columnar) for historical analysis
Analytics Services: Aggregation, risk scoring, forecasting
Dashboards: 4 main dashboard types + RBAC
API Layer: RESTful analytics endpoints
```

### Gap Analysis

| Component | SEMS Status | DPAP Need | Integration Approach |
|-----------|------------|-----------|----------------------|
| **Event Capture** | ✓ Dispense records exist | ✓ Rich event schema | Extend dispense schema |
| **OLTP Database** | ✓ PostgreSQL | ✓ Operational DB | Reuse existing PostgreSQL |
| **OLAP Database** | ✗ Not present | ✓ Analytics DB | Add columnar database (TimescaleDB/ClickHouse) |
| **Analytics Services** | ✗ Not present | ✓ Core analytics | Build NEW analytics service layer |
| **Dashboards** | ✗ Basic UI only | ✓ 4 dashboard types | Build NEW dashboard module |
| **RBAC** | ✓ Basic roles | ✓ Tier-based RBAC | Extend existing role system |
| **Printing** | ✓ Label printing | ✓ Analytics exports | Extend print service |
| **API Layer** | ✓ Basic CRUD | ✓ Analytics APIs | Build NEW analytics API routes |

---

## 2. Proposed Integrated Architecture

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SEMS + DPAP UNIFIED SYSTEM                    │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────┐         ┌───────────────────────┐
│   SEMS DISPENSING     │         │  DPAP ANALYTICS       │
│    (Phase 1 only)     │         │   (NEW MODULE)        │
├───────────────────────┤         ├───────────────────────┤
│ • Drug Search        │         │ • Aggregations       │
│ • Dose Calculation   │         │ • Risk Scoring       │
│ • Label Printing     │         │ • Compliance Rules   │
│ • Dispense Records   │═════════│ • Forecasting        │
│                       │ Event   │ • Dashboards         │
│                       │ Stream  │ • Exports (PDF/CSV)  │
└───────────────────────┘         └───────────────────────┘
           │                                    │
           │ dispenseRecords                    │
           v                                    v
      ┌─────────────────────────────────────────────────┐
      │         Cloud Storage Layer                      │
      ├─────────────────────────────────────────────────┤
      │  PostgreSQL (OLTP)                             │
      │  ├─ users, roles, dispenseRecords              │
      │  ├─ dispensingEvents (new: event details)      │
      │  └─ analytics_configs                          │
      │                                                 │
      │  TimescaleDB / ClickHouse (OLAP) - NEW         │
      │  ├─ fact_dispensing_events (denormalized)      │
      │  ├─ dim_drugs, dim_patients, dim_locations     │
      │  └─ aggregate tables (daily, hourly summary)   │
      └─────────────────────────────────────────────────┘
           │
           ↓
      ┌──────────────────────────────────────┐
      │   Next.js Frontend                   │
      ├──────────────────────────────────────┤
      │ SEMS Pages:                          │
      │ ├─ /patient-dispensing               │
      │ ├─ /sync (sync control)              │
      │ └─ /admin/users                      │
      │                                      │
      │ DPAP Pages (NEW):                   │
      │ ├─ /analytics/operations (Mgr)      │
      │ ├─ /analytics/safety (Pharm)        │
      │ ├─ /analytics/compliance (Admin)    │
      │ ├─ /analytics/intelligence (Exec)   │
      │ └─ /admin/dpap-config               │
      └──────────────────────────────────────┘
```

### 2.2 Data Flow - Event Capture to Analytics

```
1. DISPENSING EVENT CREATED (SEMS)
   └─ Pharmacist fills dispense form
      └─ triggerEvent("dispensing", {
           timestamp: Date.now(),
           pharmacy_id: "PHA001",
           user_id: "USR123",
           drug_code: "AMOX-500",
           dosage: "500mg",
           quantity: 20,
           patient_age_group: "adult",
           is_prescription: true,
           is_controlled: false,
           stg_compliant: true,
           override: false,
           print_duration: 2.5s
         })

2. SAVE TO OLTP (PostgreSQL)
   └─ INSERT INTO dispensing_events (...)
      └─ Also update: dispense_records (legacy)

3. EVENT PROCESSOR (Analytics Service)
   └─ Near real-time stream:
      ├─ Validate event completeness
      ├─ Enrich with master data (drug details, classifications)
      ├─ Calculate risk scores (paediatric/geriatric/controlled)
      └─ INSERT into OLAP database

4. OLAP AGGREGATIONS (TimescaleDB/ClickHouse)
   └─ Real-time materialized views:
      ├─ daily_dispensing_summary (by drug, location, hour)
      ├─ risk_scores_by_drug
      ├─ stg_compliance_tracking
      └─ high_risk_alerts

5. DASHBOARD QUERIES (Analytics API)
   └─ GET /api/analytics/operations/daily-summary
      └─ Returns: { prescriptions: X, otc: Y, avg_time: Z }
```

### 2.3 Dispensing Event Schema (DPAP Extension)

**Current SEMS dispense_records table:**
```typescript
dispenseRecords {
  id: string
  userId: string
  drugId: string
  dose: string
  quantity: number
  timestamp: Date
  synced: boolean
}
```

**DPAP-enhanced dispensing_events table:**
```typescript
dispensing_events {
  // Core IDs
  event_id: UUID (primary key, NEW)
  pharmacy_id: string (NEW)
  
  // User & Temporal
  user_id: string
  timestamp: Date
  date: Date (derived, for partitioning) (NEW)
  hour: number (NEW)
  day_of_week: number (NEW)
  
  // Drug Information
  drug_id: string
  drug_code: string (NEW)
  drug_generic_name: string (NEW)
  drug_brand_name: string (NEW)
  drug_class: string (ATC classification) (NEW)
  drug_is_antibiotic: boolean (NEW)
  drug_is_controlled: boolean (NEW)
  
  // Dosage
  dosage_instructions: string
  dose_quantity: number
  dose_unit: string (mg, ml, etc.) (NEW)
  
  // Patient Demographics
  patient_age_group: enum ["paediatric", "adult", "geriatric"] (NEW)
  patient_age_years: number | null (NEW, masked for privacy)
  patient_weight_kg: number | null (NEW, masked for privacy)
  patient_is_pregnant: boolean (NEW)
  
  // Prescription Type
  is_prescription: boolean (NEW)
  is_otc: boolean (NEW)
  
  // Compliance & Safety
  stg_compliant: boolean (NEW)
  override_flag: boolean (NEW)
  override_reason: string | null (NEW)
  contraindications_identified: string[] (NEW)
  high_risk_flag: boolean (NEW)
  risk_category: enum ["none", "low", "medium", "high", "critical"] (NEW)
  
  // Operational Metrics
  print_duration_sec: number (NEW)
  
  // Flags for Analytics
  is_synced: boolean
  sync_timestamp: Date | null
  created_at: Date (NEW)
  updated_at: Date (NEW)
}
```

---

## 3. DPAP Module Structure (NEW)

### 3.1 File Structure Addition

```
src/
├── app/
│   ├── analytics/                           (NEW MODULE)
│   │   ├── page.tsx                         (analytics home/selector)
│   │   ├── operations/                      (Pharmacy Manager)
│   │   │   ├── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── DailyTrendChart.tsx
│   │   │   │   ├── TopMedicinesChart.tsx
│   │   │   │   └─ PeakHoursHeatmap.tsx
│   │   │   └── [...] daily dashboard
│   │   │
│   │   ├── safety/                          (Clinical Pharmacist)
│   │   │   ├── page.tsx
│   │   │   ├── components/
│   │   │   │   ├─ HighRiskAlerts.tsx
│   │   │   │   ├─ ComplexRegimens.tsx
│   │   │   │   └─ STGDeviations.tsx
│   │   │   └── [...] safety dashboard
│   │   │
│   │   ├── compliance/                      (Administrator)
│   │   │   ├── page.tsx
│   │   │   ├── components/
│   │   │   │   ├─ ComplianceScorecard.tsx
│   │   │   │   ├─ AntibioticStewardship.tsx
│   │   │   │   └─ ControlledMedicines.tsx
│   │   │   └── [...] compliance dashboard
│   │   │
│   │   └── intelligence/                    (Executive)
│   │       ├── page.tsx
│   │       ├── components/
│   │       │   ├─ DemandTrends.tsx
│   │       │   ├─ RegionalHeatmap.tsx
│   │       │   └─ ForecastingChart.tsx
│   │       └── [...] intelligence dashboard
│   │
│   └── admin/
│       └── dpap-config/                     (NEW CONFIG PAGE)
│           └── page.tsx
│
├── services/
│   ├── analytics/                           (NEW SERVICE LAYER)
│   │   ├── eventProcessor.ts                (capture → OLAP flow)
│   │   ├── aggregationEngine.ts             (calculations)
│   │   ├── riskScoringEngine.ts             (medical logic)
│   │   ├── forecastingEngine.ts             (demand prediction)
│   │   └── complianceEngine.ts              (regulatory rules)
│   │
│   └── [...existing services]
│
├── lib/
│   ├── analytics/                           (NEW LIB)
│   │   ├── olap-schema.ts                   (TimescaleDB schema)
│   │   ├── event-validators.ts
│   │   ├── risk-rules.tsx
│   │   └── compliance-rules.ts
│   │
│   └── [...existing lib]
│
├── api/
│   └── analytics/                           (NEW API ROUTES)
│       ├── dispensing/
│       │   ├── summary/route.ts
│       │   ├── trends/route.ts
│       │   └── detail/route.ts
│       ├── safety/
│       │   ├── alerts/route.ts
│       │   ├── risk-scores/route.ts
│       │   └── stg-deviations/route.ts
│       ├── compliance/
│       │   ├── stg-score/route.ts
│       │   ├── antibiotic-stewardship/route.ts
│       │   └── controlled-medicines/route.ts
│       ├── intelligence/
│       │   ├── demand-forecast/route.ts
│       │   ├── regional-analysis/route.ts
│       │   └── benchmarking/route.ts
│       └── exports/
│           ├── pdf/route.ts
│           └── csv/route.ts
│
└── store/
    └── analyticsStore.ts                    (NEW ZUSTAND STORE)
        (dashboard filters, time ranges, exports)
```

### 3.2 Key New Services

#### Analytics Event Processor
```typescript
// src/services/analytics/eventProcessor.ts
export async function captureDispensingEvent(form: DispenseForm) {
  // 1. Validate incoming event
  const validated = validateDispensingEvent(form);
  
  // 2. Enrich with master data
  const enriched = await enrichEvent(validated, {
    drugMasterData,
    patientRiskProfile
  });
  
  // 3. Calculate risk scores
  const withRiskScores = calculateRiskScores(enriched);
  
  // 4. Check compliance rules
  const withCompliance = checkSTGCompliance(withRiskScores);
  
  // 5a. Save to OLTP (PostgreSQL)
  await db.dispensing_events.create(withCompliance);
  
  // 5b. Queue for OLAP async processing
  await queueForOLAP(withCompliance);
  
  // 6. Trigger real-time alerts if high-risk
  if (withCompliance.risk_category === 'critical') {
    await publishAlert(withCompliance);
  }
  
  return withCompliance;
}
```

#### Risk Scoring Engine
```typescript
// src/services/analytics/riskScoringEngine.ts
export function calculateRiskScores(event: DispensingEvent): RiskScores {
  let riskScore = 0;
  const flags = [];
  
  // Paediatric risk: ages 0-5
  if (event.patient_age_group === 'paediatric') {
    riskScore += 30;
    flags.push('PAEDIATRIC_DOSING');
    
    // Check if drug inappropriate for children
    if (event.drug_id in PAEDS_CONTRAINDICATIONS) {
      riskScore += 40;
      flags.push('PAEDS_CONTRAINDICATION');
    }
  }
  
  // Geriatric risk: ages 65+
  if (event.patient_age_group === 'geriatric') {
    riskScore += 20;
    flags.push('GERIATRIC_DOSING');
    
    if (event.drug_id in GERIATRIC_CONTRAINDICATIONS) {
      riskScore += 30;
      flags.push('GERIATRIC_CONTRAINDICATION');
    }
  }
  
  // Controlled medicine risk
  if (event.drug_is_controlled) {
    riskScore += 25;
    flags.push('CONTROLLED_SUBSTANCE');
  }
  
  // STG deviation
  if (!event.stg_compliant) {
    riskScore += 35;
    flags.push('STG_DEVIATION');
  }
  
  // Override flag
  if (event.override_flag) {
    riskScore += 20;
    flags.push('USER_OVERRIDE');
  }
  
  // Determine risk category
  const category = 
    riskScore >= 80 ? 'critical' :
    riskScore >= 60 ? 'high' :
    riskScore >= 40 ? 'medium' :
    riskScore >= 20 ? 'low' :
    'none';
  
  return { riskScore, category, flags };
}
```

#### Aggregation Engine
```typescript
// src/services/analytics/aggregationEngine.ts
export async function aggregateDailyMetrics(date: Date) {
  // Aggregate all events for the day into OLAP
  const events = await db.dispensing_events.where('date').equals(date);
  
  const summary = {
    date,
    total_dispensings: events.length,
    total_prescriptions: events.filter(e => e.is_prescription).length,
    total_otc: events.filter(e => e.is_otc).length,
    avg_dispensing_time: mean(events.map(e => e.print_duration_sec)),
    high_risk_count: events.filter(e => e.risk_category in ['high', 'critical']).length,
    stg_compliant_count: events.filter(e => e.stg_compliant).length,
    stg_compliance_rate: (events.filter(e => e.stg_compliant).length / events.length) * 100,
    // ... many more aggregations
  };
  
  // Insert into OLAP time-series database
  await olap.daily_summary.insert(summary);
}

export async function getOperationsDashboard(
  startDate: Date,
  endDate: Date,
  pharmacyId?: string
) {
  // Query pre-aggregated data from OLAP for fast dashboard load
  const data = await olap.daily_summary
    .where({ date: { $gte: startDate, $lte: endDate } })
    .where(pharmacyId ? { pharmacy_id: pharmacyId } : {})
    .toArray();
  
  return {
    total_prescriptions: sum(data.map(d => d.total_prescriptions)),
    avg_dispensing_time: mean(data.map(d => d.avg_dispensing_time)),
    prescription_otc_ratio: ...,
    trend: data.map(d => ({ date: d.date, count: d.total_dispensings })),
    top_medicines: await getTopMedicines(startDate, endDate),
    peak_hours: await getPeakHours(startDate, endDate),
  };
}
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- **Goal:** Extend SEMS with basic event capture and operations dashboard
- **Tasks:**
  1. Extend `dispensing_events` table schema (PostgreSQL Prisma migration)
  2. Create analytics services (event processor, aggregation)
  3. Build Operations Dashboard (`/analytics/operations`)
  4. Create analytics API routes (`/api/analytics/dispensing/*`)
  5. Integrate event capture into existing DispenseForm
  6. Add time-series database (TimescaleDB or ClickHouse)

### Phase 2: Safety & Compliance (Weeks 5-8)
- **Goal:** Add clinical risk and regulatory oversight
- **Tasks:**
  1. Implement risk scoring engine (paediatric, geriatric, controlled drugs)
  2. Build Safety Dashboard (`/analytics/safety`)
  3. Build Compliance Dashboard (`/analytics/compliance`)
  4. Add STG deviation detection
  5. Real-time alert system
  6. Compliance export (PDF/CSV)

### Phase 3: Intelligence & Forecasting (Weeks 9-12)
- **Goal:** Executive-level insights and demand forecasting
- **Tasks:**
  1. Implement forecasting engine (30/60/90-day predictions)
  2. Build Intelligence Dashboard (`/analytics/intelligence`)
  3. Regional consumption analysis
  4. Benchmarking views
  5. Aggregated anonymization layer

### Phase 4: Integrations (Weeks 13+)
- **Goal:** Connect with external systems
- **Tasks:**
  1. NHIS integration (prescribing vs dispensing)
  2. FDA Ghana automated reporting
  3. MOH STG adherence dashboards
  4. Custom API for third-party integrations

---

## 5. Subscription Tiers & RBAC

### Tier Model Integration

```typescript
// Enhanced Role System in SEMS
enum SubscriptionTier {
  FREE = "free",              // Label printing + basic counts
  PRO = "pro",                // Operations dashboard + safety alerts
  COMPLIANCE = "compliance",  // Regulatory reports + exports
  INTELLIGENCE = "intelligence", // Forecasting + benchmarking
  ENTERPRISE = "enterprise"   // Custom dashboards + API access
}

// Map roles to dashboards they can access
const roleAccess = {
  pharmacy_manager: {
    tiers: [PRO, COMPLIANCE, INTELLIGENCE, ENTERPRISE],
    dashboards: ["operations", "compliance"],
  },
  clinical_pharmacist: {
    tiers: [PRO, COMPLIANCE, INTELLIGENCE, ENTERPRISE],
    dashboards: ["safety"],
  },
  hospital_admin: {
    tiers: [COMPLIANCE, INTELLIGENCE, ENTERPRISE],
    dashboards: ["compliance", "intelligence"],
  },
  moh_regulator: {
    tiers: [COMPLIANCE, INTELLIGENCE, ENTERPRISE],
    dashboards: ["compliance", "intelligence"],
  },
  executive: {
    tiers: [INTELLIGENCE, ENTERPRISE],
    dashboards: ["intelligence"],
  }
};

// RBAC Middleware
export async function checkDashboardAccess(userId: string, dashboard: string) {
  const user = await db.users.findUnique({ id: userId });
  const tier = await getSubscriptionTier(user.organization_id);
  
  const allowed = roleAccess[user.role]?.dashboards.includes(dashboard) &&
                  roleAccess[user.role]?.tiers.includes(tier);
  
  if (!allowed) throw new UnauthorizedError("Dashboard access denied");
  return true;
}
```

---

## 6. Database Migration Strategy

### Step 1: Extend PostgreSQL Schema

```sql
-- Add new dispensing_events table (separate from legacy dispense_records)
CREATE TABLE dispensing_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES "User"(id),
  
  drug_id UUID NOT NULL,
  drug_code VARCHAR(50),
  drug_generic_name VARCHAR(255),
  drug_class VARCHAR(50),
  drug_is_antibiotic BOOLEAN DEFAULT FALSE,
  drug_is_controlled BOOLEAN DEFAULT FALSE,
  
  patient_age_group VARCHAR(20),
  patient_age_years INTEGER,
  patient_weight_kg DECIMAL(5,2),
  
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  date DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED,
  hour SMALLINT GENERATED ALWAYS AS (EXTRACT(HOUR FROM timestamp)) STORED,
  day_of_week SMALLINT GENERATED ALWAYS AS (EXTRACT(DOW FROM timestamp)) STORED,
  
  is_prescription BOOLEAN DEFAULT FALSE,
  is_otc BOOLEAN DEFAULT FALSE,
  stg_compliant BOOLEAN DEFAULT FALSE,
  override_flag BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  
  risk_category VARCHAR(20),
  risk_score INTEGER,
  high_risk_flag BOOLEAN DEFAULT FALSE,
  
  dosage_instructions TEXT,
  dose_quantity DECIMAL(10,2),
  dose_unit VARCHAR(20),
  print_duration_sec DECIMAL(5,2),
  
  is_synced BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Time-series optimization: Create partition by month
CREATE TABLE dispensing_events_2026_02 PARTITION OF dispensing_events
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Add indexes for performance
CREATE INDEX idx_dispensing_events_pharmacy_date 
  ON dispensing_events(pharmacy_id, date);
CREATE INDEX idx_dispensing_events_risk 
  ON dispensing_events(risk_category, timestamp);
```

### Step 2: Add TimescaleDB for OLAP

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable for time-series analytics
CREATE TABLE daily_dispensing_summary (
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  pharmacy_id VARCHAR(50) NOT NULL,
  
  total_dispensings INT,
  total_prescriptions INT,
  total_otc INT,
  avg_dispensing_time_sec DECIMAL(5,2),
  high_risk_count INT,
  stg_compliant_count INT,
  stg_compliance_rate DECIMAL(5,2),
  
  PRIMARY KEY (time, pharmacy_id)
);

-- Convert to hypertable for automatic partitioning
SELECT create_hypertable('daily_dispensing_summary', 'time', 
  if_not_exists => TRUE);

-- Add continuous aggregate for faster 30-day rolling average
CREATE MATERIALIZED VIEW dispensing_30day_avg
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 day', time) AS day,
  pharmacy_id,
  AVG(total_dispensings) AS avg_daily_dispensings,
  AVG(avg_dispensing_time_sec) AS avg_dispensing_time
FROM daily_dispensing_summary
GROUP BY time_bucket('1 day', time), pharmacy_id;

-- Refresh policy (auto-update every hour)
SELECT add_continuous_aggregate_policy('dispensing_30day_avg',
  start_offset => INTERVAL '2 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');
```

### Step 3: Prisma Schema Update

```prisma
// prisma/schema.prisma

model DispensingEvent {
  id            String    @id @default(cuid())
  eventId       String    @unique @default(cuid())
  pharmacyId    String
  
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  drugId        String
  drugCode      String?
  drugGenericName String?
  drugClass     String?
  drugIsAntibiotic Boolean @default(false)
  drugIsControlled Boolean @default(false)
  
  patientAgeGroup String?  // "paediatric" | "adult" | "geriatric"
  patientAgeYears Int?
  patientWeightKg Float?
  
  timestamp     DateTime  @default(now())
  hour          Int?      // Auto-generated from timestamp
  dayOfWeek     Int?      // Auto-generated from timestamp
  
  isPrescription Boolean @default(false)
  isOTC         Boolean @default(false)
  
  stgCompliant  Boolean @default(false)
  overrideFlag  Boolean @default(false)
  overrideReason String?
  
  riskCategory  String?   // "none" | "low" | "medium" | "high" | "critical"
  riskScore     Int?
  highRiskFlag  Boolean @default(false)
  
  dosageInstructions String?
  doseQuantity  Float?
  doseUnit      String?   // "mg" | "ml" | etc.
  printDurationSec Float?
  
  isSynced      Boolean @default(false)
  syncTimestamp DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([pharmacyId, timestamp])
  @@index([riskCategory, timestamp])
  @@map("dispensing_events")
}

// Analytics configuration
model AnalyticsConfig {
  id            String    @id @default(cuid())
  pharmacyId    String    @unique
  
  subscriptionTier String  // "free" | "pro" | "compliance" | "intelligence" | "enterprise"
  
  // Compliance settings
  stgReferenceVersion String?
  enableAntibioticStewardship Boolean @default(false)
  enableControlledDrugTracking Boolean @default(false)
  
  // Forecasting settings
  forecastingDays Int @default(90)
  confidenceLevel Float @default(0.95)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("analytics_config")
}
```

---

## 7. API Design (DPAP Endpoints)

All endpoints require authentication + dashboard access check.

### Operations Dashboard APIs

```
GET /api/analytics/dispensing/summary
  Query: { startDate, endDate, pharmacyId?, interval: "day|hour" }
  Response: {
    total_prescriptions: 1250,
    total_otc: 340,
    avg_dispensing_time: 2.3,
    prescription_ratio: 0.786,
    trend: [{ date, count }, ...]
  }

GET /api/analytics/dispensing/top-medicines
  Query: { startDate, endDate, limit: 10 }
  Response: [{ drug_name, count, revenue }, ...]

GET /api/analytics/dispensing/peak-hours
  Query: { startDate, endDate }
  Response: { hours: [0-23], counts: [X, Y, Z, ...], peak_hour: 14 }
```

### Safety & Risk APIs

```
GET /api/analytics/safety/alerts
  Query: { severity: "critical|high|medium", limit: 50 }
  Response: [{ drug, patient_group, alert_type, count }, ...]

GET /api/analytics/safety/risk-scores
  Query: { startDate, endDate, groupBy: "drug|age_group" }
  Response: { high_risk: X, medium_risk: Y, low_risk: Z, distribution: [...] }

GET /api/analytics/safety/stg-deviations
  Query: { startDate, endDate }
  Response: { deviation_count: X, deviation_rate: Y%, top_deviations: [...] }
```

### Compliance APIs

```
GET /api/analytics/compliance/stg-score
  Query: { startDate, endDate, pharmacyId? }
  Response: { 
    overall_score: 85,
    compliant_events: 1023,
    total_events: 1200,
    trend: [{ date, score }, ...]
  }

GET /api/analytics/compliance/antibiotic-stewardship
  Query: { startDate, endDate }
  Response: {
    total_antibiotics_dispensed: 456,
    appropriate_use_rate: 92,
    inappropriate_use: 36,
    by_antibiotic: [...]
  }

GET /api/analytics/compliance/controlled-medicines
  Query: { startDate, endDate }
  Response: [{ medicine_name, count, classification, compliance_rate }, ...]
```

### Intelligence APIs

```
GET /api/analytics/intelligence/demand-forecast
  Query: { days: 30|60|90, medicine_id?, confidence_level: 0.95 }
  Response: {
    forecast: [{ date, predicted_demand, confidence_range }, ...],
    methodology: "time_series_arima"
  }

GET /api/analytics/intelligence/regional-analysis
  Query: { startDate, endDate }
  Response: { regions: [{ region, total_dispensings, top_medicines },...] }

GET /api/analytics/intelligence/benchmarking
  Query: { metric: "stg_compliance|avg_time|...", pharmacyId? }
  Response: {
    your_metric: 85,
    network_avg: 78,
    network_high: 92,
    network_low: 45,
    percentile: 72
  }
```

### Export APIs

```
GET /api/analytics/exports/compliance-report
  Query: { startDate, endDate, format: "pdf|csv", pharmacyId }
  Response: Binary file (PDF/CSV with audit-ready compliance report)

GET /api/analytics/exports/regulatory-submission
  Query: { startDate, endDate, authority: "fda_ghana|moh", format: "json" }
  Response: Aggregated, anonymized data per FDA/MOH specifications
```

---

## 8. Technology Stack Summary

### New Components to Add

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Time-Series DB** | TimescaleDB or ClickHouse | OLAP analytics database |
| **Analytics Service** | TypeScript/Node.js | Event processing & aggregation |
| **Real-time Streaming** | Bull Queue or Kafka | Event processing pipeline |
| **Visualization** | Recharts (existing) + D3.js | Complex dashboards |
| **Export** | pdfkit + xlsx | Report generation |
| **Forecasting** | Prophet.js or statsmodels (Python) | Demand prediction |

### Existing Components (Reuse)

- **Frontend:** Next.js 14, React, TypeScript ✓
- **ORM:** Prisma ✓
- **State Management:** Zustand ✓
- **Auth:** PIN-based + JWT (extend for tier checking) ✓
- **Database:** PostgreSQL ✓
- **Printing:** ESC/POS labels (extend for PDF exports) ✓

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Data Privacy / GDPR** | Aggregation layer; anonymization for intelligence tier; no PII in OLAP |
| **Performance Degradation** | TimescaleDB partitioning; materialized views; API caching (Redis) |
| **Adoption Resistance** | Free tier with label printing; low-friction onboarding for Pro tier |
| **Inaccurate Risk Scoring** | Validation rules; clinical pharmacist review workflow; audit trail |
| **Regulatory Misalignment** | Stakeholder review (FDA, MOH); audit-ready exports; compliance checklists |

---

## 10. Implementation Roadmap (Gantt Summary)

```
Phase 1: Foundation (Weeks 1-4)
├─ Week 1: Schema extension + TimescaleDB setup
├─ Week 2: Analytics services (event processor, aggregation)
├─ Week 3: Operations Dashboard
└─ Week 4: Analytics API routes + integration testing

Phase 2: Safety & Compliance (Weeks 5-8)
├─ Week 5: Risk scoring engine + Safety Dashboard
├─ Week 6: Compliance Dashboard + compliance APIs
├─ Week 7: STG deviation detection + alerts
└─ Week 8: Export functionality (PDF/CSV)

Phase 3: Intelligence (Weeks 9-12)
├─ Week 9: Demand forecasting engine
├─ Week 10: Intelligence Dashboard
├─ Week 11: Regional analysis + benchmarking
└─ Week 12: Anonymization layer

Phase 4: Integrations (Weeks 13+)
├─ NHIS integration
├─ FDA Ghana automated reporting
└─ MOH national dashboards
```

---

## 11. Success Metrics (Phase 1)

- ✓ Dispensing events captured with rich metadata (100% of transactions)
- ✓ Operations Dashboard loads < 3 seconds
- ✓ Risk scoring engine identifies high-risk scenarios correctly (95%+ accuracy)
- ✓ Analytics API response time < 500ms for standard queries
- ✓ Zero data loss during event ingestion (durability: 99.99%)
- ✓ Team adopts analytics dashboards in daily workflows

---

## 12. Next Steps

1. **Week 1:** Approve schema design → create Prisma migration
2. **Week 2:** Set up TimescaleDB → implement event processor
3. **Week 3:** Build Operations Dashboard → add analytics APIs
4. **Week 4:** Integration testing → Phase 1 launch

---

## Conclusion

SEMS + DPAP creates a **complete pharmaceutical operational excellence platform:**

- **SEMS** handles the dispensing workflow (event generation)
- **DPAP** transforms events into intelligence (analytics & dashboards)
- **Together** they provide operational, clinical, compliance, and strategic decision-making for pharmacies and health systems

The architecture is **modular, scalable, and directly aligned** with the DPAP PRD while leveraging all existing SEMS infrastructure.

