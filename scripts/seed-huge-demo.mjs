/**
 * Huge demo volume add-on (Vercel / demo DB only — never production).
 * Run AFTER: db:reseed (or seed-demo)
 *
 *   npm run db:seed-huge-demo
 *
 * Adds: ~100 orders, max stock, high credit limits, many pending approvals.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ORDER_COUNT = 100;
const STOCK_QTY = 999_999;
const BUYER_PW = "Demo1234!";
const PCS_PER_CASE = 95;
const BULK_PREFIX = "UMX-HG";

const STATUSES = [
  "SUBMITTED",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "SENT_TO_SUPPLIER",
  "PICKING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

const PAY_METHODS = ["TT", "CREDIT", "CHECK"];

const EXTRA_PENDING = [
  ["Atlas Cloud Wholesale", "WHOLESALER", "nina@atlascloud.demo", "Nina Park", "+1 206 555 1001"],
  ["Bayfront Distro LLC", "DISTRO", "omar@bayfront.demo", "Omar Hassan", "+1 415 555 1002"],
  ["Cedar Tip Shop", "SHOP", "lee@cedartip.demo", "Lee Wong", "+1 503 555 1003"],
  ["Delta Peak Wholesale", "WHOLESALER", "priya@deltapeak.demo", "Priya Shah", "+1 602 555 1004"],
  ["Echo Harbor Distro", "DISTRO", "chris@echoharbor.demo", "Chris Bell", "+1 713 555 1005"],
  ["Fog City Retail", "SHOP", "amy@fogcity.demo", "Amy Tran", "+1 628 555 1006"],
  ["Granite State Wholesale", "WHOLESALER", "ben@granitewh.demo", "Ben Cole", "+1 603 555 1007"],
  ["Horizon Hook Distro", "DISTRO", "sara@horizonhook.demo", "Sara Kim", "+1 312 555 1008"],
  ["Iron Pier Shop", "SHOP", "jake@ironpier.demo", "Jake Mills", "+1 757 555 1009"],
  ["Juniper Valley WHO", "WHOLESALER", "rita@juniperwh.demo", "Rita Gomez", "+1 916 555 1010"],
  ["Keystone Distro Co", "DISTRO", "tony@keystonedistro.demo", "Tony Russo", "+1 215 555 1011"],
  ["Lumen Smoke Shop", "SHOP", "hana@lumensmoke.demo", "Hana Lee", "+1 720 555 1012"],
  ["Maple Ridge Wholesale", "WHOLESALER", "evan@mapleridge.demo", "Evan Brooks", "+1 802 555 1013"],
  ["Northwind Distro", "DISTRO", "zoe@northwind.demo", "Zoe Carter", "+1 612 555 1014"],
  ["Oak & Ember Shop", "SHOP", "max@oakember.demo", "Max Diaz", "+1 504 555 1015"],
  ["Prairie Cloud WHO", "WHOLESALER", "ivy@prairiecloud.demo", "Ivy Chen", "+1 316 555 1016"],
  ["Quay Side Distro", "DISTRO", "noah@quayside.demo", "Noah Reed", "+1 843 555 1017"],
  ["Redwood Tip Shop", "SHOP", "ella@redwoodtip.demo", "Ella Frost", "+1 707 555 1018"],
  ["Summit Line Wholesale", "WHOLESALER", "kai@summitline.demo", "Kai Patel", "+1 801 555 1019"],
  ["Tidewater Distro", "DISTRO", "mia@tidewater.demo", "Mia Ortiz", "+1 757 555 1020"],
];

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function yymmdd(d) {
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function clearBulkOrders() {
  const old = await prisma.order.findMany({
    where: { orderNumber: { startsWith: BULK_PREFIX } },
    select: { id: true },
  });
  if (!old.length) return 0;
  const ids = old.map((o) => o.id);
  await prisma.rmaItem.deleteMany({ where: { rma: { orderId: { in: ids } } } });
  await prisma.rma.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.shipmentLine.deleteMany({
    where: { shipment: { orderId: { in: ids } } },
  });
  await prisma.shipment.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.creditLedger.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.rebateLedger.deleteMany({ where: { orderId: { in: ids } } }).catch(() => {});
  await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.order.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
}

async function seedHugeStock() {
  const products = await prisma.product.findMany({ select: { id: true } });
  for (const p of products) {
    await prisma.inventory.upsert({
      where: { productId: p.id },
      create: { productId: p.id, quantity: STOCK_QTY, reserved: 0 },
      update: { quantity: STOCK_QTY, reserved: 0 },
    });
  }
  const wh = await prisma.warehouseStock.updateMany({
    data: { quantity: STOCK_QTY },
  });
  return { products: products.length, warehouseRows: wh.count };
}

async function boostCredit() {
  const limits = { DISTRO: 100000, WHOLESALER: 50000, SHOP: 10000 };
  const companies = await prisma.company.findMany({
    where: { status: "APPROVED" },
  });
  for (const c of companies) {
    const limit = limits[c.level] ?? 25000;
    await prisma.company.update({
      where: { id: c.id },
      data: {
        creditLimit: limit,
        creditUsed: Math.min(c.creditUsed || 0, Math.round(limit * 0.35)),
        paymentTermsDays: c.level === "DISTRO" ? 30 : c.level === "WHOLESALER" ? 15 : 0,
      },
    });
  }
  return companies.length;
}

async function seedPendingMany(passwordHash) {
  let n = 0;
  for (let i = 0; i < EXTRA_PENDING.length; i++) {
    const [company, level, email, name, phone] = EXTRA_PENDING[i];
    let co = await prisma.company.findFirst({ where: { name: company } });
    if (!co) {
      co = await prisma.company.create({
        data: {
          name: company,
          status: "PENDING",
          level,
          creditLimit: 0,
          creditUsed: 0,
          paymentTermsDays: 0,
        },
      });
    } else {
      co = await prisma.company.update({
        where: { id: co.id },
        data: { status: "PENDING", level, creditLimit: 0, creditUsed: 0 },
      });
    }

    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        phone,
        passwordHash,
        role: "CUSTOMER",
        companyRole: "OWNER",
        status: "PENDING",
        companyId: co.id,
      },
      update: {
        name,
        phone,
        passwordHash,
        status: "PENDING",
        companyId: co.id,
        role: "CUSTOMER",
        companyRole: "OWNER",
      },
    });

    const hasAddr = await prisma.address.findFirst({ where: { companyId: co.id } });
    if (!hasAddr) {
      await prisma.address.create({
        data: {
          companyId: co.id,
          label: "HQ",
          isDefault: true,
          recipientName: name,
          phone,
          line1: `${100 + i} Demo Ave`,
          city: "Los Angeles",
          region: "CA",
          postalCode: "90012",
          country: "US",
        },
      });
    }
    n += 1;
  }
  return n;
}

async function main() {
  const buyers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "retail@demo.umaxes.com",
          "wholesale@demo.umaxes.com",
          "distro@demo.umaxes.com",
          "metro@demo.umaxes.com",
        ],
      },
      status: "APPROVED",
    },
    include: { company: true },
  });

  if (buyers.length < 2) {
    throw new Error("Demo buyers missing. Run npm run db:reseed first (demo DB only).");
  }

  const products = await prisma.product.findMany({
    where: { active: true },
    include: { prices: true },
    orderBy: { name: "asc" },
  });
  if (!products.length) {
    throw new Error("No products. Run npm run db:seed-catalog first.");
  }

  const supplier = await prisma.supplier.findFirst({ where: { active: true } });
  const sales = await prisma.user.findFirst({ where: { email: "sales@umaxes.com" } });

  const cleared = await clearBulkOrders();
  const stock = await seedHugeStock();
  const creditCompanies = await boostCredit();
  const passwordHash = await bcrypt.hash(BUYER_PW, 12);
  const pendingN = await seedPendingMany(passwordHash);

  // Refresh buyers after credit boost
  const pool = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "retail@demo.umaxes.com",
          "wholesale@demo.umaxes.com",
          "distro@demo.umaxes.com",
          "metro@demo.umaxes.com",
        ],
      },
    },
    include: { company: true },
  });

  let created = 0;
  let shipments = 0;
  let creditRows = 0;

  for (let i = 1; i <= ORDER_COUNT; i++) {
    const buyer = pool[i % pool.length];
    const level = buyer.company?.level || "SHOP";
    const status = STATUSES[i % STATUSES.length];
    const paymentMethod = PAY_METHODS[i % PAY_METHODS.length];
    const days = 1 + (i % 90);
    const createdAt = daysAgo(days);
    const stamp = yymmdd(createdAt);
    const orderNumber = `${BULK_PREFIX}${stamp}-${String(i).padStart(3, "0")}`;
    const piNumber = `HG${stamp}${String(i).padStart(3, "0")}`;

    const productCount = 2 + (i % 5);
    const offset = i % Math.max(1, products.length - productCount);
    const slice = products.slice(offset, offset + productCount);
    const items = (slice.length ? slice : products.slice(0, 3)).map((p) => {
      const tier = p.prices.find((x) => x.level === level);
      const unitPrice = tier?.unitPrice ?? p.prices[0]?.unitPrice ?? 25;
      const moq = tier?.moq || PCS_PER_CASE;
      const quantity = Math.max(PCS_PER_CASE, Math.round(moq * (1 + (i % 5) * 0.4)));
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity,
        unitPrice,
        image: p.image,
      };
    });

    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const shipping = i % 4 === 0 ? 85 : 0;
    const discount = i % 7 === 0 ? 50 : 0;
    const total = Math.round((subtotal + shipping - discount) * 100) / 100;
    const sellingQty = items.reduce((s, it) => s + it.quantity, 0);

    const addressSnap = JSON.stringify({
      recipientName: buyer.name || "Demo Buyer",
      phone: buyer.phone || "+1 555 0100",
      line1: "100 Demo Blvd",
      city: "Los Angeles",
      region: "CA",
      postalCode: "90015",
      country: "US",
    });

    const advanced = ["SENT_TO_SUPPLIER", "PICKING", "SHIPPED", "COMPLETED"].includes(status);
    const payRef =
      status === "PAYMENT_PENDING" || status === "CANCELLED"
        ? null
        : `${paymentMethod}-HG-${i}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        piNumber,
        userId: buyer.id,
        companyId: buyer.companyId,
        placedByStaffId: i % 9 === 0 ? sales?.id || null : null,
        supplierId: advanced ? supplier?.id || null : null,
        status,
        paymentMethod,
        email: buyer.email,
        phone: buyer.phone,
        addressSnap,
        subtotal,
        shipping,
        discount,
        total,
        sellingQty,
        chargedQty: sellingQty,
        paymentRef: payRef,
        notes: `Huge demo bulk #${i}`,
        sentToSupplierAt: advanced ? daysAgo(Math.max(0, days - 1)) : null,
        createdAt,
        updatedAt: createdAt,
        items: { create: items },
        payments: payRef
          ? {
              create: {
                method: paymentMethod,
                amount: total,
                reference: payRef,
                status:
                  status === "PAYMENT_PENDING" || status === "CANCELLED"
                    ? "pending"
                    : paymentMethod === "CREDIT"
                      ? "on_terms"
                      : "received",
                paidAt:
                  status === "PAYMENT_PENDING" || status === "CANCELLED"
                    ? null
                    : createdAt,
              },
            }
          : undefined,
      },
    });
    created += 1;

    if (status === "SHIPPED" || status === "COMPLETED" || status === "PICKING") {
      const delivered = status === "COMPLETED";
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          carrier: ["DHL", "UPS", "FedEx"][i % 3],
          trackingNumber: delivered || status === "SHIPPED" ? `HGTRK${100000 + i}` : null,
          status: delivered ? "delivered" : status === "SHIPPED" ? "in_transit" : "pending",
          shippedAt: status === "SUBMITTED" ? null : daysAgo(Math.max(0, days - 2)),
          deliveredAt: delivered ? daysAgo(Math.max(0, days - 5)) : null,
          boxCount: Math.max(1, Math.round(sellingQty / PCS_PER_CASE)),
          cbm: 0.4 + (i % 10) * 0.15,
          weightKg: 40 + (i % 20) * 12,
          packingNote: "Huge demo packing",
          packedAt: daysAgo(Math.max(0, days - 3)),
          lines: {
            create: items.map((it) => ({
              sku: it.sku,
              name: it.name,
              quantity: it.quantity,
              flavor: it.name.split("—")[0]?.trim() || it.name,
              size: null,
              boxes: Math.max(1, Math.round(it.quantity / PCS_PER_CASE)),
            })),
          },
        },
      });
      shipments += 1;
    }

    if (paymentMethod === "CREDIT" && status !== "CANCELLED") {
      await prisma.creditLedger.create({
        data: {
          companyId: buyer.companyId,
          orderId: order.id,
          type: "charge",
          amount: total,
          dueDate: daysAgo(Math.max(0, days - 15)),
          note: `Credit charge ${orderNumber}`,
          createdAt,
        },
      });
      creditRows += 1;
    }
  }

  const totalOrders = await prisma.order.count();
  const pendingUsers = await prisma.user.count({
    where: { role: "CUSTOMER", status: "PENDING" },
  });

  console.log("\n=== Huge demo seed ready (demo DB) ===\n");
  console.log({
    clearedBulk: cleared,
    bulkOrdersCreated: created,
    totalOrdersInDb: totalOrders,
    shipments,
    creditLedgerCharges: creditRows,
    stockProducts: stock.products,
    stockQtyEach: STOCK_QTY,
    creditBoostedCompanies: creditCompanies,
    pendingApplicantsUpserted: pendingN,
    pendingCustomerUsers: pendingUsers,
  });
  console.log(`Applicant password: ${BUYER_PW}`);
  console.log("Open demo site → Orders / Credit / Approvals / Inventory\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
