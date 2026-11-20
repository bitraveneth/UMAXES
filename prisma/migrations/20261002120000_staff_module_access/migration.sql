-- Per-staff admin module / submodule allowlist (JSON string array of submodule ids).
-- NULL means use role defaults.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "moduleAccess" TEXT;
