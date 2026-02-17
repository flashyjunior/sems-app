-- Add pharmacyId to integer-based tables (User, DispenseRecord) with FK to Pharmacy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='User' AND table_schema='public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='pharmacyId'
    ) THEN
      ALTER TABLE "User" ADD COLUMN "pharmacyId" integer;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE tablename='User' AND indexname='User_pharmacyId_idx'
    ) THEN
      CREATE INDEX "User_pharmacyId_idx" ON "User"("pharmacyId");
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname='User_pharmacyId_fkey'
    ) THEN
      -- Only add FK if referenced table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Pharmacy' AND table_schema='public') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='DispenseRecord' AND table_schema='public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name='DispenseRecord' AND column_name='pharmacyId'
    ) THEN
      ALTER TABLE "DispenseRecord" ADD COLUMN "pharmacyId" integer;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE tablename='DispenseRecord' AND indexname='DispenseRecord_pharmacyId_idx'
    ) THEN
      CREATE INDEX "DispenseRecord_pharmacyId_idx" ON "DispenseRecord"("pharmacyId");
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname='DispenseRecord_pharmacyId_fkey'
    ) THEN
      -- Only add FK if referenced table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Pharmacy' AND table_schema='public') THEN
        ALTER TABLE "DispenseRecord" ADD CONSTRAINT "DispenseRecord_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- Add pharmacyId to analytics/string-based tables (DispensingEvent, HighRiskAlert) as text columns (no FK)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='DispensingEvent' AND table_schema='public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name='DispensingEvent' AND column_name='pharmacyId'
    ) THEN
      ALTER TABLE "DispensingEvent" ADD COLUMN "pharmacyId" text;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE tablename='DispensingEvent' AND indexname='DispensingEvent_pharmacyId_idx'
    ) THEN
      CREATE INDEX "DispensingEvent_pharmacyId_idx" ON "DispensingEvent"("pharmacyId");
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='HighRiskAlert' AND table_schema='public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name='HighRiskAlert' AND column_name='pharmacyId'
    ) THEN
      ALTER TABLE "HighRiskAlert" ADD COLUMN "pharmacyId" text;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE tablename='HighRiskAlert' AND indexname='HighRiskAlert_pharmacyId_idx'
    ) THEN
      CREATE INDEX "HighRiskAlert_pharmacyId_idx" ON "HighRiskAlert"("pharmacyId");
    END IF;
  END IF;
END $$;
