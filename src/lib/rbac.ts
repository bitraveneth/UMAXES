import type {
  CompanyMemberRole,
  CustomerLevel,
  UserRole,
  UserStatus,
} from "@/generated/prisma/enums";
import { canAccessAdminPath, isStaffRole } from "@/lib/admin-access";

/** OWNER and BUYER can place orders; FINANCE is view-only. Null role treated as OWNER (legacy). */
export function canOrder(
  status: UserStatus,
  role: UserRole,
  companyRole?: CompanyMemberRole | null,
) {
  if (role !== "CUSTOMER" || status !== "APPROVED") return false;
  if (companyRole === "FINANCE") return false;
  return true;
}

export function canManageCompanyAddresses(
  status: UserStatus,
  role: UserRole,
  companyRole?: CompanyMemberRole | null,
) {
  return canOrder(status, role, companyRole);
}

export function isStaff(role: UserRole) {
  return isStaffRole(role);
}

export function canAccessAdmin(role: UserRole) {
  return isStaff(role);
}

/** Staff → admin · pending → wait · all customers (retail/wholesale/distro) → account storefront */
export function homeForRole(
  role: UserRole,
  status: UserStatus,
  _companyLevel?: CustomerLevel | null,
) {
  if (isStaff(role)) return "/admin";
  if (status === "PENDING") return "/account/pending";
  return "/account";
}

export type AdminNavItem = {
  href: string;
  label: string;
  roles: UserRole[];
  /** Optional i18n key under `nav.*` (defaults to href) */
  navKey?: string;
};

const SA: UserRole = "SUPER_ADMIN";
const AD: UserRole = "ADMIN";

/** Dropship ops nav — warehouse pages removed from menu. */
export const adminNav: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    roles: [SA, AD, "SALES", "WAREHOUSE", "LOGISTICS"],
  },
  {
    href: "/admin/activity",
    label: "Activity",
    roles: [SA, AD],
  },
  { href: "/admin/approvals", label: "Approvals", roles: [SA, AD, "SALES"] },
  {
    href: "/admin/distributors",
    label: "Distributors",
    roles: [SA, AD, "SALES"],
  },
  {
    href: "/admin/wholesalers",
    label: "Wholesalers",
    roles: [SA, AD, "SALES"],
  },
  { href: "/admin/retail", label: "Retail", roles: [SA, AD, "SALES"] },
  {
    href: "/admin/orders",
    label: "Orders",
    roles: [SA, AD, "SALES", "WAREHOUSE"],
  },
  {
    href: "/admin/orders/new",
    label: "Create order",
    roles: [SA, AD, "SALES"],
  },
  {
    href: "/admin/suppliers",
    label: "Suppliers",
    roles: [SA, AD, "SALES", "WAREHOUSE"],
  },
  /** Logistics primary — Orders (packing queue) */
  {
    href: "/admin/logistics",
    label: "Orders",
    navKey: "/admin/logistics/orders",
    roles: ["LOGISTICS"],
  },
  {
    href: "/admin/logistics",
    label: "Packing",
    navKey: "/admin/logistics",
    roles: [SA, AD, "SALES"],
  },
  {
    href: "/admin/logistics/shipments",
    label: "Shipments",
    roles: [SA, AD, "LOGISTICS", "SALES"],
  },
  {
    href: "/admin/logistics/packing-lists",
    label: "Packing lists",
    roles: [SA, AD, "LOGISTICS", "SALES"],
  },
  { href: "/admin/catalog", label: "Catalog", roles: [SA, AD] },
  { href: "/admin/coupons", label: "Coupons", roles: [SA, AD] },
  { href: "/admin/credit", label: "Credit", roles: [SA, AD, "SALES"] },
  { href: "/admin/aging", label: "Aging", roles: [SA, AD, "SALES"] },
  { href: "/admin/rma", label: "RMA", roles: [SA, AD, "SALES"] },
  { href: "/admin/commissions", label: "Commissions", roles: [SA, AD, "SALES"] },
  { href: "/admin/reports", label: "Reports", roles: [SA, AD, "SALES"] },
  { href: "/admin/staff", label: "Staff", roles: [SA] },
  { href: "/admin/system", label: "System", roles: [SA] },
  {
    href: "/admin/profile",
    label: "Profile",
    roles: [SA, AD, "SALES", "WAREHOUSE", "LOGISTICS"],
  },
  {
    href: "/admin/notifications",
    label: "Notifications",
    roles: [SA, AD, "SALES", "WAREHOUSE", "LOGISTICS"],
  },
];

export function navForRole(role: UserRole) {
  return adminNav.filter((item) => item.roles.includes(role));
}

export function canAccessPath(role: UserRole, pathname: string) {
  return canAccessAdminPath(role, pathname);
}
