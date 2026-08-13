/**
 * Super-admin database tools: export / import / reset.
 * JSON backups (works on Vercel — no pg_dump). Products untouched unless scope includes catalog/full.
 */
import { prisma } from "@/lib/db";

export const BACKUP_VERSION = 1 as const;

export type BackupScope = "ops" | "catalog" | "accounts" | "full";

export type DbBackup = {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  scope: BackupScope;
  counts: Record<string, number>;
  data: Record<string, unknown[]>;
};

function serializeRows<T extends Record<string, unknown>>(rows: T[]) {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v instanceof Date) out[k] = v.toISOString();
      else out[k] = v;
    }
    return out;
  });
}

async function countSafe(label: string, fn: () => Promise<number>) {
  try {
    return { [label]: await fn() };
  } catch {
    return { [label]: -1 };
  }
}

/** Live table counts for the System dashboard */
export async function getDatabaseStats() {
  const parts = await Promise.all([
    countSafe("products", () => prisma.product.count()),
    countSafe("companies", () => prisma.company.count()),
    countSafe("users", () => prisma.user.count()),
    countSafe("orders", () => prisma.order.count()),
    countSafe("shipments", () => prisma.shipment.count()),
    countSafe("suppliers", () => prisma.supplier.count()),
    countSafe("creditLedger", () => prisma.creditLedger.count()),
    countSafe("rmas", () => prisma.rma.count()),
    countSafe("notifications", () => prisma.notification.count()),
    countSafe("auditLogs", () => prisma.auditLog.count()),
    countSafe("coupons", () => prisma.coupon.count()),
    countSafe("warehouses", () => prisma.warehouse.count()),
  ]);
  return Object.assign({}, ...parts) as Record<string, number>;
}

/** Clear orders / shipping / credit / RMA / notifications / audit — keep catalog + accounts */
export async function resetOpsData() {
  const rmaItems = await prisma.rmaItem.deleteMany({});
  const rmas = await prisma.rma.deleteMany({});
  const shipmentLines = await prisma.shipmentLine.deleteMany({});
  const shipments = await prisma.shipment.deleteMany({});
  const payments = await prisma.payment.deleteMany({});
  const credit = await prisma.creditLedger.deleteMany({});
  const items = await prisma.orderItem.deleteMany({});
  const orders = await prisma.order.deleteMany({});
  const favorites = await prisma.favorite.deleteMany({});
  const notes = await prisma.notification.deleteMany({});
  const audit = await prisma.auditLog.deleteMany({});

  return {
    rmaItems: rmaItems.count,
    rmas: rmas.count,
    shipmentLines: shipmentLines.count,
    shipments: shipments.count,
    payments: payments.count,
    creditLedger: credit.count,
    orderItems: items.count,
    orders: orders.count,
    favorites: favorites.count,
    notifications: notes.count,
    auditLogs: audit.count,
  };
}

/**
 * Wipe transactional + buyer companies/users.
 * Keeps: products/catalog, warehouses, brand assets, coupons, suppliers,
 * and all SUPER_ADMIN / ADMIN / staff users.
 */
export async function resetAccountsKeepStaffAndCatalog() {
  const ops = await resetOpsData();

  await prisma.address.deleteMany({});
  await prisma.staffProfile.deleteMany({
    where: { user: { role: "CUSTOMER" } },
  });
  await prisma.favorite.deleteMany({});
  await prisma.user.deleteMany({ where: { role: "CUSTOMER" } });
  await prisma.company.deleteMany({});

  return { ...ops, companiesCleared: true, customersCleared: true };
}

export async function exportBackup(scope: BackupScope): Promise<DbBackup> {
  const data: Record<string, unknown[]> = {};

  const includeOps = scope === "ops" || scope === "full";
  const includeCatalog = scope === "catalog" || scope === "full";
  const includeAccounts = scope === "accounts" || scope === "full";

  if (includeAccounts || includeOps) {
    // Suppliers used by companies/orders
    data.suppliers = serializeRows(await prisma.supplier.findMany());
  }

  if (includeAccounts) {
    data.companies = serializeRows(await prisma.company.findMany());
    data.users = serializeRows(await prisma.user.findMany());
    data.staffProfiles = serializeRows(await prisma.staffProfile.findMany());
    data.addresses = serializeRows(await prisma.address.findMany());
  }

  if (includeCatalog) {
    data.warehouses = serializeRows(await prisma.warehouse.findMany());
    data.products = serializeRows(await prisma.product.findMany());
    data.productOptions = serializeRows(await prisma.productOption.findMany());
    data.prices = serializeRows(await prisma.priceByLevel.findMany());
    data.inventory = serializeRows(await prisma.inventory.findMany());
    data.warehouseStocks = serializeRows(await prisma.warehouseStock.findMany());
    data.coupons = serializeRows(await prisma.coupon.findMany());
    data.brandAssets = serializeRows(await prisma.brandAsset.findMany());
  }

  if (includeOps) {
    if (!data.suppliers) {
      data.suppliers = serializeRows(await prisma.supplier.findMany());
    }
    // Need company/user ids for orders — include slim accounts if ops-only
    if (!includeAccounts) {
      data.companies = serializeRows(await prisma.company.findMany());
      data.users = serializeRows(
        await prisma.user.findMany({
          where: {
            OR: [
              { role: "CUSTOMER" },
              { orders: { some: {} } },
              { ordersPlacedOnBehalf: { some: {} } },
            ],
          },
        }),
      );
      data.addresses = serializeRows(await prisma.address.findMany());
    }

    data.orders = serializeRows(await prisma.order.findMany());
    data.orderItems = serializeRows(await prisma.orderItem.findMany());
    data.payments = serializeRows(await prisma.payment.findMany());
    data.shipments = serializeRows(await prisma.shipment.findMany());
    data.shipmentLines = serializeRows(await prisma.shipmentLine.findMany());
    data.creditLedger = serializeRows(await prisma.creditLedger.findMany());
    data.rmas = serializeRows(await prisma.rma.findMany());
    data.rmaItems = serializeRows(await prisma.rmaItem.findMany());
    data.favorites = serializeRows(await prisma.favorite.findMany());
    data.notifications = serializeRows(await prisma.notification.findMany());
    data.auditLogs = serializeRows(await prisma.auditLog.findMany());
  }

  const counts: Record<string, number> = {};
  for (const [k, rows] of Object.entries(data)) {
    counts[k] = rows.length;
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    scope,
    counts,
    data,
  };
}

