-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankAddress" TEXT NOT NULL DEFAULT '',
    "swiftCode" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankAccount_isActive_idx" ON "BankAccount"("isActive");

-- Default invoice bank (Dah Sing) — shown on PI/CI until another account is activated
INSERT INTO "BankAccount" (
    "id",
    "label",
    "companyName",
    "accountNumber",
    "bankName",
    "bankAddress",
    "swiftCode",
    "currency",
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    'bank_dah_sing_default',
    'Dah Sing Bank',
    'UMAXES LIMITED',
    '308018443518',
    'DAH SING BANK LIMITED',
    'Dah Sing Bank, 26/F Dah Sing Financial Centre, 248 Queen''s Road East, Wan Chai, Hong Kong',
    'DSBAHKHH',
    'USD',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
