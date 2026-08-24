/** Human-readable labels + categories for admin Activity / audit log */

export type ActivityCategory =
  | "all"
  | "orders"
  | "payments"
  | "shipping"
  | "credit"
  | "customers"
  | "catalog"
  | "rma"
  | "system"
  | "other";

export const ACTIVITY_FILTERS: {
  id: ActivityCategory;
  label: string;
  labelZh: string;
}[] = [
  { id: "all", label: "All", labelZh: "全部" },
  { id: "orders", label: "Orders", labelZh: "订单" },
  { id: "payments", label: "Payments", labelZh: "付款" },
  { id: "shipping", label: "Shipping", labelZh: "物流" },
  { id: "credit", label: "Credit", labelZh: "授信" },
  { id: "customers", label: "Customers", labelZh: "客户" },
  { id: "catalog", label: "Catalog", labelZh: "商品" },
  { id: "rma", label: "RMA", labelZh: "退换" },
  { id: "system", label: "System", labelZh: "系统" },
];

const ACTION_META: Record<
  string,
  { label: string; category: ActivityCategory; tone: "brand" | "success" | "warning" | "error" | "neutral" }
> = {
  ORDER_CREATED: { label: "Order placed", category: "orders", tone: "brand" },
  ORDER_CREATED_ON_BEHALF: {
    label: "Order placed by staff",
    category: "orders",
    tone: "brand",
  },
  ORDER_STATUS: { label: "Order status changed", category: "orders", tone: "warning" },
  ORDER_SENT_TO_SUPPLIER: {
    label: "Sent to supplier",
    category: "orders",
    tone: "brand",
  },
  PAYMENT_RECEIVED: {
    label: "Payment marked paid",
    category: "payments",
    tone: "success",
  },
  TRACKING_UPLOADED: {
    label: "Tracking / shipment updated",
    category: "shipping",
    tone: "success",
  },
  TRACKING_SYNC: {
    label: "Tracking synced",
    category: "shipping",
    tone: "neutral",
  },
  SHIPMENT_PACKING_CREATED: {
    label: "Packing list created",
    category: "shipping",
    tone: "brand",
  },
  SHIPMENT_PACKING_UPDATED: {
    label: "Packing list updated",
    category: "shipping",
    tone: "brand",
  },
  CREDIT_PAYMENT: {
    label: "Credit payment recorded",
    category: "credit",
    tone: "success",
  },
  CREDIT_TERMS_UPDATED: {
    label: "Credit terms updated",
    category: "credit",
    tone: "warning",
  },
  USER_APPROVED: { label: "Customer approved", category: "customers", tone: "success" },
  USER_REJECTED: { label: "Customer rejected", category: "customers", tone: "error" },
  USER_REGISTERED: { label: "Customer registered", category: "customers", tone: "neutral" },
  CUSTOMER_CREATED_ON_BEHALF: {
    label: "Customer created by staff",
    category: "customers",
    tone: "brand",
  },
  COMPANY_ADDRESS_ADDED: {
    label: "Ship-to address added",
    category: "customers",
    tone: "neutral",
  },
  SUBACCOUNT_CREATED: {
    label: "Sub-account created",
    category: "customers",
    tone: "neutral",
  },
  SALES_ASSIGN: { label: "Sales rep assigned", category: "customers", tone: "neutral" },
  PRODUCT_CREATE: { label: "Product created", category: "catalog", tone: "brand" },
  PRODUCT_UPDATE: { label: "Product updated", category: "catalog", tone: "neutral" },
  PRODUCT_VISIBILITY: {
    label: "Product visibility changed",
    category: "catalog",
    tone: "neutral",
  },
  PRODUCT_OPTION_ADD: { label: "Product option added", category: "catalog", tone: "neutral" },
  PRODUCT_OPTION_DELETE: {
    label: "Product option removed",
    category: "catalog",
    tone: "warning",
  },
  PRICE_UPDATE: { label: "Price updated", category: "catalog", tone: "warning" },
  INVENTORY_ADJUST: { label: "Inventory adjusted", category: "catalog", tone: "warning" },
  COUPON_SAVE: { label: "Coupon saved", category: "catalog", tone: "neutral" },
  SUPPLIER_CREATED: { label: "Supplier created", category: "orders", tone: "brand" },
  SUPPLIER_UPDATED: { label: "Supplier updated", category: "orders", tone: "neutral" },
  RMA_REQUESTED: { label: "RMA requested", category: "rma", tone: "warning" },
  RMA_STATUS: { label: "RMA status changed", category: "rma", tone: "warning" },
  RMA_CREATED_ADMIN: { label: "RMA created by staff", category: "rma", tone: "brand" },
  RMA_MARK_REPLACEMENT: {
    label: "RMA marked for replacement",
    category: "rma",
    tone: "warning",
  },
  RMA_CLEAR_REPLACEMENT: {
    label: "RMA replacement cleared",
    category: "rma",
    tone: "neutral",
  },
  USER_ROLE_CHANGED: {
    label: "User role changed",
    category: "system",
    tone: "warning",
  },
  STAFF_UPSERT: { label: "Staff account saved", category: "system", tone: "brand" },
  STAFF_UPDATED: { label: "Staff account updated", category: "system", tone: "neutral" },
  STAFF_DELETED: { label: "Staff account deleted", category: "system", tone: "error" },
  STAFF_DISABLED: {
    label: "Staff account disabled",
    category: "system",
    tone: "warning",
  },
  STAFF_PROFILE_UPDATED: {
    label: "Staff profile updated",
    category: "system",
    tone: "neutral",
  },
  CUSTOMER_DELETED: {
    label: "Customer account deleted",
    category: "system",
    tone: "error",
  },
  CUSTOMER_DISABLED: {
    label: "Customer account disabled",
    category: "system",
    tone: "warning",
  },
  SYSTEM_BACKUP_EXPORT: {
    label: "Database backup exported",
    category: "system",
    tone: "success",
  },
  SYSTEM_BACKUP_IMPORT: {
    label: "Database backup imported",
    category: "system",
    tone: "warning",
  },
  SYSTEM_DB_RESET: { label: "Database reset", category: "system", tone: "error" },
  SITE_ACCESS_UPDATED: {
    label: "Site homepage mode changed",
    category: "system",
    tone: "warning",
  },
  WAREHOUSE_UPSERT: { label: "Warehouse saved", category: "catalog", tone: "neutral" },
  WAREHOUSE_STOCK: { label: "Warehouse stock updated", category: "catalog", tone: "neutral" },
};

