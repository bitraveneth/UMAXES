-- Shipping contact fields used by admin customers / create-order
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "recipientName" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "phone" TEXT;
