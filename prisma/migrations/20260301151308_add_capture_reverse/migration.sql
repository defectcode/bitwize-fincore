-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuthStatus" ADD VALUE 'CAPTURED';
ALTER TYPE "AuthStatus" ADD VALUE 'REVERSED';

-- CreateTable
CREATE TABLE "Capture" (
    "id" TEXT NOT NULL,
    "authorizationId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Capture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reversal" (
    "id" TEXT NOT NULL,
    "authorizationId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "createdAd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reversal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Capture_authorizationId_key" ON "Capture"("authorizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Capture_idempotencyKey_key" ON "Capture"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Reversal_authorizationId_key" ON "Reversal"("authorizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Reversal_idempotencyKey_key" ON "Reversal"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_authorizationId_fkey" FOREIGN KEY ("authorizationId") REFERENCES "Authorization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reversal" ADD CONSTRAINT "Reversal_authorizationId_fkey" FOREIGN KEY ("authorizationId") REFERENCES "Authorization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
