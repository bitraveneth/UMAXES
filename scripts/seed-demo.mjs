/**
 * Showcase seed — companies, buyers, orders (all statuses),
 * shipments, credit ledger, RMA, pending approval.
 * Uses production-style order numbers: UMX-YYYYMMDD-####
 * Does not modify product catalog / images.
 *
 * Run after catalog + staff exist: npm run db:seed-demo
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BUYER_PW = "Demo1234!";
const addressSnap = JSON.stringify({
  line1: "1200 Commerce Ave",
  line2: "Suite 400",
  city: "Los Angeles",
  region: "CA",
  postalCode: "90015",
  country: "US",
});

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Match src/lib/catalog.ts nextOrderNumber / nextPiNumber shape */
function orderNumberFor(days, seq) {
  const d = daysAgo(days);
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `UMX-${stamp}-${1000 + seq}`;
}

function piNumberFor(orderNumber) {
  return `PI-${orderNumber.replace("UMX-", "")}`;
}

async function upsertCompany(data) {
  const existing = await prisma.company.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.company.update({ where: { id: existing.id }, data });
  }
  return prisma.company.create({ data });
}

async function upsertBuyer({ email, name, companyId, passwordHash, companyRole = "OWNER" }) {
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      passwordHash,
      role: "CUSTOMER",
      companyRole,
      status: "APPROVED",
      companyId,
    },
    update: {
      name,
      passwordHash,
      role: "CUSTOMER",
      companyRole,
      status: "APPROVED",
      companyId,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(BUYER_PW, 12);

  const products = await prisma.product.findMany({
    include: { prices: true },
    where: { active: true },
    take: 6,
    orderBy: { name: "asc" },
  });

  if (products.length === 0) {
    throw new Error("No products found. Run: npm run db:seed-catalog");
  }

  const missingImage = products.filter((p) => !p.image);
  if (missingImage.length) {
    console.warn(
      "Warning: products without image:",
      missingImage.map((p) => p.sku).join(", "),
    );
  }

  const sales = await prisma.user.findFirst({
    where: { email: "sales@umaxes.com" },
  });

  // --- Companies ---
  const shop = await upsertCompany({
    name: "Coastal Retail Shop",
    status: "APPROVED",
    level: "SHOP",
    creditLimit: 0,
    creditUsed: 0,
    paymentTermsDays: 0,
    salesRepId: sales?.id || null,
    commissionRate: 5,
  });

  const wholesaler = await upsertCompany({
    name: "Pacific Distro Partners",
    status: "APPROVED",
    level: "WHOLESALER",
    creditLimit: 8000,
    creditUsed: 1200,
    paymentTermsDays: 15,
    salesRepId: sales?.id || null,
    commissionRate: 4,
  });

  const distro = await upsertCompany({
    name: "National Hookamax Distro",
    status: "APPROVED",
    level: "DISTRO",
    creditLimit: 20000,
    creditUsed: 3500,
    paymentTermsDays: 30,
    salesRepId: sales?.id || null,
    commissionRate: 3,
  });

  const pendingCo = await upsertCompany({
    name: "Pending Smoke Shop LLC",
    status: "PENDING",
    level: "SHOP",
    creditLimit: 0,
    creditUsed: 0,
    paymentTermsDays: 0,
  });

  // Rename legacy company if present
  const legacyShop = await prisma.company.findFirst({
    where: { name: "Demo Retail Shop" },
  });
  if (legacyShop && legacyShop.id !== shop.id) {
    await prisma.company.update({
      where: { id: legacyShop.id },
      data: { name: "Coastal Retail Shop (archived)" },
    });
  }

  // --- Buyers ---
  const buyer = await upsertBuyer({
    email: "retail@demo.umaxes.com",
    name: "Retail Buyer",
    companyId: shop.id,
    passwordHash,
  });

  await upsertBuyer({
    email: "demo@umaxes.com",
    name: "Retail Buyer (legacy)",
    companyId: shop.id,
    passwordHash,
  });

  const buyer2 = await upsertBuyer({
    email: "wholesale@demo.umaxes.com",
    name: "Pacific Buyer",
    companyId: wholesaler.id,
    passwordHash,
  });

  const buyer3 = await upsertBuyer({
    email: "distro@demo.umaxes.com",
    name: "Distro Buyer",
    companyId: distro.id,
    passwordHash,
  });

  await prisma.user.upsert({
    where: { email: "pending@demo.umaxes.com" },
    create: {
      email: "pending@demo.umaxes.com",
      name: "Awaiting Approval",
      passwordHash,
      role: "CUSTOMER",
      companyRole: "OWNER",
      status: "PENDING",
      companyId: pendingCo.id,
    },
    update: {
      passwordHash,
      status: "PENDING",
      companyId: pendingCo.id,
      name: "Awaiting Approval",
    },
  });

  const addrCount = await prisma.address.count({ where: { companyId: shop.id } });
  if (addrCount === 0) {
    await prisma.address.create({
      data: {
        companyId: shop.id,
        label: "HQ",
        line1: "1200 Commerce Ave",
        line2: "Suite 400",
        city: "Los Angeles",
        region: "CA",
        postalCode: "90015",
        country: "US",
        isDefault: true,
      },
    });
  }

  // Clear prior showcase orders for these buyer companies (any number format)
  const companyIds = [shop.id, wholesaler.id, distro.id];
  const old = await prisma.order.findMany({
    where: { companyId: { in: companyIds } },
    select: { id: true },
  });
  if (old.length) {
    const ids = old.map((o) => o.id);
    await prisma.rmaItem.deleteMany({
      where: { rma: { orderId: { in: ids } } },
    });
    await prisma.rma.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.shipmentLine.deleteMany({
      where: { shipment: { orderId: { in: ids } } },
    });
    await prisma.shipment.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.creditLedger.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
  }

  // Also drop leftover DEMO-* rows from older seeds
  const demoLegacy = await prisma.order.findMany({
    where: { orderNumber: { startsWith: "DEMO-" } },
    select: { id: true },
  });
  if (demoLegacy.length) {
    const ids = demoLegacy.map((o) => o.id);
    await prisma.rmaItem.deleteMany({
      where: { rma: { orderId: { in: ids } } },
    });
    await prisma.rma.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.shipment.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.creditLedger.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
  }

  function lineItems(level, qtyScale = 1, productCount = 3) {
    return products.slice(0, productCount).map((p) => {
      const price =
        p.prices.find((x) => x.level === level)?.unitPrice ??
        p.prices[0]?.unitPrice ??
        25;
      const qty = Math.max(
        5,
        Math.round((p.prices.find((x) => x.level === level)?.moq || 5) * qtyScale),
      );
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity: qty,
        unitPrice: price,
        image: p.image,
      };
    });
  }

  function totals(items) {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: 0,
      discount: 0,
      total: Math.round(subtotal * 100) / 100,
    };
  }

  const scenarios = [
    // Retail — mix so Orders + Tracking both look populated
    {
      seq: 1,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "PAYMENT_PENDING",
      paymentMethod: "TT",
      level: "SHOP",
      days: 2,
      paymentRef: null,
    },
    {
      seq: 2,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "CONFIRMED",
      paymentMethod: "CHECK",
      level: "SHOP",
      days: 5,
      paymentRef: "CHK-88421",
      qtyScale: 1.2,
    },
    {
      seq: 3,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "SHIPPED",
      paymentMethod: "TT",
      level: "SHOP",
      days: 9,
      paymentRef: "TT-RETAIL-441",
      shipment: { carrier: "UPS", trackingNumber: "1Z999AA10123456001" },
      qtyScale: 1.1,
    },
    {
      seq: 4,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "COMPLETED",
      paymentMethod: "ONLINE",
      level: "SHOP",
      days: 22,
      paymentRef: "ONLINE-7721",
      shipment: { carrier: "USPS", trackingNumber: "9400111899223344556677" },
      qtyScale: 1,
    },
    {
      seq: 5,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "SUBMITTED",
      paymentMethod: "ONLINE",
      level: "SHOP",
      days: 1,
      paymentRef: null,
    },
    // Wholesale
    {
      seq: 6,
      userId: buyer2.id,
      companyId: wholesaler.id,
      email: "wholesale@demo.umaxes.com",
      status: "SENT_TO_SUPPLIER",
      paymentMethod: "CREDIT",
      level: "WHOLESALER",
      days: 8,
      paymentRef: "CREDIT-TERMS",
      qtyScale: 1.5,
    },
    {
      seq: 7,
      userId: buyer2.id,
      companyId: wholesaler.id,
      email: "wholesale@demo.umaxes.com",
      status: "SHIPPED",
      paymentMethod: "TT",
      level: "WHOLESALER",
      days: 14,
      paymentRef: "TT-WIRE-991",
      shipment: { carrier: "UPS", trackingNumber: "1Z999AA10123456784" },
      qtyScale: 2,
    },
    // Distro
    {
      seq: 8,
      userId: buyer3.id,
      companyId: distro.id,
      email: "distro@demo.umaxes.com",
      status: "COMPLETED",
      paymentMethod: "TT",
      level: "DISTRO",
      days: 28,
      paymentRef: "TT-DONE-220",
      shipment: { carrier: "FedEx", trackingNumber: "794612345678" },
      qtyScale: 2.5,
      rma: true,
    },
    {
      seq: 9,
      userId: buyer3.id,
      companyId: distro.id,
      email: "distro@demo.umaxes.com",
      status: "COMPLETED",
      paymentMethod: "CREDIT",
      level: "DISTRO",
      days: 45,
      paymentRef: "CREDIT-PAID",
      shipment: { carrier: "DHL", trackingNumber: "JD014600003" },
      qtyScale: 1.8,
      creditCharge: true,
    },
  ];

  let rmaSourceOrder = null;

  for (const s of scenarios) {
    const items = lineItems(s.level, s.qtyScale || 1);
    const money = totals(items);
    const createdAt = daysAgo(s.days);
    const orderNumber = orderNumberFor(s.days, s.seq);
    const piNumber = piNumberFor(orderNumber);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        piNumber,
        userId: s.userId,
        companyId: s.companyId,
        status: s.status,
        paymentMethod: s.paymentMethod,
        email: s.email,
        addressSnap,
        ...money,
        paymentRef: s.paymentRef,
        notes: null,
        createdAt,
        updatedAt: createdAt,
        items: { create: items },
        payments: s.paymentRef
          ? {
              create: {
                method: s.paymentMethod,
                amount: money.total,
                reference: s.paymentRef,
                status: "received",
                paidAt: createdAt,
              },
            }
          : undefined,
        shipments: s.shipment
          ? {
              create: {
                carrier: s.shipment.carrier,
                trackingNumber: s.shipment.trackingNumber,
                status: s.status === "COMPLETED" ? "delivered" : "in_transit",
                shippedAt: daysAgo(Math.max(0, s.days - 2)),
                deliveredAt:
                  s.status === "COMPLETED" ? daysAgo(Math.max(0, s.days - 5)) : null,
              },
            }
          : undefined,
      },
    });

    if (s.creditCharge || s.paymentMethod === "CREDIT") {
      await prisma.creditLedger.create({
        data: {
          companyId: s.companyId,
          orderId: order.id,
          type: "charge",
          amount: money.total,
          dueDate: daysAgo(Math.max(0, s.days - 15)),
          note: `Credit charge ${orderNumber}`,
          createdAt,
        },
      });
    }

    if (s.rma) {
      rmaSourceOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
    }
  }

  await prisma.creditLedger.create({
    data: {
      companyId: distro.id,
      type: "payment",
      amount: -500,
      note: "Partial credit payment",
      createdAt: daysAgo(10),
    },
  });

  if (rmaSourceOrder?.items?.[0]) {
    const item = rmaSourceOrder.items[0];
    const rmaStamp = orderNumberFor(28, 8).replace("UMX-", "RMA-");
    await prisma.rma.create({
      data: {
        rmaNumber: rmaStamp,
        orderId: rmaSourceOrder.id,
        companyId: rmaSourceOrder.companyId,
        userId: rmaSourceOrder.userId,
        reason: "Damaged outer carton on arrival",
        status: "REQUESTED",
        items: {
          create: [
            {
              sku: item.sku,
              name: item.name,
              quantity: Math.min(2, item.quantity),
              image: item.image,
            },
          ],
        },
      },
    });
  }

  console.log("\n=== UMAXES showcase seed ready ===\n");
  console.log("Catalog products/images untouched.");
  console.log("Order IDs use UMX-YYYYMMDD-#### (same shape as live checkout).");
  console.log("\nLogin strip:");
  console.log("  1 Super admin  super@umaxes.com / Super1234!");
  console.log("  2 Admin        admin@umaxes.com / Admin1234!");
  console.log("  3 Wholesaler   wholesale@demo.umaxes.com / Demo1234!");
  console.log("  4 Distributor  distro@demo.umaxes.com / Demo1234!");
  console.log("  5 Sales        sales@umaxes.com / Staff1234!");
  console.log("  6 Logistics    logistics@umaxes.com / Staff1234!");
  console.log("  7 Retail       retail@demo.umaxes.com / Demo1234!");
  console.log("\nOpen /admin → Orders · /account → Orders & Tracking\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
