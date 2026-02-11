# DPAP Integration Implementation Checklist

**Target:** Phase 1 - Event Capture + Operations Dashboard (4 weeks)

---

## Week 1: Database Schema Extension

### PostgreSQL Migration
- [ ] Create Prisma migration file: `prisma/migrations/add-dispensing-events-table`
- [ ] Define `dispensing_events` table with all required fields
- [ ] Create indexes for performance:
  - [ ] `idx_dispensing_events_pharmacy_date` (pharmacy_id, timestamp)
  - [ ] `idx_dispensing_events_risk` (risk_category, timestamp)
  - [ ] `idx_dispensing_events_drug` (drug_id, timestamp)
- [ ] Run migration: `npx prisma migrate dev --name add-dispensing-events-table`
- [ ] Seed baseline drug classifications + risk rules

### TimescaleDB Setup (OLAP)
- [ ] Set up TimescaleDB instance (local/docker/cloud)
- [ ] Enable TimescaleDB extension in PostgreSQL
- [ ] Create `daily_dispensing_summary` hypertable
- [ ] Create continuous aggregate `dispensing_30day_avg`
- [ ] Test auto-partitioning and query performance
- [ ] Document connection string for analytics service

### Prisma Schema Update
- [ ] Add `DispensingEvent` model to `prisma/schema.prisma`
- [ ] Add `AnalyticsConfig` model for subscription tiers
- [ ] Update User model with optional `subscriptionTier` field
- [ ] Run `npx prisma generate`

---

## Week 2: Analytics Foundation Services

### Event Processor Service
- [ ] Create `src/services/analytics/eventProcessor.ts`
  - [ ] `captureDispensingEvent()` - Main entry point
  - [ ] `validateDispensingEvent()` - Input validation
  - [ ] `enrichEvent()` - Add master data
  - [ ] `saveToOLTP()` - PostgreSQL insert
  - [ ] `queueForOLAP()` - Send to aggregation queue
- [ ] Add event validation schema (Zod/Yup)
- [ ] Add error handling + logging

### Risk Scoring Engine
- [ ] Create `src/services/analytics/riskScoringEngine.ts`
  - [ ] `calculateRiskScores()` - Main function
  - [ ] Paediatric risk rules (0-5 years)
  - [ ] Geriatric risk rules (65+ years)
  - [ ] Controlled drug risk flags
  - [ ] STG deviation scoring
  - [ ] Override flag processing
- [ ] Define `RiskScores` TypeScript interface
- [ ] Create clinical pharmacist review data structure

### Aggregation Engine
- [ ] Create `src/services/analytics/aggregationEngine.ts`
  - [ ] `aggregateDailyMetrics()` - Daily summaries
  - [ ] `aggregateHourlyMetrics()` - Hourly breakdowns
  - [ ] `calculateTopMedicines()` - Top 10 by volume
  - [ ] `calculatePeakHours()` - Hour-by-hour distribution
- [ ] Connect to TimescaleDB
- [ ] Add scheduled job (every hour) to push aggregates

### Event Queue Setup
- [ ] Set up Bull Queue (Redis) or simple in-memory queue
  - [ ] Job: process_dispensing_event (high priority)
  - [ ] Job: aggregate_daily_metrics (low priority)
- [ ] Add queue monitoring/dashboard (Bull Board optional)
- [ ] Implement retry logic with exponential backoff

### Type Definitions
- [ ] Create `src/types/analytics.ts`
  - [ ] `DispensingEvent` interface
  - [ ] `RiskScores` interface
  - [ ] `AggregatedMetrics` interface
  - [ ] `DashboardKPIs` interface
  - [ ] Enum: `RiskCategory`, `PatientAgeGroup`, `SubscriptionTier`

---

## Week 3: Operations Dashboard UI

### Dashboard Layout
- [ ] Create `src/app/analytics/page.tsx` (analytics home)
  - [ ] Dashboard selector (Operations / Safety / Compliance / Intelligence)
  - [ ] User tier verification + access control
- [ ] Create `src/app/analytics/operations/page.tsx` (main dashboard)

### Dashboard Components
- [ ] `src/app/analytics/operations/components/DailyTrendChart.tsx`
  - [ ] Line chart: dispensing volume by day (Recharts)
  - [ ] Configurable date range picker
  - [ ] Toggle: Prescriptions vs OTC breakdown