export function activityCategoryFor(action: string): ActivityCategory {
  return ACTION_META[action]?.category || "other";
}

export function activityLabel(action: string, meta?: string | null): string {
  if (action === "USER_ROLE_CHANGED" && meta) {
    try {
      const m = JSON.parse(meta) as {
        previousRole?: string;
        role?: string;
      };
      if (m.previousRole === "CUSTOMER" && m.role && m.role !== "CUSTOMER") {
        return "Promoted to staff";
      }
      if (m.previousRole && m.previousRole !== "CUSTOMER" && m.role === "CUSTOMER") {
        return "Demoted to customer";
      }
      if (m.previousRole && m.role && m.previousRole !== m.role) {
        return "Staff role changed";
      }
    } catch {
      /* fall through */
    }
  }
  return ACTION_META[action]?.label || action.replace(/_/g, " ").toLowerCase();
}

export function activityTone(
  action: string,
): "brand" | "success" | "warning" | "error" | "neutral" {
  return ACTION_META[action]?.tone || "neutral";
}

export function actionsForCategory(category: ActivityCategory): string[] | null {
  if (category === "all") return null;
  return Object.entries(ACTION_META)
    .filter(([, v]) => v.category === category)
    .map(([k]) => k);
}

/** Pretty-print meta JSON for the activity feed */
export function formatActivityMeta(
  action: string,
  meta: string | null,
  opts: { canSeeCreditAmounts: boolean },
): string {
  if (!meta) return "";
  if (action.startsWith("CREDIT_") && !opts.canSeeCreditAmounts) {
    return "Details confidential";
  }
  try {
    const m = JSON.parse(meta) as Record<string, unknown>;
    const parts: string[] = [];
    if (m.orderNumber) parts.push(`Order ${m.orderNumber}`);
    if (m.status) parts.push(`Status → ${String(m.status)}`);
    if (m.previousStatus && m.status) {
      parts.push(`${m.previousStatus} → ${m.status}`);
    }
    if (m.reference) parts.push(`Ref: ${m.reference}`);
    if (m.carrier) parts.push(`Carrier: ${m.carrier}`);
    if (m.trackingNumber) parts.push(`Tracking: ${m.trackingNumber}`);
    if (m.companyName) parts.push(String(m.companyName));
    if (m.supplierName) parts.push(`Supplier: ${m.supplierName}`);
    if (m.scope) parts.push(`Scope: ${m.scope}`);
    if (action === "SITE_ACCESS_UPDATED" && m.mode) {
      const label = m.mode === "login" ? "Sign in page" : "Home page";
      const prev =
        m.previous === "login"
          ? "Sign in page"
          : m.previous === "home"
            ? "Home page"
            : null;
      parts.push(prev ? `${prev} → ${label}` : label);
    } else if (m.mode) {
      parts.push(`Mode: ${m.mode}`);
    }
    if (
      action === "USER_ROLE_CHANGED" &&
      (m.previousRole != null || m.role != null)
    ) {
      const from = String(m.previousRole ?? "?");
      const to = String(m.role ?? "?");
      parts.push(`${from.replace(/_/g, " ")} → ${to.replace(/_/g, " ")}`);
      if (m.name) parts.push(String(m.name));
      if (m.email) parts.push(String(m.email));
      else if (m.phone) parts.push(String(m.phone));
    }
    if (
      (action === "CUSTOMER_DELETED" ||
        action === "CUSTOMER_DISABLED" ||
        action === "STAFF_DELETED" ||
        action === "STAFF_DISABLED") &&
      (m.email || m.phone || m.name)
    ) {
      if (m.name) parts.push(String(m.name));
      if (m.email) parts.push(String(m.email));
      else if (m.phone) parts.push(String(m.phone));
      if (m.reason) parts.push(String(m.reason));
    }
    if (m.note && typeof m.note === "string") parts.push(m.note);
    if (m.levels && Array.isArray(m.levels)) {
      parts.push(`Levels: ${m.levels.join(", ")}`);
    }
    if (action === "CREDIT_TERMS_UPDATED" && opts.canSeeCreditAmounts) {
      const before = m.before as { creditLimit?: number; paymentTermsDays?: number } | undefined;
      const after = m.after as { creditLimit?: number; paymentTermsDays?: number } | undefined;
      if (before || after) {
        parts.push(
          `Limit $${Number(before?.creditLimit ?? 0).toFixed(0)} → $${Number(after?.creditLimit ?? 0).toFixed(0)}`,
        );
        parts.push(
          `Terms ${Number(before?.paymentTermsDays ?? 0)}d → ${Number(after?.paymentTermsDays ?? 0)}d`,
        );
      }
    }
    if (action === "CREDIT_PAYMENT" && opts.canSeeCreditAmounts && m.amount != null) {
      parts.push(`Amount $${Number(m.amount).toFixed(2)}`);
    }
    if (parts.length) return parts.join(" · ");
    // Fallback: compact JSON without dumping huge blobs
    const keys = Object.keys(m).slice(0, 6);
    return keys.map((k) => `${k}: ${String(m[k])}`).join(" · ");
  } catch {
    return meta.length > 200 ? `${meta.slice(0, 200)}…` : meta;
  }
}

