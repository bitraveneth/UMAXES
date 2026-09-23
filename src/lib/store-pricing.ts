import type { CustomerLevel, UserRole, UserStatus } from "@/generated/prisma/enums";

/**
 * Guests stay on "On request". Every logged-in account sees the
 * same storefront price block: their rate, with retail in the same place.
 */
export function canSeeStorePrices(opts: {
  role?: UserRole | string | null;
  companyLevel?: CustomerLevel | string | null;
  status?: UserStatus | string | null;
}) {
  const role = opts.role;
  if (!role) return false;
  if (role !== "CUSTOMER") return true;
  if (opts.status && opts.status !== "APPROVED") return false;
  return Boolean(opts.companyLevel);
}
