# DPAP Database Migration Guide

**Updated Prisma Schema with Analytics Tables**

The Prisma schema has been updated to include three new tables for DPAP analytics:

## New Tables

### 1. DispensingEvent (Core Analytics Table)
Stores every dispensing event with full metadata for analytics pipeline.

```sql
CREATE TABLE "DispensingEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dispenseRecordId" TEXT NOT NULL UNIQUE,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "pharmacyId" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "drugId" TEXT NOT NULL,
  "drugName" TEXT NOT NULL,
  "genericName" TEXT,
  "patientAgeGroup" TEXT NOT NULL DEFAULT 'adult',
  "isPrescription" BOOLEAN NOT NULL DEFAULT true,
  "isControlledDrug" BOOLEAN NOT NULL DEFAULT false,
  "isAntibiotic" BOOLEAN NOT NULL DEFAULT false,
  "stgCompliant" BOOLEAN NOT NULL DEFAULT true,
  "overrideFlag" BOOLEAN NOT NULL DEFAULT false,
  "patientIsPregnant" BOOLEAN NOT NULL DEFAULT false,
  "riskScore" INTEGER NOT NULL DEFAULT 0,
  "riskCategory" TEXT NOT NULL DEFAULT 'none',
  "riskFlags" TEXT NOT NULL DEFAULT '[]',
  "highRiskFlag" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "syncedAt" TIMESTAMP(3)
);

CREATE INDEX "DispensingEvent_pharmacyId_timestamp_idx" ON "DispensingEvent"("pharmacyId", "timestamp");
CREATE INDEX "DispensingEvent_timestamp_idx" ON "DispensingEvent"("timestamp");
CREATE INDEX "DispensingEvent_riskCategory_idx" ON "DispensingEvent"("riskCategory");
CREATE INDEX "DispensingEvent_highRiskFlag_idx" ON "DispensingEvent"("highRiskFlag");
CREATE INDEX "DispensingEvent_userId_idx" ON "DispensingEvent"("userId");
CREATE INDEX "DispensingEvent_drugId_idx" ON "DispensingEvent"("drugId");
```

### 2. DailySummaryCache (Aggregation Table)
Pre-computed daily metrics for fast dashboard querying.

```sql
CREATE TABLE "DailySummaryCache" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" TIMESTAMP(3) NOT NULL,
  "pharmacyId" TEXT NOT NULL,
  "totalPrescriptions" INTEGER NOT NULL DEFAULT 0,
  "totalOTC" INTEGER NOT NULL DEFAULT 0,
  "avgDispensingTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "prescriptionRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "highRiskEvents" INTEGER NOT NULL DEFAULT 0,
  "stgComplianceRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "noneRiskCount" INTEGER NOT NULL DEFAULT 0,
  "lowRiskCount" INTEGER NOT NULL DEFAULT 0,
  "mediumRiskCount" INTEGER NOT NULL DEFAULT 0,
  "highRiskCount" INTEGER NOT NULL DEFAULT 0,
  "criticalRiskCount" INTEGER NOT NULL DEFAULT 0,
  "topMedicines" TEXT NOT NULL DEFAULT '[]',
  "hourlyDistribution" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "DailySummaryCache_date_pharmacyId_key" ON "DailySummaryCache"("date", "pharmacyId");
CREATE INDEX "DailySummaryCache_date_idx" ON "DailySummaryCache"("date");
CREATE INDEX "DailySummaryCache_pharmacyId_idx" ON "DailySummaryCache"("pharmacyId");
```

### 3. HighRiskAlert (Review Queue Table)
Tracks high-risk alerts for pharmacist review.

```sql
CREATE TABLE "HighRiskAlert" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dispensingEventId" TEXT NOT NULL,
  "pharmacyId" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "drugName" TEXT NOT NULL,
  "patientAgeGroup" TEXT NOT NULL,
  "riskScore" INTEGER NOT NULL,
  "riskCategory" TEXT NOT NULL,
  "flags" TEXT NOT NULL DEFAULT '[]',
  "reviewedBy" INTEGER,
  "reviewedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("dispensingEventId") REFERENCES "DispensingEvent"("id") ON DELETE CASCADE
);

CREATE INDEX "HighRiskAlert_pharmacyId_timestamp_idx" ON "HighRiskAlert"("pharmacyId", "timestamp");
CREATE INDEX "HighRiskAlert_reviewedBy_idx" ON "HighRiskAlert"("reviewedBy");
CREATE INDEX "HighRiskAlert_createdAt_idx" ON "HighRiskAlert"("createdAt");
CREATE INDEX "HighRiskAlert_dispensingEventId_idx" ON "HighRiskAlert"("dispensingEventId");
```

---

## Step-by-Step Migration Instructions

### Part 1: Create Migration File

