-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "country" TEXT;

-- CreateTable
CREATE TABLE "BlockedMetchant" (
    "id" TEXT NOT NULL,
    "metchatId" TEXT NOT NULL,
    "reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedMetchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedCountry" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedCountry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedMetchant_metchatId_key" ON "BlockedMetchant"("metchatId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedCountry_countryCode_key" ON "BlockedCountry"("countryCode");
