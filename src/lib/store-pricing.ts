import type { CustomerLevel, UserRole, UserStatus } from "@/generated/prisma/enums";

/**
 * Retail (SHOP) list prices stay in the catalog DB / flavor data
 * but are not shown on the public site. Wholesale & distributor
 * accounts see contracted rates after approval.
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
  return opts.companyLevel === "WHOLESALER" || opts.companyLevel === "DISTRO";
}
