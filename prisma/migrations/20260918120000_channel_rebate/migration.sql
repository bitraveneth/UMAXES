-- AlterTable
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "rebateBalanceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "firstOrderId" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "firstCompletedOrderId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sellingQty" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "chargedQty" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "testStationQty" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "firstOrderUnpaidPcs" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "rebateAppliedUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isFirstOrder" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "RebatePolicy" (
    "id" TEXT NOT NULL,
    "level" "CustomerLevel" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "unitPrice" DOUBLE PRECISION,
    "pcsPerCase" INTEGER NOT NULL DEFAULT 95,
    "testStationsPerCase" INTEGER NOT NULL DEFAULT 1,
    "firstOrderCases" INTEGER NOT NULL DEFAULT 5,
    "firstOrderUnpaidPcs" INTEGER NOT NULL DEFAULT 20,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "tiers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RebatePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RebateMonth" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "paidQty" INTEGER NOT NULL DEFAULT 0,
    "tierRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rebateAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issuedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "policySnapshot" TEXT NOT NULL DEFAULT '{}',
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RebateMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RebateLedger" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderId" TEXT,
    "rebateMonthId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RebateLedger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RebatePolicy_level_key" ON "RebatePolicy"("level");
CREATE UNIQUE INDEX IF NOT EXISTS "RebateMonth_companyId_yearMonth_key" ON "RebateMonth"("companyId", "yearMonth");
CREATE INDEX IF NOT EXISTS "RebateMonth_yearMonth_idx" ON "RebateMonth"("yearMonth");
CREATE INDEX IF NOT EXISTS "RebateMonth_status_idx" ON "RebateMonth"("status");
CREATE INDEX IF NOT EXISTS "RebateLedger_companyId_idx" ON "RebateLedger"("companyId");
CREATE INDEX IF NOT EXISTS "RebateLedger_orderId_idx" ON "RebateLedger"("orderId");

ALTER TABLE "RebateMonth" DROP CONSTRAINT IF EXISTS "RebateMonth_companyId_fkey";
ALTER TABLE "RebateMonth" ADD CONSTRAINT "RebateMonth_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RebateLedger" DROP CONSTRAINT IF EXISTS "RebateLedger_companyId_fkey";
ALTER TABLE "RebateLedger" ADD CONSTRAINT "RebateLedger_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RebateLedger" DROP CONSTRAINT IF EXISTS "RebateLedger_orderId_fkey";
ALTER TABLE "RebateLedger" ADD CONSTRAINT "RebateLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RebateLedger" DROP CONSTRAINT IF EXISTS "RebateLedger_rebateMonthId_fkey";
ALTER TABLE "RebateLedger" ADD CONSTRAINT "RebateLedger_rebateMonthId_fkey" FOREIGN KEY ("rebateMonthId") REFERENCES "RebateMonth"("id") ON DELETE SET NULL ON UPDATE CASCADE;
