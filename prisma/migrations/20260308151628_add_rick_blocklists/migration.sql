/*
  Warnings:

  - You are about to drop the `BlockedMetchant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "BlockedMetchant";

-- CreateTable
CREATE TABLE "BlockedMerchant" (
    "id" TEXT NOT NULL,
    "merchatId" TEXT NOT NULL,
    "reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedMerchant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedMerchant_merchatId_key" ON "BlockedMerchant"("merchatId");
