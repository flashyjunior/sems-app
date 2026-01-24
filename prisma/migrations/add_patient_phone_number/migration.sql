-- Add patientPhoneNumber column to DispenseRecord table
ALTER TABLE "DispenseRecord" ADD COLUMN "patientPhoneNumber" TEXT;

-- Create an index on patientPhoneNumber for faster searches
CREATE INDEX "DispenseRecord_patientPhoneNumber_idx" ON "DispenseRecord"("patientPhoneNumber");
