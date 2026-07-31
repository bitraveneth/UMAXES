-- CreateEnum
CREATE TYPE "CompanyMemberRole" AS ENUM ('OWNER', 'BUYER', 'FINANCE');

-- CreateEnum
CREATE TYPE "RmaStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'CREDITED', 'CLOSED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyRole" "CompanyMemberRole";

-- CreateTable
CREATE TABLE "Rma" (
    "id" TEXT NOT NULL,
    "rmaNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RmaStatus" NOT NULL DEFAULT 'REQUESTED',
    "creditAmount" DOUBLE PRECISION,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RmaItem" (
    "id" TEXT NOT NULL,
    "rmaId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "RmaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'logged',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rma_rmaNumber_key" ON "Rma"("rmaNumber");

-- CreateIndex
CREATE INDEX "Rma_companyId_idx" ON "Rma"("companyId");

-- CreateIndex
CREATE INDEX "Rma_status_idx" ON "Rma"("status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Rma" ADD CONSTRAINT "Rma_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rma" ADD CONSTRAINT "Rma_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rma" ADD CONSTRAINT "Rma_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RmaItem" ADD CONSTRAINT "RmaItem_rmaId_fkey" FOREIGN KEY ("rmaId") REFERENCES "Rma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
