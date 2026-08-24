-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "lastLoginIp" TEXT,
ADD COLUMN "lastLoginCountry" TEXT,
ADD COLUMN "lastLoginUserAgent" TEXT,
ADD COLUMN "lastLoginDevice" TEXT;