```bash
cd d:\DEVELOPMENTS\FLASH_DEVS\SEMS\sems-app2
npx prisma migrate dev --name add_dpap_analytics_tables
```

This command will:
1. **Compare** your current schema with the database
2. **Generate** the migration SQL file
3. **Execute** the migration
4. **Update** `prisma/client` bindings

### Part 2: Verify Migration

```bash
# Check migration status
npx prisma migrate status

# View all migrations
ls prisma/migrations/
```

### Part 3: Inspect Generated Migration

The migration file will be created at:
```
prisma/migrations/[timestamp]_add_dpap_analytics_tables/migration.sql
```

Review it to confirm all tables and indexes were created correctly.

---

## Integration with Analytics Services

### Update aggregationEngine.ts

Once the migration is applied, update `src/services/analytics/aggregationEngine.ts` to read from PostgreSQL instead of mock data:

```typescript
// Instead of: const events = mockDispensingEvents;
// Use this:

import { prisma } from '@/lib/prisma';

export async function aggregateDailyMetrics(startDate: Date, endDate: Date, pharmacyId: string) {
  // Query from database
  const events = await prisma.dispensingEvent.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      pharmacyId,
    },
    orderBy: { timestamp: 'asc' },
  });

  // Rest of aggregation logic stays the same
  // ...
}
```

### Save Aggregations to Cache

After aggregating daily metrics, save to `DailySummaryCache`:

```typescript
await prisma.dailySummaryCache.upsert({
  where: {
    date_pharmacyId: {
      date: new Date(dayStart),
      pharmacyId,
    },
  },
  create: {
    date: new Date(dayStart),
    pharmacyId,
    totalPrescriptions: metrics.prescriptionCount,
    totalOTC: metrics.otcCount,
    highRiskEvents: metrics.highRiskCount,
    // ... other fields
  },
  update: {
    totalPrescriptions: metrics.prescriptionCount,
    totalOTC: metrics.otcCount,
    highRiskEvents: metrics.highRiskCount,
    // ... other fields
    updatedAt: new Date(),
  },
});
```

---

## Database Performance Tuning

### For PostgreSQL (Production)

**Enable TimescaleDB hypertable** (optional but recommended for high volume):

```sql
-- Install TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert DispensingEvent to hypertable
SELECT create_hypertable('DispensingEvent', 'timestamp', if_not_exists => TRUE);

-- Create continuous aggregate for 1-day rollup
CREATE MATERIALIZED VIEW daily_rollup AS
SELECT
  time_bucket('1 day', timestamp) AS date,
  pharmacyId,
  COUNT(*) as total_events,
  SUM(CASE WHEN isPrescription THEN 1 ELSE 0 END) as prescriptions,
  AVG(riskScore) as avg_risk_score,
  SUM(CASE WHEN highRiskFlag THEN 1 ELSE 0 END) as high_risk_count
FROM DispensingEvent
GROUP BY 1, 2;

-- Create index for daily queries
CREATE INDEX ON daily_rollup (pharmacyId, date DESC);
```

### Connection Pooling

For production, use a connection pool like **PgBouncer**:

```bash
# Connection pool configuration (pgbouncer.ini)
[databases]
sems_db = host=localhost port=5432 dbname=sems_production

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 25
```

---

## Rollback Instructions

If you need to rollback to the previous schema:

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back add_dpap_analytics_tables

# Or manually revert
npx prisma migrate resolve --rolled-back

# Verify rollback
npx prisma migrate status
```

---

## Troubleshooting

**Error: `Column does not exist`**
→ Re-run the migration: `npx prisma prisma deploy`

**Error: `Cannot create table, table already exists`**
→ Check if tables exist: `\dt DispensingEvent` in psql  
→ If they exist, mark migration as applied: `npx prisma migrate resolve --applied add_dpap_analytics_tables`

**Error: `Foreign key constraint failed`**
→ Ensure DispensingEvent references valid User IDs  
→ Check: `SELECT COUNT(*) FROM "DispensingEvent" WHERE "userId" NOT IN (SELECT id FROM "User");`

---

## Testing the Migration

```bash
# Populate test data
npm run seed:analytics

# Query test data
npx prisma db execute --stdin < test-query.sql

# Check record count
npx prisma db execute << 'SQL'
SELECT COUNT(*) FROM "DispensingEvent";
SELECT COUNT(*) FROM "DailySummaryCache";
SELECT COUNT(*) FROM "HighRiskAlert";
SQL
```

---

## Next Steps

1. **Run migration**: `npx prisma migrate dev`
2. **Verify tables**: Check PostgreSQL with `\dt` in psql
3. **Update APIs**: Modify endpoint routes to read from DB
4. **Deploy dashboard**: UI components ready to display data
5. **Monitor performance**: Use `EXPLAIN ANALYZE` on slow queries

