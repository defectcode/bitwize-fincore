/*
  Warnings:

  - You are about to drop the column `merchatId` on the `BlockedMerchant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[merchantId]` on the table `BlockedMerchant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `merchantId` to the `BlockedMerchant` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BlockedMerchant_merchatId_key";

-- AlterTable
ALTER TABLE "BlockedMerchant" DROP COLUMN "merchatId",
ADD COLUMN     "merchantId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BlockedMerchant_merchantId_key" ON "BlockedMerchant"("merchantId");
