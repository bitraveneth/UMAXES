/**
 * Clear transactional / showcase data for a clean reseed.
 * Keeps catalog intact: products, images, prices, inventory, options, coupons,
 * warehouses, brand assets, and staff/buyer user rows (seed scripts upsert those).
 *
 * Run: npm run db:reset-ops
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Child → parent order matters where onDelete is Restrict
  const rma = await prisma.rmaItem.deleteMany({});
  const rmas = await prisma.rma.deleteMany({});
  const shipLines = await prisma.shipmentLine.deleteMany({});
  const ships = await prisma.shipment.deleteMany({});
  const payments = await prisma.payment.deleteMany({});
  const credit = await prisma.creditLedger.deleteMany({});
  const items = await prisma.orderItem.deleteMany({});
  const orders = await prisma.order.deleteMany({});
  const favorites = await prisma.favorite.deleteMany({});
  const notes = await prisma.notification.deleteMany({});
  const audit = await prisma.auditLog.deleteMany({});

  console.log("Ops data cleared (catalog / products / images kept):");
  console.log({
    rmaItems: rma.count,
    rmas: rmas.count,
    shipmentLines: shipLines.count,
    shipments: ships.count,
    payments: payments.count,
    creditLedger: credit.count,
    orderItems: items.count,
    orders: orders.count,
    favorites: favorites.count,
    notifications: notes.count,
    auditLogs: audit.count,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