- [ ] `src/app/analytics/operations/components/TopMedicinesChart.tsx`
  - [ ] Bar chart: Top 10 medicines by volume
  - [ ] Sortable: by volume, revenue, or frequency
  - [ ] Click-through to medicine details
- [ ] `src/app/analytics/operations/components/PeakHoursHeatmap.tsx`
  - [ ] Hour-by-hour distribution (heatmap or bar)
  - [ ] Show peak vs off-peak staffing recommendations
- [ ] `src/app/analytics/operations/components/KPISummary.tsx`
  - [ ] Cards showing: Total prescriptions, Avg time, Rx:OTC ratio
  - [ ] Compare to previous period (week-on-week, month-on-month)
- [ ] `src/app/analytics/operations/components/FilterBar.tsx`
  - [ ] Date range picker
  - [ ] Pharmacy selector (multi-select for networks)
  - [ ] Export button

### State Management
- [ ] Create `src/store/analyticsStore.ts` (Zustand)
  - [ ] `dashboardFilters`: date range, pharmacy, interval
  - [ ] `selectedMetrics`: which KPIs to display
  - [ ] `exportFormat`: pdf vs csv
  - [ ] `dashboardRefresh`: auto-refresh toggle + interval
- [ ] Add persistence to localStorage

### Styling & Responsiveness
- [ ] Apply Tailwind CSS (dark mode friendly)
- [ ] Mobile-responsive layout (tablet/phone views)
- [ ] Print-friendly CSS for report generation

---

## Week 4: Analytics API Routes + Testing

### API Routes - Dispensing Endpoints
- [ ] Create `src/app/api/analytics/dispensing/summary/route.ts`
  - [ ] GET handler with date range + pharmacy filters
  - [ ] Return KPIs + daily trend
  - [ ] Cache strategy (5-minute Redis cache for historical queries)
- [ ] Create `src/app/api/analytics/dispensing/top-medicines/route.ts`
  - [ ] GET with limit parameter
  - [ ] Return drug name, count, and revenue
- [ ] Create `src/app/api/analytics/dispensing/peak-hours/route.ts`
  - [ ] GET with date range
  - [ ] Return hourly distribution

### API Middleware
- [ ] Create `src/lib/middleware/requireAuth.ts`
  - [ ] JWT verification
  - [ ] User lookup
- [ ] Create `src/lib/middleware/requireDashboardAccess.ts`
  - [ ] Check subscription tier
  - [ ] Check dashboard permissions by role
  - [ ] Throw 403 if access denied

### API Error Handling
- [ ] Standardized error response format
  - [ ] `{ error: "...", code: "...", statusCode: 400|403|500 }`
- [ ] Error logging to file/service
- [ ] Client-side error toast notifications

### Integration Test Suite
- [ ] `__tests__/services/analytics/eventProcessor.test.ts`
  - [ ] Test valid event capture
  - [ ] Test enrichment logic
  - [ ] Test invalid event rejection
- [ ] `__tests__/services/analytics/riskScoringEngine.test.ts`
  - [ ] Test paediatric risk scoring
  - [ ] Test geriatric risk detection
  - [ ] Test controlled drug flagging
- [ ] `__tests__/api/analytics/dispensing.test.ts`
  - [ ] Test summary endpoint response format
  - [ ] Test date range filtering
  - [ ] Test authentication middleware

### Documentation
- [ ] Update API_DOCS.md with new analytics endpoints
  - [ ] Path, method, query params, response schema
  - [ ] Example requests + responses
- [ ] Create ANALYTICS_QUICK_START.md
  - [ ] How to use dashboard
  - [ ] API authentication
  - [ ] Date range best practices

---

## Integration Points with Existing SEMS

### DispenseForm Enhancement (src/components/DispenseForm.tsx)
- [ ] On successful dispensing save, call `captureDispensingEvent()`
- [ ] Pass enriched form data:
  - [ ] `patientAgeGroup` (new field: select dropdown)
  - [ ] `patientAge` (optional)
  - [ ] `patientWeight` (optional for dose calc)
  - [ ] `isPrescription` (toggle)
  - [ ] `isControlledDrug` (auto-detected from drug master)
  - [ ] `stgCompliant` (auto-calculated from dose service)
  - [ ] `overrideFlag` & `overrideReason` (if not-STG)