export function hrefForActivity(
  entity: string | null,
  entityId: string | null,
  action?: string,
  meta?: string | null,
): string | null {
  if (!entity || !entityId) return null;
  if (entity === "Order") {
    if (
      action === "TRACKING_UPLOADED" ||
      action === "TRACKING_SYNC" ||
      action === "SHIPMENT_PACKING_CREATED" ||
      action === "SHIPMENT_PACKING_UPDATED"
    ) {
      return `/admin/logistics/orders/${entityId}`;
    }
    return `/admin/orders`;
  }
  if (entity === "Company") return `/admin/distributors`;
  if (entity === "Product") return `/admin/catalog`;
  if (entity === "Rma" || entity === "RMA") return `/admin/rma`;
  if (entity === "Supplier") return `/admin/suppliers`;
  if (entity === "Database") return `/admin/system`;
  if (entity === "User") {
    if (action === "CUSTOMER_DELETED" || action === "CUSTOMER_DISABLED") {
      return "/admin/users";
    }
    const m = parseActivityMeta(meta ?? null);
    if (m.role === "CUSTOMER" || m.previousRole === "CUSTOMER") {
      // Promote lands on Staff; demote / customer-side changes → Users
      if (m.role && m.role !== "CUSTOMER") return "/admin/staff";
      return "/admin/users";
    }
    return "/admin/staff";
  }
  return null;
}

export function parseActivityMeta(meta: string | null): Record<string, unknown> {
  if (!meta) return {};
  try {
    return JSON.parse(meta) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Compact target label for table column (order #, company, etc.) */
export function activityTargetLabel(
  entity: string | null,
  entityId: string | null,
  meta: string | null,
): string {
  const m = parseActivityMeta(meta);
  if (typeof m.orderNumber === "string" && m.orderNumber) return m.orderNumber;
  if (typeof m.companyName === "string" && m.companyName) return m.companyName;
  if (typeof m.name === "string" && m.name) return m.name;
  if (typeof m.email === "string" && m.email) return m.email;
  if (typeof m.phone === "string" && m.phone) return m.phone;
  if (entity && entityId) return `${entity} · ${entityId.slice(0, 8)}…`;
  if (entity) return entity;
  return "—";
}
