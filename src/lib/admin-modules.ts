import type { UserRole } from "@/generated/prisma/enums";

/**
 * Admin module / submodule catalog for per-staff access control.
 * Keys are stable IDs stored on User.moduleAccess (JSON string array).
 */

export type AdminSubmoduleDef = {
  id: string;
  label: string;
  /** Primary href shown in nav / used for longest-prefix matching */
  href: string;
};

export type AdminModuleDef = {
  id: string;
  label: string;
  submodules: AdminSubmoduleDef[];
};

/** Always available to every staff account — not toggled in the UI. */
export const ALWAYS_ON_SUBMODULES = [
  "core.dashboard",
  "core.profile",
  "core.notifications",
] as const;

export type AlwaysOnSubmodule = (typeof ALWAYS_ON_SUBMODULES)[number];

export const ADMIN_MODULES: AdminModuleDef[] = [
  {
    id: "ops",
    label: "Daily ops",
    submodules: [
      { id: "ops.approvals", label: "Approvals", href: "/admin/approvals" },
      { id: "ops.orders", label: "Orders", href: "/admin/orders" },
      { id: "ops.orders_create", label: "Create order", href: "/admin/orders/new" },
      { id: "ops.packing", label: "Packing", href: "/admin/logistics" },
      {
        id: "ops.shipments",
        label: "Shipments",
        href: "/admin/logistics/shipments",
      },
      {
        id: "ops.packing_lists",
        label: "Packing lists",
        href: "/admin/logistics/packing-lists",
      },
      { id: "ops.suppliers", label: "Suppliers", href: "/admin/suppliers" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    submodules: [
      {
        id: "customers.distributors",
        label: "Distributors",
        href: "/admin/distributors",
      },
      {
        id: "customers.wholesalers",
        label: "Wholesalers",
        href: "/admin/wholesalers",
      },
      { id: "customers.retail", label: "Retail", href: "/admin/retail" },
      {
        id: "customers.directory",
        label: "Customer directory",
        href: "/admin/customers",
      },
    ],
  },
  {
    id: "money",
    label: "Accounts",
    submodules: [
      { id: "money.credit", label: "Credit", href: "/admin/credit" },
      { id: "money.aging", label: "Aging", href: "/admin/aging" },
      { id: "money.rebates", label: "Volume rebate", href: "/admin/rebates" },
      { id: "money.payments", label: "Payments", href: "/admin/payments" },
      { id: "money.coupons", label: "Coupons", href: "/admin/coupons" },
      {
        id: "money.commissions",
        label: "Commissions",
        href: "/admin/commissions",
      },
      { id: "money.rma", label: "RMA", href: "/admin/rma" },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    submodules: [
      { id: "catalog.products", label: "Catalog", href: "/admin/catalog" },
      { id: "catalog.warehouse", label: "Warehouse", href: "/admin/warehouse" },
      { id: "catalog.faq", label: "FAQ", href: "/admin/faq" },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    submodules: [
      { id: "insights.reports", label: "Reports", href: "/admin/reports" },
      { id: "insights.activity", label: "Activity", href: "/admin/activity" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    submodules: [
      { id: "admin.users", label: "Users", href: "/admin/users" },
      { id: "admin.users_new", label: "Add user", href: "/admin/users/new" },
      { id: "admin.staff", label: "Staff", href: "/admin/staff" },
      { id: "admin.learn", label: "Learning", href: "/admin/learn" },
      { id: "admin.system", label: "System", href: "/admin/system" },
    ],
  },
];

const SUBMODULE_BY_ID = new Map(
  ADMIN_MODULES.flatMap((m) => m.submodules.map((s) => [s.id, s] as const)),
);

/** Longer hrefs first so /admin/orders/new beats /admin/orders. */
const SUBMODULES_BY_HREF_LEN = ADMIN_MODULES.flatMap((m) => m.submodules).sort(
  (a, b) => b.href.length - a.href.length,
);

/** Role ceiling — max submodules a role may ever receive. */
const ROLE_CEILING: Record<UserRole, readonly string[] | "all"> = {
  SUPER_ADMIN: "all",
  ADMIN: "all",
  CUSTOMER: [],
  SALES: [
    "ops.approvals",
    "ops.orders",
    "ops.orders_create",
    "ops.packing",
    "ops.shipments",
    "ops.packing_lists",
    "ops.suppliers",
    "customers.distributors",
    "customers.wholesalers",
    "customers.retail",
    "customers.directory",
    "money.credit",
    "money.aging",
    "money.commissions",
    "money.rma",
    "insights.reports",
  ],
  WAREHOUSE: ["ops.orders", "ops.suppliers"],
  LOGISTICS: [
    "ops.packing",
    "ops.shipments",
    "ops.packing_lists",
  ],
};

export function allToggleableSubmoduleIds(): string[] {
  return ADMIN_MODULES.flatMap((m) => m.submodules.map((s) => s.id));
}

export function submoduleById(id: string): AdminSubmoduleDef | undefined {
  return SUBMODULE_BY_ID.get(id);
}

export function submoduleLabel(id: string): string {
  return SUBMODULE_BY_ID.get(id)?.label || id;
}

export function parseModuleAccess(
  raw: string | null | undefined,
): string[] | null {
  if (raw == null || raw === "") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const ids = parsed
      .filter((x): x is string => typeof x === "string")
      .filter((id) => SUBMODULE_BY_ID.has(id));
    return ids;
  } catch {
    return null;
  }
}

export function serializeModuleAccess(ids: string[]): string {
  const unique = [...new Set(ids.filter((id) => SUBMODULE_BY_ID.has(id)))].sort();
  return JSON.stringify(unique);
}

/** Max submodule set for a role (excludes always-on). */
export function roleCeilingSubmodules(role: UserRole): string[] {
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    // ADMIN never gets System; SUPER_ADMIN does not use this matrix in practice
    const all = allToggleableSubmoduleIds();
    if (role === "ADMIN") return all.filter((id) => id !== "admin.system");
    return all;
  }
  const ceiling = ROLE_CEILING[role];
  if (ceiling === "all") return allToggleableSubmoduleIds();
  return [...ceiling];
}

/**
 * Effective toggleable submodule keys for a user.
 * `custom == null` → role defaults (full ceiling).
 * Otherwise → custom ∩ role ceiling.
 */
export function effectiveSubmodules(
  role: UserRole,
  custom: string[] | null,
): string[] {
  if (role === "SUPER_ADMIN") return allToggleableSubmoduleIds();
  const ceiling = new Set(roleCeilingSubmodules(role));
  if (custom == null) return [...ceiling];
  return custom.filter((id) => ceiling.has(id));
}

export function hasSubmoduleAccess(
  role: UserRole,
  custom: string[] | null,
  submoduleId: string,
): boolean {
  if ((ALWAYS_ON_SUBMODULES as readonly string[]).includes(submoduleId)) {
    return true;
  }
  if (role === "SUPER_ADMIN") return true;
  return effectiveSubmodules(role, custom).includes(submoduleId);
}

/** Resolve pathname → submodule id (or always-on / null). */
export function submoduleForPath(pathname: string): string | null {
  const path = pathname.split("?")[0] || pathname;
  if (path === "/admin" || path === "/admin/") return "core.dashboard";
  if (path === "/admin/profile" || path.startsWith("/admin/profile/")) {
    return "core.profile";
  }
  if (
    path === "/admin/notifications" ||
    path.startsWith("/admin/notifications/")
  ) {
    return "core.notifications";
  }
  if (path === "/admin/audit" || path.startsWith("/admin/audit/")) {
    return "insights.activity";
  }

  for (const sub of SUBMODULES_BY_HREF_LEN) {
    if (path === sub.href || path.startsWith(`${sub.href}/`)) {
      // /admin/orders/new must not match ops.orders
      if (sub.id === "ops.orders" && path.startsWith("/admin/orders/new")) {
        continue;
      }
      if (sub.id === "admin.users" && path.startsWith("/admin/users/new")) {
        continue;
      }
      // /admin/logistics/shipments must not match ops.packing
      if (
        sub.id === "ops.packing" &&
        (path.startsWith("/admin/logistics/shipments") ||
          path.startsWith("/admin/logistics/packing-lists") ||
          path.startsWith("/admin/logistics/orders"))
      ) {
        continue;
      }
      return sub.id;
    }
  }
  return null;
}

/** Nav href → submodule (handles logistics dual labels via navKey). */
export function submoduleForNavHref(
  href: string,
  navKey?: string,
): string | null {
  if (navKey === "/admin/logistics/orders") return "ops.packing";
  return submoduleForPath(href);
}

/** Submodules an actor may assign to a target (excludes System unless SA→SA N/A). */
export function assignableSubmodulesFor(
  actorRole: UserRole,
  targetRole: UserRole,
): string[] {
  if (targetRole === "SUPER_ADMIN") return [];
  const ceiling = roleCeilingSubmodules(targetRole);
  if (actorRole === "SUPER_ADMIN") return ceiling;
  if (actorRole === "ADMIN") {
    return ceiling.filter((id) => id !== "admin.system");
  }
  return [];
}
