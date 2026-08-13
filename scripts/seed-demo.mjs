/**
 * Showcase seed — companies, buyers, suppliers, orders (all statuses),
 * sales-placed orders, shipments (+ packing lines), credit ledger, RMA.
 * Uses production-style order numbers: UMX-YYYYMMDD-####
 * Does not modify product catalog / images / prices.
 *
 * Run after catalog + staff exist: npm run db:seed-demo
 * Or full ops reseed (keeps products): npm run db:reseed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BUYER_PW = "Demo1234!";

const ADDRESSES = {
  coastal: {
    line1: "1200 Commerce Ave",
    line2: "Suite 400",
    city: "Los Angeles",
    region: "CA",
    postalCode: "90015",
    country: "US",
  },
  pacific: {
    line1: "880 Harbor Blvd",
    line2: "Dock 12",
    city: "Long Beach",
    region: "CA",
    postalCode: "90802",
    country: "US",
  },
  national: {
    line1: "4550 Industrial Pkwy",
    line2: null,
    city: "Dallas",
    region: "TX",
    postalCode: "75247",
    country: "US",
  },
  metro: {
    line1: "210 Peachtree St NW",
    line2: "Floor 8",
    city: "Atlanta",
    region: "GA",
    postalCode: "30303",
    country: "US",
  },
};

function snap(key) {
  return JSON.stringify(ADDRESSES[key] || ADDRESSES.coastal);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

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

async function upsertBuyer({
  email,
  name,
  companyId,
  passwordHash,
  companyRole = "OWNER",
  phone = null,
}) {
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      phone,
      passwordHash,
      role: "CUSTOMER",
      companyRole,
      status: "APPROVED",
      companyId,
    },
    update: {
      name,
      phone,
      passwordHash,
      role: "CUSTOMER",
      companyRole,
      status: "APPROVED",
      companyId,
    },
  });
}

async function upsertSupplier(data) {
  const existing = await prisma.supplier.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.supplier.update({ where: { id: existing.id }, data });
  }
  return prisma.supplier.create({ data });
}

async function ensureAddress(companyId, addr, label, isDefault) {
  const existing = await prisma.address.findFirst({
    where: { companyId, label },
  });
  if (existing) {
    return prisma.address.update({
      where: { id: existing.id },
      data: { ...addr, isDefault },
    });
  }
  return prisma.address.create({
    data: { companyId, label, ...addr, isDefault },
  });
}

async function clearCompanyOrders(companyIds) {
  const old = await prisma.order.findMany({
    where: { companyId: { in: companyIds } },
    select: { id: true },
  });
  if (!old.length) return;
  const ids = old.map((o) => o.id);
  await prisma.rmaItem.deleteMany({ where: { rma: { orderId: { in: ids } } } });
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

async function main() {
  const passwordHash = await bcrypt.hash(BUYER_PW, 12);

  const products = await prisma.product.findMany({
    include: { prices: true },
    where: { active: true },
    take: 12,
    orderBy: { name: "asc" },
  });

  if (products.length === 0) {
    throw new Error("No products found. Run: npm run db:seed-catalog");
  }

  const sales = await prisma.user.findFirst({
    where: { email: "sales@umaxes.com" },
  });
  const logistics = await prisma.user.findFirst({
    where: { email: "logistics@umaxes.com" },
  });

  // --- Suppliers (ops only — does not change product rows) ---
  const supplierCn = await upsertSupplier({
    name: "Shenzhen Hookamax Factory",
    contactName: "Li Wei",
    email: "orders@hookamax-factory.cn",
    phone: "+86 755 8888 1200",
    notes: "Primary OEM — 80K / 50K lines",
    active: true,
  });
  const supplierUs = await upsertSupplier({
    name: "Pacific Fulfillment Co",
    contactName: "Jordan Blake",
    email: "ops@pacificfulfill.com",
    phone: "+1 562 555 0199",
    notes: "US West cross-dock / last-mile",
    active: true,
  });
  const supplierAlt = await upsertSupplier({
    name: "Guangzhou Vape Supply",
    contactName: "Chen Mei",
    email: "export@gz-vape.supply",
    phone: "+86 20 6666 3344",
    notes: "Backup capacity for rush orders",
    active: true,
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
    defaultSupplierId: supplierUs.id,
  });

  const wholesaler = await upsertCompany({
    name: "Pacific Distro Partners",
    status: "APPROVED",
    level: "WHOLESALER",
    creditLimit: 8000,
    creditUsed: 2450,
    paymentTermsDays: 15,
    salesRepId: sales?.id || null,
    commissionRate: 4,
    defaultSupplierId: supplierCn.id,
  });

  const distro = await upsertCompany({
    name: "National Hookamax Distro",
    status: "APPROVED",
    level: "DISTRO",
    creditLimit: 20000,
    creditUsed: 8750,
    paymentTermsDays: 30,
    salesRepId: sales?.id || null,
    commissionRate: 3,
    defaultSupplierId: supplierCn.id,
  });

  const metro = await upsertCompany({
    name: "Metro Smoke Wholesale",
    status: "APPROVED",
    level: "WHOLESALER",
    creditLimit: 5000,
    creditUsed: 980,
    paymentTermsDays: 15,
    salesRepId: sales?.id || null,
    commissionRate: 4,
    defaultSupplierId: supplierAlt.id,
  });

  const pendingCo = await upsertCompany({
    name: "Pending Smoke Shop LLC",
    status: "PENDING",
    level: "SHOP",
    creditLimit: 0,
    creditUsed: 0,
    paymentTermsDays: 0,
  });

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
    phone: "+1 310 555 0142",
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
    phone: "+1 562 555 0188",
    companyId: wholesaler.id,
    passwordHash,
  });

  const buyer3 = await upsertBuyer({
    email: "distro@demo.umaxes.com",
    name: "Distro Buyer",
    phone: "+1 214 555 0166",
    companyId: distro.id,
    passwordHash,
  });

  const buyer4 = await upsertBuyer({
    email: "metro@demo.umaxes.com",
    name: "Metro Buyer",
    phone: "+1 404 555 0133",
    companyId: metro.id,
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

  await ensureAddress(shop.id, ADDRESSES.coastal, "HQ", true);
  await ensureAddress(wholesaler.id, ADDRESSES.pacific, "Warehouse", true);
  await ensureAddress(distro.id, ADDRESSES.national, "DC Dallas", true);
  await ensureAddress(metro.id, ADDRESSES.metro, "Atlanta HQ", true);

  const companyIds = [shop.id, wholesaler.id, distro.id, metro.id];
  await clearCompanyOrders(companyIds);

  // Drop leftover DEMO-* rows from older seeds
  const demoLegacy = await prisma.order.findMany({
    where: { orderNumber: { startsWith: "DEMO-" } },
    select: { id: true },
  });
  if (demoLegacy.length) {
    const ids = demoLegacy.map((o) => o.id);
    await prisma.rmaItem.deleteMany({ where: { rma: { orderId: { in: ids } } } });
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

  // Clear orphan credit ledger for demo companies (non-order rows)
  await prisma.creditLedger.deleteMany({
    where: { companyId: { in: companyIds }, orderId: null },
  });

  function lineItems(level, qtyScale = 1, productCount = 3, offset = 0) {
    const slice = products.slice(offset, offset + productCount);
    const pool = slice.length ? slice : products.slice(0, productCount);
    return pool.map((p) => {
      const tier = p.prices.find((x) => x.level === level);
      const price = tier?.unitPrice ?? p.prices[0]?.unitPrice ?? 25;
      const moq = tier?.moq || 5;
      const qty = Math.max(5, Math.round(moq * qtyScale));
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

  function totals(items, shipping = 0, discount = 0) {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const total = Math.round((subtotal + shipping - discount) * 100) / 100;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping,
      discount,
      total,
    };
  }

  const scenarios = [
    // —— Retail ——
    {
      seq: 1,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      phone: "+1 310 555 0142",
      status: "PAYMENT_PENDING",
      paymentMethod: "TT",
      level: "SHOP",
      days: 1,
      address: "coastal",
      paymentRef: null,
      notes: "Waiting on wire confirmation",
    },
    {
      seq: 2,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "SUBMITTED",
      paymentMethod: "ONLINE",
      level: "SHOP",
      days: 0,
      address: "coastal",
      qtyScale: 1,
    },
    {
      seq: 3,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "CONFIRMED",
      paymentMethod: "CHECK",
      level: "SHOP",
      days: 4,
      address: "coastal",
      paymentRef: "CHK-88421",
      qtyScale: 1.2,
      supplierId: supplierUs.id,
      shipping: 45,
    },
    {
      seq: 4,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "PICKING",
      paymentMethod: "TT",
      level: "SHOP",
      days: 6,
      address: "coastal",
      paymentRef: "TT-RETAIL-510",
      supplierId: supplierUs.id,
      supplierNote: "Pull from US-WEST",
      sentToSupplierDays: 5,
      packing: { status: "pending", boxCount: 2, cbm: 0.18, weightKg: 24 },
    },
    {
      seq: 5,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "SHIPPED",
      paymentMethod: "TT",
      level: "SHOP",
      days: 10,
      address: "coastal",
      paymentRef: "TT-RETAIL-441",
      supplierId: supplierUs.id,
      shipment: {
        carrier: "UPS",
        trackingNumber: "1Z999AA10123456001",
        status: "in_transit",
        boxCount: 3,
        cbm: 0.32,
        weightKg: 41,
      },
      qtyScale: 1.1,
    },
    {
      seq: 6,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "COMPLETED",
      paymentMethod: "ONLINE",
      level: "SHOP",
      days: 24,
      address: "coastal",
      paymentRef: "ONLINE-7721",
      supplierId: supplierUs.id,
      shipment: {
        carrier: "USPS",
        trackingNumber: "9400111899223344556677",
        status: "delivered",
        boxCount: 2,
        cbm: 0.2,
        weightKg: 28,
      },
    },
    {
      seq: 7,
      userId: buyer.id,
      companyId: shop.id,
      email: "retail@demo.umaxes.com",
      status: "CANCELLED",
      paymentMethod: "TT",
      level: "SHOP",
      days: 12,
      address: "coastal",
      notes: "Buyer cancelled — wrong flavor mix",
      qtyScale: 0.8,
    },

    // —— Wholesale ——
    {
      seq: 8,
      userId: buyer2.id,
      companyId: wholesaler.id,
      email: "wholesale@demo.umaxes.com",
      status: "PAYMENT_PENDING",
      paymentMethod: "TT",
      level: "WHOLESALER",
      days: 2,
      address: "pacific",
      qtyScale: 1.4,
      productCount: 4,
    },
    {
      seq: 9,
      userId: buyer2.id,
      companyId: wholesaler.id,
      email: "wholesale@demo.umaxes.com",
      status: "SENT_TO_SUPPLIER",
      paymentMethod: "CREDIT",
      level: "WHOLESALER",
      days: 7,
      address: "pacific",
      paymentRef: "CREDIT-TERMS",
      qtyScale: 1.5,
      productCount: 4,
      supplierId: supplierCn.id,
      supplierNote: "PO WH-2026-019 — air freight preferred",
      sentToSupplierDays: 6,
      creditCharge: true,
      packing: { status: "pending", boxCount: 8, cbm: 1.1, weightKg: 160 },
    },
    {
      seq: 10,
      userId: buyer2.id,
      companyId: wholesaler.id,
      email: "wholesale@demo.umaxes.com",
      status: "SHIPPED",
      paymentMethod: "TT",
      level: "WHOLESALER",
      days: 15,
      address: "pacific",
      paymentRef: "TT-WIRE-991",
      qtyScale: 2,
      productCount: 5,
      supplierId: supplierCn.id,
      sentToSupplierDays: 13,
      shipment: {
        carrier: "UPS",
        trackingNumber: "1Z999AA10123456784",
        status: "in_transit",
        boxCount: 12,
        cbm: 1.8,
        weightKg: 240,
      },
    },
    {
      seq: 11,
      userId: buyer2.id,
      companyId: wholesaler.id,
      email: "wholesale@demo.umaxes.com",
      status: "COMPLETED",
      paymentMethod: "CREDIT",
      level: "WHOLESALER",
      days: 32,
      address: "pacific",
      paymentRef: "CREDIT-WH-088",
      qtyScale: 1.6,
      productCount: 4,
      supplierId: supplierCn.id,
      creditCharge: true,
      placedByStaffId: sales?.id || null,
      notes: "Placed by sales on behalf of Pacific",
      shipment: {
        carrier: "FedEx",
        trackingNumber: "794612345690",
        status: "delivered",
        boxCount: 10,
        cbm: 1.4,
        weightKg: 190,
      },
    },

    // —— Distro ——
    {
      seq: 12,
      userId: buyer3.id,
      companyId: distro.id,
      email: "distro@demo.umaxes.com",
      status: "CONFIRMED",
      paymentMethod: "CREDIT",
      level: "DISTRO",
      days: 3,
      address: "national",
      paymentRef: "CREDIT-HOLD",
      qtyScale: 2.2,
      productCount: 5,
      offset: 1,
      supplierId: supplierCn.id,
      creditCharge: true,
      placedByStaffId: sales?.id || null,
      notes: "Sales desk reorder — restock Dallas DC",
      shipping: 0,
      discount: 150,
    },
    {
      seq: 13,
      userId: buyer3.id,
      companyId: distro.id,
      email: "distro@demo.umaxes.com",
      status: "SENT_TO_SUPPLIER",
      paymentMethod: "TT",
      level: "DISTRO",
      days: 9,
      address: "national",
      paymentRef: "TT-DISTRO-4410",
      qtyScale: 2.8,
      productCount: 6,
      supplierId: supplierCn.id,
      supplierNote: "Container slot Q3-B — consolidate with WH PO",
      sentToSupplierDays: 8,
      packing: { status: "pending", boxCount: 24, cbm: 4.2, weightKg: 620 },
    },
    {
      seq: 14,
      userId: buyer3.id,
      companyId: distro.id,
      email: "distro@demo.umaxes.com",
      status: "SHIPPED",
      paymentMethod: "CREDIT",
      level: "DISTRO",
      days: 18,
      address: "national",
      paymentRef: "CREDIT-SHIP-14",
      qtyScale: 2.4,
      productCount: 5,
      supplierId: supplierAlt.id,
      creditCharge: true,
      sentToSupplierDays: 16,
      shipment: {
        carrier: "DHL",
        trackingNumber: "JD014600003821",
        status: "in_transit",
        boxCount: 18,
        cbm: 3.1,
        weightKg: 480,
      },
    },
    {
      seq: 15,
      userId: buyer3.id,
      companyId: distro.id,
      email: "distro@demo.umaxes.com",
      status: "COMPLETED",
      paymentMethod: "TT",
      level: "DISTRO",
      days: 28,
      address: "national",
      paymentRef: "TT-DONE-220",
      qtyScale: 2.5,
      productCount: 5,
      supplierId: supplierCn.id,
      shipment: {
        carrier: "FedEx",
        trackingNumber: "794612345678",
        status: "delivered",
        boxCount: 20,
        cbm: 3.6,
        weightKg: 510,
      },
      rma: true,
    },
    {
      seq: 16,
      userId: buyer3.id,
      companyId: distro.id,
      email: "distro@demo.umaxes.com",
      status: "COMPLETED",
      paymentMethod: "CREDIT",
      level: "DISTRO",
      days: 45,
      address: "national",
      paymentRef: "CREDIT-PAID",
      qtyScale: 1.8,
      productCount: 4,
      supplierId: supplierCn.id,
      creditCharge: true,
      shipment: {
        carrier: "DHL",
        trackingNumber: "JD014600003",
        status: "delivered",
        boxCount: 14,
        cbm: 2.4,
        weightKg: 350,
      },
    },
    {
      seq: 17,
      userId: buyer3.id,
      companyId: distro.id,
      email: "distro@demo.umaxes.com",
      status: "COMPLETED",
      paymentMethod: "TT",
      level: "DISTRO",
      days: 55,
      address: "national",
      paymentRef: "TT-DONE-118",
      qtyScale: 3,
      productCount: 6,
      supplierId: supplierCn.id,
      placedByStaffId: sales?.id || null,
      shipment: {
        carrier: "UPS",
        trackingNumber: "1Z999AA10987654321",
        status: "delivered",
        boxCount: 28,
        cbm: 5.0,
        weightKg: 710,
      },
    },

    // —— Metro wholesale ——
    {
      seq: 18,
      userId: buyer4.id,
      companyId: metro.id,
      email: "metro@demo.umaxes.com",
      status: "SUBMITTED",
      paymentMethod: "CHECK",
      level: "WHOLESALER",
      days: 1,
      address: "metro",
      qtyScale: 1.3,
      productCount: 3,
      offset: 2,
    },
    {
      seq: 19,
      userId: buyer4.id,
      companyId: metro.id,
      email: "metro@demo.umaxes.com",
      status: "SENT_TO_SUPPLIER",
      paymentMethod: "CREDIT",
      level: "WHOLESALER",
      days: 5,
      address: "metro",
      paymentRef: "CREDIT-METRO",
      qtyScale: 1.7,
      productCount: 4,
      supplierId: supplierAlt.id,
      creditCharge: true,
      sentToSupplierDays: 4,
      packing: { status: "pending", boxCount: 6, cbm: 0.9, weightKg: 110 },
    },
    {
      seq: 20,
      userId: buyer4.id,
      companyId: metro.id,
      email: "metro@demo.umaxes.com",
      status: "COMPLETED",
      paymentMethod: "TT",
      level: "WHOLESALER",
      days: 35,
      address: "metro",
      paymentRef: "TT-METRO-902",
      qtyScale: 1.5,
      productCount: 3,
      supplierId: supplierAlt.id,
      shipment: {
        carrier: "UPS",
        trackingNumber: "1Z999AA10555666777",
        status: "delivered",
        boxCount: 7,
        cbm: 1.0,
        weightKg: 125,
      },
    },
  ];

  let rmaSourceOrder = null;
  let created = 0;
  let shipped = 0;
  let creditRows = 0;

  for (const s of scenarios) {
    const items = lineItems(
      s.level,
      s.qtyScale || 1,
      s.productCount || 3,
      s.offset || 0,
    );
    const money = totals(items, s.shipping || 0, s.discount || 0);
    const createdAt = daysAgo(s.days);
    const orderNumber = orderNumberFor(s.days, s.seq);
    const piNumber = piNumberFor(orderNumber);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        piNumber,
        userId: s.userId,
        companyId: s.companyId,
        placedByStaffId: s.placedByStaffId || null,
        supplierId: s.supplierId || null,
        status: s.status,
        paymentMethod: s.paymentMethod,
        email: s.email,
        phone: s.phone || null,
        addressSnap: snap(s.address),
        ...money,
        paymentRef: s.paymentRef || null,
        notes: s.notes || null,
        supplierNote: s.supplierNote || null,
        sentToSupplierAt: s.sentToSupplierDays
          ? daysAgo(s.sentToSupplierDays)
          : s.supplierId &&
              ["SENT_TO_SUPPLIER", "PICKING", "SHIPPED", "COMPLETED"].includes(
                s.status,
              )
            ? daysAgo(Math.max(0, s.days - 1))
            : null,
        createdAt,
        updatedAt: createdAt,
        items: { create: items },
        payments: s.paymentRef
          ? {
              create: {
                method: s.paymentMethod,
                amount: money.total,
                reference: s.paymentRef,
                status:
                  s.status === "PAYMENT_PENDING" || s.status === "CANCELLED"
                    ? "pending"
                    : "received",
                paidAt:
                  s.status === "PAYMENT_PENDING" || s.status === "CANCELLED"
                    ? null
                    : createdAt,
              },
            }
          : undefined,
      },
    });
    created += 1;

    if (s.shipment) {
      const shippedAt = daysAgo(Math.max(0, s.days - 2));
      const shipment = await prisma.shipment.create({
        data: {
          orderId: order.id,
          carrier: s.shipment.carrier,
          trackingNumber: s.shipment.trackingNumber,
          status: s.shipment.status,
          shippedAt,
          deliveredAt:
            s.shipment.status === "delivered"
              ? daysAgo(Math.max(0, s.days - 5))
              : null,
          boxCount: s.shipment.boxCount ?? null,
          cbm: s.shipment.cbm ?? null,
          weightKg: s.shipment.weightKg ?? null,
          packingNote: logistics
            ? `Packed by logistics · ${s.shipment.carrier}`
            : "Packed",
          packedAt: daysAgo(Math.max(0, s.days - 3)),
          lastTrackedAt: daysAgo(Math.max(0, s.days - 1)),
          trackingStatus:
            s.shipment.status === "delivered" ? "Delivered" : "In transit",
          lines: {
            create: items.map((it, idx) => ({
              sku: it.sku,
              name: it.name,
              quantity: it.quantity,
              flavor: it.name.split("—")[0]?.trim() || it.name,
              size: idx % 2 === 0 ? "80K" : "50K",
              boxes: Math.max(1, Math.ceil(it.quantity / 10)),
            })),
          },
        },
      });
      void shipment;
      shipped += 1;
    } else if (s.packing) {
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          status: s.packing.status || "pending",
          boxCount: s.packing.boxCount ?? null,
          cbm: s.packing.cbm ?? null,
          weightKg: s.packing.weightKg ?? null,
          packingNote: "Awaiting carrier / tracking",
          packedAt: daysAgo(Math.max(0, s.days - 1)),
          lines: {
            create: items.map((it, idx) => ({
              sku: it.sku,
              name: it.name,
              quantity: it.quantity,
              flavor: it.name.split("—")[0]?.trim() || it.name,
              size: idx % 2 === 0 ? "80K" : "50K",
              boxes: Math.max(1, Math.ceil(it.quantity / 10)),
            })),
          },
        },
      });
      shipped += 1;
    }

    if (s.creditCharge || s.paymentMethod === "CREDIT") {
      await prisma.creditLedger.create({
        data: {
          companyId: s.companyId,
          orderId: order.id,
          type: "charge",
          amount: money.total,
          dueDate: daysAgo(Math.max(0, s.days - (s.level === "DISTRO" ? 30 : 15))),
          note: `Credit charge ${orderNumber}`,
          createdAt,
        },
      });
      creditRows += 1;
    }

    if (s.rma) {
      rmaSourceOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
    }
  }

  // Extra credit payments / adjustments
  await prisma.creditLedger.create({
    data: {
      companyId: distro.id,
      type: "payment",
      amount: -2500,
      note: "Wire payment applied to open balance",
      createdAt: daysAgo(12),
    },
  });
  await prisma.creditLedger.create({
    data: {
      companyId: wholesaler.id,
      type: "payment",
      amount: -800,
      note: "Check #44821 cleared",
      createdAt: daysAgo(8),
    },
  });
  await prisma.creditLedger.create({
    data: {
      companyId: metro.id,
      type: "payment",
      amount: -400,
      note: "Partial terms payment",
      createdAt: daysAgo(6),
    },
  });
  creditRows += 3;

  if (rmaSourceOrder?.items?.[0]) {
    const item = rmaSourceOrder.items[0];
    const rmaStamp = orderNumberFor(28, 15).replace("UMX-", "RMA-");
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

  // Second RMA on older completed order (approved)
  const completedForRma = await prisma.order.findFirst({
    where: {
      companyId: distro.id,
      status: "COMPLETED",
      orderNumber: { not: rmaSourceOrder?.orderNumber || "" },
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
  if (completedForRma?.items?.[0]) {
    const item = completedForRma.items[0];
    await prisma.rma.create({
      data: {
        rmaNumber: `RMA-${completedForRma.orderNumber.replace("UMX-", "")}`,
        orderId: completedForRma.id,
        companyId: completedForRma.companyId,
        userId: completedForRma.userId,
        reason: "Wrong flavor assortment vs PI",
        status: "APPROVED",
        items: {
          create: [
            {
              sku: item.sku,
              name: item.name,
              quantity: Math.min(1, item.quantity),
              image: item.image,
            },
          ],
        },
      },
    });
  }

  const supplierCount = await prisma.supplier.count({ where: { active: true } });
  const orderCount = await prisma.order.count({
    where: { companyId: { in: companyIds } },
  });
  const shipmentCount = await prisma.shipment.count({
    where: { order: { companyId: { in: companyIds } } },
  });

  console.log("\n=== UMAXES ops showcase seed ready ===\n");
  console.log("Catalog products / images / prices untouched.");
  console.log({
    suppliers: supplierCount,
    ordersCreated: created,
    ordersInDb: orderCount,
    shipments: shipmentCount,
    creditLedgerRows: creditRows,
  });
  console.log("\nLogin strip:");
  console.log("  Super admin  super@umaxes.com / Super1234!");
  console.log("  Admin        admin@umaxes.com / Admin1234!");
  console.log("  Wholesaler   wholesale@demo.umaxes.com / Demo1234!");
  console.log("  Distributor  distro@demo.umaxes.com / Demo1234!");
  console.log("  Metro WHO    metro@demo.umaxes.com / Demo1234!");
  console.log("  Sales        sales@umaxes.com / Staff1234!");
  console.log("  Logistics    logistics@umaxes.com / Staff1234!");
  console.log("  Retail       retail@demo.umaxes.com / Demo1234!");
  console.log("\nOpen /admin → Orders · Logistics · Credit · /account → Orders\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
