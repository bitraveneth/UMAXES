/**
 * Light add-on seed: creates a few sample orders only.
 * Does NOT wipe existing orders/payments/shipments.
 * Does NOT touch catalog, staff, warehouses, or brand assets.
 *
 * Requires at least one approved customer + active products.
 * Run: npm run db:seed-few-orders
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ADDRESS = {
  recipientName: "Alex Rivera",
  phone: "+1 213 555 0140",
  line1: "1200 Commerce Ave",
  line2: "Suite 400",
  city: "Los Angeles",
  region: "CA",
  postalCode: "90015",
  country: "US",
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function stamp(days) {
  const d = daysAgo(days);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}

async function uniqueOrderNumber(days, seq) {
  let n = seq;
  for (let i = 0; i < 50; i++) {
    const orderNumber = `UMX-${stamp(days)}-${2000 + n}`;
    const exists = await prisma.order.findUnique({ where: { orderNumber } });
    if (!exists) return orderNumber;
    n += 1;
  }
  return `UMX-${stamp(days)}-${2000 + Date.now() % 10000}`;
}

function unitPriceFor(product, level) {
  const row = product.prices?.find((p) => p.level === level);
  if (row) return Number(row.unitPrice);
  return Number(product.prices?.[0]?.unitPrice ?? 25);
}

async function main() {
  const buyer =
    (await prisma.user.findFirst({
      where: {
        role: "CUSTOMER",
        status: "APPROVED",
        companyId: { not: null },
        email: { contains: "demo" },
      },
      include: { company: true },
      orderBy: { createdAt: "asc" },
    })) ||
    (await prisma.user.findFirst({
      where: {
        role: "CUSTOMER",
        status: "APPROVED",
        companyId: { not: null },
      },
      include: { company: true },
      orderBy: { createdAt: "asc" },
    }));

  if (!buyer?.company) {
    throw new Error(
      "No approved customer with a company found. Create a buyer first, or run npm run db:seed-demo once.",
    );
  }

  const level = buyer.company.level || "WHOLESALER";
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { prices: true },
    orderBy: { name: "asc" },
    take: 4,
  });
  if (products.length === 0) {
    throw new Error("No products found. Run: npm run db:seed-catalog");
  }

  const supplier = await prisma.supplier.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  const scenarios = [
    {
      days: 0,
      status: "SUBMITTED",
      paymentMethod: "TT",
      paymentRef: null,
      productCount: 2,
      qty: 95,
    },
    {
      days: 2,
      status: "PAYMENT_PENDING",
      paymentMethod: "TT",
      paymentRef: "TT-SAMPLE-PENDING",
      paymentStatus: "pending",
      productCount: 2,
      qty: 190,
    },
    {
      days: 5,
      status: "SENT_TO_SUPPLIER",
      paymentMethod: "CREDIT",
      paymentRef: "CREDIT-SAMPLE",
      paymentStatus: "received",
      productCount: 3,
      qty: 285,
      withSupplier: true,
    },
    {
      days: 12,
      status: "COMPLETED",
      paymentMethod: "TT",
      paymentRef: "TT-SAMPLE-DONE",
      paymentStatus: "received",
      productCount: 2,
      qty: 190,
      withSupplier: true,
      withShipment: true,
    },
  ];

  const created = [];

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    const picks = products.slice(0, Math.min(s.productCount, products.length));
    const items = picks.map((p) => {
      const unitPrice = unitPriceFor(p, level);
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity: s.qty,
        unitPrice,
        image: p.image || null,
      };
    });
    const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const shipping = 0;
    const discount = 0;
    const total = subtotal + shipping - discount;
    const sellingQty = items.reduce((sum, it) => sum + it.quantity, 0);
    const orderNumber = await uniqueOrderNumber(s.days, i + 1);
    const piNumber = `PI-${orderNumber.replace("UMX-", "")}`;
    const createdAt = daysAgo(s.days);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        piNumber,
        userId: buyer.id,
        companyId: buyer.companyId,
        supplierId: s.withSupplier ? supplier?.id || null : null,
        status: s.status,
        paymentMethod: s.paymentMethod,
        email: buyer.email,
        phone: buyer.phone || ADDRESS.phone,
        addressSnap: JSON.stringify(ADDRESS),
        subtotal,
        shipping,
        discount,
        total,
        sellingQty,
        chargedQty: sellingQty,
        paymentRef: s.paymentRef,
        notes: "Light sample order (seed-few-orders)",
        sentToSupplierAt: s.withSupplier ? daysAgo(Math.max(0, s.days - 1)) : null,
        createdAt,
        updatedAt: createdAt,
        items: { create: items },
        payments: s.paymentRef
          ? {
              create: {
                method: s.paymentMethod,
                amount: total,
                reference: s.paymentRef,
                status: s.paymentStatus || "received",
                paidAt:
                  (s.paymentStatus || "received") === "pending"
                    ? null
                    : createdAt,
              },
            }
          : undefined,
        shipments: s.withShipment
          ? {
              create: {
                carrier: "UPS",
                trackingNumber: `1ZSAMPLE${String(Date.now()).slice(-8)}`,
                status: "delivered",
                shippedAt: daysAgo(Math.max(0, s.days - 3)),
                deliveredAt: daysAgo(Math.max(0, s.days - 6)),
                boxCount: Math.max(1, Math.round(sellingQty / 95)),
                cbm: 1.2,
                weightKg: 140,
                lines: {
                  create: items.map((it) => ({
                    sku: it.sku,
                    name: it.name,
                    quantity: it.quantity,
                    flavor: it.name.split("—")[0]?.trim() || it.name,
                    size: null,
                    boxes: Math.max(1, Math.round(it.quantity / 95)),
                  })),
                },
              },
            }
          : undefined,
      },
    });

    created.push({
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      buyer: buyer.email,
    });
  }

  console.log("\n=== Few sample orders added (nothing wiped) ===\n");
  console.log({ buyer: buyer.email, company: buyer.company.name, created });
  console.log("\nOpen /admin/orders to review.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
