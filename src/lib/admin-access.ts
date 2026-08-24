import type { UserRole } from "@/generated/prisma/enums";

/** Edge-safe staff / path gates (no Node-only imports). */
export function isStaffRole(role: string): role is UserRole {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "SALES" ||
    role === "WAREHOUSE" ||
    role === "LOGISTICS"
  );
}

export function isSuperAdmin(role: string) {
  return role === "SUPER_ADMIN";
}

/** Ops admin or super — not sales/logistics. */
export function isOpsAdmin(role: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

type PathRule = { href: string; roles: UserRole[] };

const ADMIN_PATH_RULES: PathRule[] = [
  { href: "/admin/approvals", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  { href: "/admin/customers", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  { href: "/admin/distributors", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  { href: "/admin/wholesalers", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  { href: "/admin/retail", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  { href: "/admin/orders", roles: ["ADMIN", "SALES", "WAREHOUSE", "SUPER_ADMIN"] },
  { href: "/admin/orders/new", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  { href: "/admin/suppliers", roles: ["ADMIN", "SALES", "WAREHOUSE", "SUPER_ADMIN"] },
  { href: "/admin/warehouse", roles: [] },
  { href: "/admin/warehouses", roles: [] },
  { href: "/admin/logistics", roles: ["ADMIN", "LOGISTICS", "SALES", "SUPER_ADMIN"] },
  {
    href: "/admin/profile",
    roles: ["ADMIN", "SALES", "WAREHOUSE", "LOGISTICS", "SUPER_ADMIN"],
  },
  { href: "/admin/catalog", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/coupons", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/credit", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  { href: "/admin/aging", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  {
    href: "/admin/notifications",
    roles: ["ADMIN", "SALES", "WAREHOUSE", "LOGISTICS", "SUPER_ADMIN"],
  },
  { href: "/admin/rma", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  { href: "/admin/commissions", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  { href: "/admin/reports", roles: ["ADMIN", "SALES", "SUPER_ADMIN"] },
  { href: "/admin/activity", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/learn", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/audit", roles: ["ADMIN", "SUPER_ADMIN"] },
  /** Customer users directory — admin + super admin */
  { href: "/admin/users", roles: ["SUPER_ADMIN", "ADMIN"] },
  /** Internal staff accounts — admin + super admin */
  { href: "/admin/staff", roles: ["SUPER_ADMIN", "ADMIN"] },
  /** DB backup / reset / import — super admin only */
  { href: "/admin/system", roles: ["SUPER_ADMIN"] },
];

export function canAccessAdminPath(role: string, pathname: string): boolean {
  if (!isStaffRole(role)) return false;
  if (pathname === "/admin" || pathname === "/admin/") return true;

  // System tools stay super-admin only
  if (
    pathname === "/admin/system" ||
    pathname.startsWith("/admin/system/")
  ) {
    return role === "SUPER_ADMIN";
  }

  // Users + Staff — admin + super admin
  if (
    pathname === "/admin/users" ||
    pathname.startsWith("/admin/users/") ||
    pathname === "/admin/staff" ||
    pathname.startsWith("/admin/staff/")
  ) {
    return role === "SUPER_ADMIN" || role === "ADMIN";
  }

  if (role === "SUPER_ADMIN") {
    if (
      pathname.startsWith("/admin/warehouse") ||
      pathname === "/admin/warehouses" ||
      pathname.startsWith("/admin/warehouses/")
    ) {
      return false;
    }
    return true;
  }

  // Regular ADMIN: almost everything except system / warehouse desk
  if (role === "ADMIN") {
    if (
      pathname.startsWith("/admin/warehouse") ||
      pathname === "/admin/warehouses" ||
      pathname.startsWith("/admin/warehouses/")
    ) {
      return false;
    }
    return true;
  }

  let best: PathRule | null = null;
  for (const rule of ADMIN_PATH_RULES) {
    if (pathname === rule.href || pathname.startsWith(`${rule.href}/`)) {
      if (!best || rule.href.length > best.href.length) best = rule;
    }
  }

  if (!best) return false;
  return best.roles.includes(role as UserRole);
}
