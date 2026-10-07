/**
 * Fresh production wipe — keep catalog + prices, only SUPER_ADMIN + ADMIN.
 *
 * KEEPS
 *   - Products, options, images, Distro / Wholesaler / Shop prices
 *   - Warehouses (structure)
 *   - Brand assets, login slides
 *   - Bank accounts (for PI)
 *   - FAQ, site settings, rebate policy config
 *   - Users with role SUPER_ADMIN or ADMIN
 *
 * CLEARS
 *   - All orders, payments, shipments, RMA, credit, rebate months/ledgers
 *   - All companies / buyers / demo accounts
 *   - Staff who are not SUPER_ADMIN / ADMIN (sales, logistics, etc.)
 *   - Suppliers, coupons
 *   - Stock quantities → 0 (client restocks in Warehouse)
 *   - Notifications, audit, favorites
 *
 * Run on the server after deploy (with DATABASE_URL set):
 *   npm run db:fresh-production
 *
 * Then sign in as:
 *   super@umaxes.com / Super1234!
 *   admin@umaxes.com / Admin1234!
 * Change those passwords immediately.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const KEEP_ROLES = ["SUPER_ADMIN", "ADMIN"];

async function upsertAdmin({ email, name, password, role }) {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      passwordHash,
      role,
      status: "APPROVED",
      companyId: null,
    },
    update: {
      passwordHash,
      role,
      status: "APPROVED",
      name,
      companyId: null,
    },
  });
}

async function main() {
  console.log("=== Fresh production wipe ===\n");
  console.log("Keeping: catalog + prices + SUPER_ADMIN/ADMIN");
  console.log("Clearing: orders, buyers, other staff, stock qty, suppliers…\n");

  // 1) Transactional / ops children first
  const counts = {};
  counts.rmaItems = (await prisma.rmaItem.deleteMany({})).count;
  counts.rmas = (await prisma.rma.deleteMany({})).count;
  counts.shipmentLines = (await prisma.shipmentLine.deleteMany({})).count;
  counts.shipments = (await prisma.shipment.deleteMany({})).count;
  counts.payments = (await prisma.payment.deleteMany({})).count;
  counts.creditLedger = (await prisma.creditLedger.deleteMany({})).count;
  counts.rebateLedgers = (await prisma.rebateLedger.deleteMany({})).count;
  counts.rebateMonths = (await prisma.rebateMonth.deleteMany({})).count;
  counts.orderItems = (await prisma.orderItem.deleteMany({})).count;
  counts.orders = (await prisma.order.deleteMany({})).count;
  counts.favorites = (await prisma.favorite.deleteMany({})).count;
  counts.notifications = (await prisma.notification.deleteMany({})).count;
  counts.auditLogs = (await prisma.auditLog.deleteMany({})).count;

  // 2) Addresses + customer staff profiles
  counts.addresses = (await prisma.address.deleteMany({})).count;
  counts.customerStaffProfiles = (
    await prisma.staffProfile.deleteMany({
      where: { user: { role: "CUSTOMER" } },
    })
  ).count;

  // 3) Detach remaining staff from companies, then remove non-admin users
  await prisma.user.updateMany({
    data: { companyId: null },
  });
  await prisma.company.updateMany({
    data: {
      salesRepId: null,
      defaultSupplierId: null,
      creditUsed: 0,
      creditLimit: 0,
      rebateBalanceUsd: 0,
      firstOrderId: null,
      firstCompletedOrderId: null,
    },
  });

  // Staff profiles cascade when users are deleted
  counts.nonAdminUsers = (
    await prisma.user.deleteMany({
      where: { role: { notIn: KEEP_ROLES } },
    })
  ).count;

  counts.companies = (await prisma.company.deleteMany({})).count;

  // 4) Empty trade partners / promos (catalog prices stay)
  counts.coupons = (await prisma.coupon.deleteMany({})).count;
  await prisma.product.updateMany({ data: { defaultSupplierId: null } });
  counts.suppliers = (await prisma.supplier.deleteMany({})).count;

  // 5) Zero stock — client receives into Warehouse themselves
  counts.inventoryZeroed = (
    await prisma.inventory.updateMany({
      data: { quantity: 0, reserved: 0 },
    })
  ).count;
  counts.warehouseStockZeroed = (
    await prisma.warehouseStock.updateMany({
      data: { quantity: 0, reserved: 0 },
    })
  ).count;

  // 6) Ensure the two admin logins exist
  await upsertAdmin({
    email: "super@umaxes.com",
    name: "UMAXES Super Admin",
    password: "Super1234!",
    role: "SUPER_ADMIN",
  });
  await upsertAdmin({
    email: "admin@umaxes.com",
    name: "UMAXES Admin",
    password: "Admin1234!",
    role: "ADMIN",
  });

  const products = await prisma.product.count();
  const prices = await prisma.priceByLevel.count();
  const admins = await prisma.user.count({
    where: { role: { in: KEEP_ROLES } },
  });

  console.log("Cleared:");
  console.log(counts);
  console.log("\nStill in database:");
  console.log({ products, prices, adminUsers: admins });
  console.log("\nSign in (change passwords right away):");
  console.log("  Super admin  super@umaxes.com / Super1234!");
  console.log("  Admin        admin@umaxes.com / Admin1234!");
  console.log("\nNext: Learning Hub → Fresh start checklist");
  console.log("Done.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
