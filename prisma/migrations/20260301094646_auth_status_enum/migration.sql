-- CreateEnum
CREATE TYPE "AuthStatus" AS ENUM ('APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "Authorization" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "AuthStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Authorization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Authorization_idempotencyKey_key" ON "Authorization"("idempotencyKey");
