import type { UserRole } from "@/generated/prisma/enums";

/** Prisma where fragment: SALES only sees assigned accounts; ADMIN sees all. */
export function companyScopeForStaff(
  role: UserRole,
  userId: string,
): { salesRepId?: string } | Record<string, never> {
  if (role === "SALES") return { salesRepId: userId };
  return {};
}

export function orderCompanyScopeForStaff(role: UserRole, userId: string) {
  const scope = companyScopeForStaff(role, userId);
  if (!("salesRepId" in scope) || !scope.salesRepId) return {};
  return { company: { salesRepId: scope.salesRepId } };
}

export async function assertStaffOwnsCompany(
  role: UserRole,
  userId: string,
  companySalesRepId: string | null | undefined,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return { ok: true };
  if (role === "SALES") {
    if (companySalesRepId !== userId) {
      return {
        ok: false,
        status: 403,
        error: "You can only manage companies assigned to you",
      };
    }
    return { ok: true };
  }
  return { ok: false, status: 403, error: "Forbidden" };
}