type Row = Record<string, unknown>;

async function createMany(table: string, rows: Row[]) {
  if (!rows.length) return 0;
  const client = prisma as unknown as Record<
    string,
    { createMany: (args: { data: Row[]; skipDuplicates?: boolean }) => Promise<{ count: number }> }
  >;
  const model = client[table];
  if (!model?.createMany) {
    throw new Error(`Unknown table for import: ${table}`);
  }
  const result = await model.createMany({ data: rows, skipDuplicates: true });
  return result.count;
}

/**
 * Import a backup. For ops/full, clears matching data first (never deletes SUPER_ADMIN users).
 * Catalog import upserts by id via delete+create for included product trees when scope is catalog/full.
 */
export async function importBackup(backup: DbBackup, opts: { replace: boolean }) {
  if (backup.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${backup.version}`);
  }

  const scope = backup.scope;
  const data = backup.data || {};
  const imported: Record<string, number> = {};

  if (opts.replace) {
    if (scope === "ops" || scope === "full") {
      await resetOpsData();
    }
    if (scope === "catalog" || scope === "full") {
      await prisma.warehouseStock.deleteMany({});
      await prisma.inventory.deleteMany({});
      await prisma.productOption.deleteMany({});
      await prisma.priceByLevel.deleteMany({});
      await prisma.favorite.deleteMany({});
      // Detach order items from products before delete
      await prisma.orderItem.updateMany({ data: { productId: null } });
      await prisma.product.deleteMany({});
      await prisma.coupon.deleteMany({});
      await prisma.brandAsset.deleteMany({});
      // Keep warehouses structure — recreate from backup
      await prisma.warehouse.deleteMany({});
    }
    if (scope === "accounts" || scope === "full") {
      // Companies cannot be deleted while orders exist
      if (scope === "accounts") {
        await resetOpsData();
      }
      await prisma.address.deleteMany({});
      await prisma.staffProfile.deleteMany({});
      await prisma.user.deleteMany({
        where: { role: { not: "SUPER_ADMIN" } },
      });
      await prisma.company.deleteMany({});
      // Keep suppliers unless full — recreate from file
      if (scope === "full" || data.suppliers) {
        await prisma.order.updateMany({ data: { supplierId: null } });
        await prisma.company.updateMany({ data: { defaultSupplierId: null } });
        await prisma.product.updateMany({ data: { defaultSupplierId: null } });
        await prisma.supplier.deleteMany({});
      }
    }
  }

  // Insert order: parents → children
  const order: string[] = [
    "suppliers",
    "warehouses",
    "products",
    "productOptions",
    "prices",
    "inventory",
    "warehouseStocks",
    "coupons",
    "brandAssets",
    "companies",
    "users",
    "staffProfiles",
    "addresses",
    "orders",
    "orderItems",
    "payments",
    "shipments",
    "shipmentLines",
    "creditLedger",
    "rmas",
    "rmaItems",
    "favorites",
    "notifications",
    "auditLogs",
  ];

  const modelKey: Record<string, string> = {
    suppliers: "supplier",
    warehouses: "warehouse",
    products: "product",
    productOptions: "productOption",
    prices: "priceByLevel",
    inventory: "inventory",
    warehouseStocks: "warehouseStock",
    coupons: "coupon",
    brandAssets: "brandAsset",
    companies: "company",
    users: "user",
    staffProfiles: "staffProfile",
    addresses: "address",
    orders: "order",
    orderItems: "orderItem",
    payments: "payment",
    shipments: "shipment",
    shipmentLines: "shipmentLine",
    creditLedger: "creditLedger",
    rmas: "rma",
    rmaItems: "rmaItem",
    favorites: "favorite",
    notifications: "notification",
    auditLogs: "auditLog",
  };

  for (const key of order) {
    const rows = (data[key] as Row[] | undefined) || [];
    if (!rows.length) continue;
    const mk = modelKey[key];

    if (key === "companies") {
      // Users may not exist yet — clear self-referential FKs, restore after users
      const stripped = rows.map((r) => ({
        ...r,
        salesRepId: null,
        defaultSupplierId: r.defaultSupplierId ?? null,
      }));
      // defaultSupplierId ok if suppliers already inserted
      imported[key] = await createMany(mk, stripped);
      continue;
    }

    if (key === "users") {
      imported[key] = await createMany(mk, rows);
      // Restore company salesRep links from original backup rows
      const companies = (data.companies as Row[] | undefined) || [];
      for (const c of companies) {
        if (!c.id) continue;
        await prisma.company.update({
          where: { id: String(c.id) },
          data: {
            salesRepId: c.salesRepId ? String(c.salesRepId) : null,
            defaultSupplierId: c.defaultSupplierId
              ? String(c.defaultSupplierId)
              : null,
          },
        });
      }
      continue;
    }

    imported[key] = await createMany(mk, rows);
  }

  return imported;
}