### Dose Calculation Service (src/services/dose.ts)
- [ ] Enhance to return `stgCompliant` flag
- [ ] Add `contraindications_identified` list
- [ ] Return `risk_score_indicator` (for display before print)

### Database Initialization (src/lib/db.ts or init script)
- [ ] Auto-create analytics tables on app startup
- [ ] Seed drug classifications + risk rules
- [ ] Initialize `AnalyticsConfig` for each pharmacy

### Sync Service (src/services/sync.ts)
- [ ] Ensure `dispensing_events` records are included in sync
- [ ] Add `dispensing_events` to sync queue on cloud connection
- [ ] Handle conflict resolution for events created offline

---

## Configuration & Deployment

### Environment Variables
- [ ] `.env.local`
  - [ ] `TIMESCALEDB_URL`: Connection string
  - [ ] `ANALYTICS_CACHE_TTL`: 300 (5 min default)
  - [ ] `ANALYTICS_QUEUE_NAME`: processing queue name
  - [ ] `REDIS_URL`: For caching + queue (optional)

### Docker Compose Update (docker-compose.yml)
- [ ] Add TimescaleDB service
  - [ ] Image: `timescale/timescaledb:latest-pg15`
  - [ ] Volumes for persistence
  - [ ] Environment: POSTGRES_PASSWORD, etc.
- [ ] Add Redis service (optional, for queue + caching)
  - [ ] Image: `redis:7-alpine`

### Database Startup Scripts
- [ ] `scripts/init-timescaledb.sh`
  - [ ] Create extensions
  - [ ] Run DDL for hypertables
  - [ ] Create continuous aggregates
  - [ ] Run `chmod +x` after creation

### Vercel Deployment (if cloud)
- [ ] Add environment variables to Vercel project settings
- [ ] Verify PostgreSQL + TimescaleDB connectivity
- [ ] Set up automated backups for analytics database
- [ ] Monitor query performance with Vercel analytics

---

## Testing Checklist

### Unit Tests
- [ ] Risk scoring: Test all 5 risk categories
- [ ] Event validation: Test valid + invalid inputs
- [ ] Aggregation: Test daily metric calculations

### Integration Tests
- [ ] End-to-end: Dispense form → event capture → API query
- [ ] Database consistency: OLTP + OLAP sync
- [ ] Authentication: Correct tier access for dashboards

### Manual QA
- [ ] [ ] Create 50 dispense records (mix of Rx, OTC, high-risk)
- [ ] [ ] Verify events appear in database within 5 minutes
- [ ] [ ] Dashboard loads data correctly
- [ ] [ ] Filter by date range returns correct subset
- [ ] [ ] Top medicines chart is accurate
- [ ] [ ] Peak hours heatmap shows expected pattern
- [ ] [ ] Access control works: Free tier → no analytics

### Performance Testing
- [ ] [ ] Dashboard load time < 3 seconds (with 100k events)
- [ ] [ ] API response time < 500ms
- [ ] [ ] Memory usage stable over 24 hours

---

## Success Criteria (End of Week 4)

- ✅ All dispensing events captured with new schema
- ✅ Operations Dashboard displays and updates in real-time
- ✅ Analytics API endpoints return correct KPIs
- ✅ Risk scoring engine identifies high-risk events
- ✅ Test suite passes (80%+ coverage)
- ✅ Documentation complete and team trained
- ✅ Phase 1 ready for beta pilot with 2-3 test pharmacies

---

## Known Unknowns / TODOs

- [ ] Determine forecasting library: Prophet.js vs Python/statsmodels
- [ ] Decide on PDF export library: pdfkit vs reportlab
- [ ] Define anonymization rules for MOH/FDA compliance
- [ ] Confirm TimescaleDB vs ClickHouse selection (performance vs cost)
- [ ] Set up continuous deployment for analytics service
- [ ] Plan data retention policy (GDPR: 5 years? 10 years?)

---

## Owner & Escalation

- **Sprint Lead:** [Name TBD]
- **Database Owner:** [Name TBD]
- **Frontend Owner:** [Name TBD]
- **Escalation:** Pharmacist advisor for risk rule validation

---

## Last Updated

February 9, 2026

---

