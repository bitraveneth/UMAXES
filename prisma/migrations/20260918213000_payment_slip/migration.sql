-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "slipUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "slipFileName" TEXT;
ALTER TABLE "Payment" ADD COLUMN "slipMime" TEXT;
ALTER TABLE "Payment" ADD COLUMN "slipUploadedAt" TIMESTAMP(3);
