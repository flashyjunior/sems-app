-- DropIndex
DROP INDEX "DispenseRecord_patientPhoneNumber_idx";

-- AlterTable
ALTER TABLE "DispenseRecord" ADD COLUMN     "pharmacyId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pharmacyId" INTEGER;

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketNote" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isAdminNote" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketNotification" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ticket-updated',
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMTPSettings" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT true,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "replyToEmail" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "testStatus" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMTPSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempDrug" (
    "id" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "tradeName" TEXT[],
    "strength" TEXT NOT NULL,
    "route" TEXT NOT NULL DEFAULT 'oral',
    "category" TEXT NOT NULL,
    "stgReference" TEXT,
    "contraindications" TEXT[],
    "pregnancyCategory" TEXT,
    "warnings" TEXT[],
    "createdByPharmacistId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedByAdminId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TempDrug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempDoseRegimen" (
    "id" TEXT NOT NULL,
    "tempDrugId" TEXT NOT NULL,
    "drugId" TEXT,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "weightMin" DOUBLE PRECISION,
    "weightMax" DOUBLE PRECISION,
    "ageGroup" TEXT NOT NULL DEFAULT 'adult',
    "doseMg" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "maxDoseMgDay" TEXT,
    "route" TEXT NOT NULL DEFAULT 'oral',
    "instructions" TEXT,
    "createdByPharmacistId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedByAdminId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TempDoseRegimen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pharmacy" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "licenseNumber" TEXT,
    "manager" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pharmacy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");

-- CreateIndex
CREATE INDEX "Ticket_ticketNumber_idx" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "TicketNote_ticketId_idx" ON "TicketNote"("ticketId");

-- CreateIndex
CREATE INDEX "TicketNote_userId_idx" ON "TicketNote"("userId");

-- CreateIndex
CREATE INDEX "TicketNotification_userId_idx" ON "TicketNotification"("userId");

-- CreateIndex
CREATE INDEX "TicketNotification_ticketId_idx" ON "TicketNotification"("ticketId");

-- CreateIndex
CREATE INDEX "TicketNotification_read_idx" ON "TicketNotification"("read");

-- CreateIndex
CREATE INDEX "TempDrug_genericName_idx" ON "TempDrug"("genericName");

-- CreateIndex
CREATE INDEX "TempDrug_status_idx" ON "TempDrug"("status");

-- CreateIndex
CREATE INDEX "TempDrug_createdAt_idx" ON "TempDrug"("createdAt");

-- CreateIndex
CREATE INDEX "TempDoseRegimen_tempDrugId_idx" ON "TempDoseRegimen"("tempDrugId");

-- CreateIndex
CREATE INDEX "TempDoseRegimen_status_idx" ON "TempDoseRegimen"("status");

-- CreateIndex
CREATE INDEX "TempDoseRegimen_createdAt_idx" ON "TempDoseRegimen"("createdAt");

-- CreateIndex
CREATE INDEX "Pharmacy_name_idx" ON "Pharmacy"("name");

-- CreateIndex
CREATE INDEX "DispenseRecord_pharmacyId_idx" ON "DispenseRecord"("pharmacyId");

-- CreateIndex
CREATE INDEX "User_pharmacyId_idx" ON "User"("pharmacyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseRecord" ADD CONSTRAINT "DispenseRecord_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketNote" ADD CONSTRAINT "TicketNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketNote" ADD CONSTRAINT "TicketNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketNotification" ADD CONSTRAINT "TicketNotification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketNotification" ADD CONSTRAINT "TicketNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
