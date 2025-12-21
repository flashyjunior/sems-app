-- CreateTable "Drug"
CREATE TABLE "Drug" (
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("id")
);

-- CreateTable "DoseRegimen"
CREATE TABLE "DoseRegimen" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoseRegimen_pkey" PRIMARY KEY ("id")
);

-- CreateTable "PrintTemplate"
CREATE TABLE "PrintTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "htmlTemplate" TEXT NOT NULL,
    "escposTemplate" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Drug_genericName_idx" ON "Drug"("genericName");

-- CreateIndex
CREATE INDEX "Drug_category_idx" ON "Drug"("category");

-- CreateIndex
CREATE INDEX "DoseRegimen_drugId_idx" ON "DoseRegimen"("drugId");

-- CreateIndex
CREATE INDEX "DoseRegimen_ageGroup_idx" ON "DoseRegimen"("ageGroup");

-- CreateIndex
CREATE INDEX "PrintTemplate_name_idx" ON "PrintTemplate"("name");

-- CreateIndex
CREATE INDEX "PrintTemplate_isDefault_idx" ON "PrintTemplate"("isDefault");
