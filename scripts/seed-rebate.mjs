/**
 * Showcase seed for the channel rebate program.
 * Uses the same rules as runtime: 95+1, first-order unpaid pcs,
 * paid-only monthly ladder, issue to wallet, apply on a later order.
 *
 * Run: npm run db:seed-catalog && npm run db:seed-rebate
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UNIT = 8.9;
const PCS_PER_CASE = 95;
const TEST_PER_CASE = 1;
const FIRST_CASES = 5;
const FIRST_UNPAID = 20;
const PREFIX = "UMX-RB-";
const TZ = "America/Los_Angeles";
const ADDRESS = JSON.stringify({
  line1: "1200 Commerce Ave",
  city: "Los Angeles",
  region: "CA",
  postalCode: "90015",
  country: "US",
});

function money(n) {
  return Math.round(n * 100) / 100;
}

function casesOf(qty) {
  return Math.floor(qty / PCS_PER_CASE);
}

function stationsOf(qty) {
  return casesOf(qty) * TEST_PER_CASE;
}

function firstUnpaid(qty, isFirst) {
  if (!isFirst) return 0;
  return Math.floor(casesOf(qty) / FIRST_CASES) * FIRST_UNPAID;
}

function yearMonthFor(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

function matchTier(paidQty) {
  const tiers = [
    { minQty: 5000, rateUsd: 0.2 },
    { minQty: 10000, rateUsd: 0.4 },
    { minQty: 20000, rateUsd: 0.6 },
  ];
  let rate = 0;
  for (const tier of tiers) {
    if (paidQty >= tier.minQty) rate = tier.rateUsd;
  }
  return rate;
}

async function companyByName(name) {
  const row = await prisma.company.findFirst({ where: { name } });
  if (!row) throw new Error(`Missing company "${name}". Run npm run db:seed-demo first.`);
  return row;
}

async function buyerFor(companyId, email) {
  const row = await prisma.user.findFirst({
    where: { companyId, role: "CUSTOMER" },
    orderBy: { createdAt: "asc" },
  });
  if (row) return row;
  const named = await prisma.user.findUnique({ where: { email } });
  if (named) return named;
  throw new Error(`Missing buyer for ${email}`);
}

async function upsertSunrise() {
  const passwordHash = await bcrypt.hash("Demo1234!", 12);
  let company = await prisma.company.findFirst({
    where: { name: "Sunrise Channel Wholesale" },
  });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Sunrise Channel Wholesale",
        status: "APPROVED",
        level: "WHOLESALER",
        creditLimit: 4000,
        paymentTermsDays: 15,
        commissionRate: 4,
      },
    });
  } else {
    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        status: "APPROVED",
        level: "WHOLESALER",
        firstOrderId: null,
        firstCompletedOrderId: null,
        rebateBalanceUsd: 0,
      },
    });
  }
  const user = await prisma.user.upsert({
    where: { email: "channel@demo.umaxes.com" },
    create: {
      email: "channel@demo.umaxes.com",
      name: "Sunrise Buyer",
      passwordHash,
      role: "CUSTOMER",
      companyRole: "OWNER",
      status: "APPROVED",
      companyId: company.id,
    },
    update: {
      passwordHash,
      status: "APPROVED",
      role: "CUSTOMER",
      companyId: company.id,
    },
  });
  return { company, user };
}

async function cleanupRebateSeed() {
  const old = await prisma.order.findMany({
    where: { orderNumber: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = old.map((o) => o.id);
  if (ids.length) {
    await prisma.rebateLedger.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.rebateLedger.deleteMany({
    where: { company: { level: "WHOLESALER" } },
  });
  await prisma.rebateMonth.deleteMany({
    where: { company: { level: "WHOLESALER" } },
  });
  await prisma.company.updateMany({
    where: { level: "WHOLESALER" },
    data: {
      rebateBalanceUsd: 0,
      firstOrderId: null,
      firstCompletedOrderId: null,
    },
  });
}

async function placeChannelOrder({
  number,
  user,
  company,
  product,
  station,
  sellingQty,
  isFirst,
  applyWallet = 0,
  paid = true,
  daysAgo = 2,
  note,
}) {
  const unpaid = firstUnpaid(sellingQty, isFirst);
  const stations = stationsOf(sellingQty);
  const chargedQty = Math.max(0, sellingQty - unpaid);
  const unit = UNIT;
  const goods = money(chargedQty * unit);
  const rebateApplied = isFirst ? 0 : money(Math.min(applyWallet, goods));
  const subtotal = money(sellingQty * unit);
  const discount = money(unpaid * unit + rebateApplied);
  const total = money(Math.max(0, subtotal - discount));
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const items = [
    {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: sellingQty,
      unitPrice: unit,
      image: product.image,
    },
  ];
  if (stations > 0 && station) {
    items.push({
      productId: station.id,
      sku: station.sku,
      name: station.name,
      quantity: stations,
      unitPrice: 0,
      image: station.image,
    });
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: number,
      piNumber: `PI-${number.replace("UMX-", "")}`,
      userId: user.id,
      companyId: company.id,
      status: "CONFIRMED",
      paymentMethod: "TT",
      email: user.email,
      addressSnap: ADDRESS,
      subtotal,
      shipping: 0,
      discount,
      total,
      paymentRef: paid ? `TT-${number}` : null,
      notes: note,
      sellingQty,
      chargedQty,
      testStationQty: stations,
      firstOrderUnpaidPcs: unpaid,
      rebateAppliedUsd: rebateApplied,
      isFirstOrder: isFirst,
      createdAt,
      updatedAt: createdAt,
      items: { create: items },
      payments: paid
        ? {
            create: {
              method: "TT",
              amount: total,
              reference: `TT-${number}`,
              status: "paid",
              paidAt: createdAt,
            },
          }
        : undefined,
    },
  });

  if (rebateApplied > 0) {
    await prisma.company.update({
      where: { id: company.id },
      data: { rebateBalanceUsd: { decrement: rebateApplied } },
    });
    await prisma.rebateLedger.create({
      data: {
        companyId: company.id,
        orderId: order.id,
        type: "APPLY",
        amount: -rebateApplied,
        note: `Applied to ${order.orderNumber}`,
      },
    });
  }

  if (isFirst) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        firstOrderId: order.id,
        firstCompletedOrderId: paid ? order.id : undefined,
      },
    });
  }

  return order;
}

async function rebuildMonth(companyId, actorId, { issue }) {
  const paid = await prisma.payment.findMany({
    where: {
      status: "paid",
      order: {
        companyId,
        status: { not: "CANCELLED" },
        isFirstOrder: false,
        orderNumber: { startsWith: PREFIX },
      },
    },
    include: { order: { select: { sellingQty: true, id: true } } },
  });
  const seen = new Set();
  let paidQty = 0;
  for (const p of paid) {
    if (seen.has(p.orderId)) continue;
    seen.add(p.orderId);
    paidQty += p.order.sellingQty || 0;
  }
  const tierRate = matchTier(paidQty);
  const rebateAmount = money(paidQty * tierRate);
  const yearMonth = yearMonthFor(new Date());
  const month = await prisma.rebateMonth.create({
    data: {
      companyId,
      yearMonth,
      paidQty,
      tierRate,
      rebateAmount,
      status: issue ? "ISSUED" : "DRAFT",
      issuedAmount: issue ? rebateAmount : 0,
      issuedAt: issue ? new Date() : null,
      policySnapshot: JSON.stringify({
        unitPrice: UNIT,
        pcsPerCase: PCS_PER_CASE,
        tiers: [
          { minQty: 5000, rateUsd: 0.2 },
          { minQty: 10000, rateUsd: 0.4 },
          { minQty: 20000, rateUsd: 0.6 },
        ],
      }),
    },
  });

  if (issue && rebateAmount > 0) {
    await prisma.company.update({
      where: { id: companyId },
      data: { rebateBalanceUsd: { increment: rebateAmount } },
    });
    await prisma.rebateLedger.create({
      data: {
        companyId,
        rebateMonthId: month.id,
        type: "ISSUE",
        amount: rebateAmount,
        note: `Issued ${yearMonth} rebate`,
        actorId,
      },
    });
  }
  return month;
}

async function main() {
  const product = await prisma.product.findUnique({ where: { sku: "peach-mango" } });
  const station = await prisma.product.findUnique({ where: { sku: "test-station" } });
  if (!product || !station) {
    throw new Error("Catalog missing. Run npm run db:seed-catalog first.");
  }

  await prisma.rebatePolicy.upsert({
    where: { level: "WHOLESALER" },
    create: {
      level: "WHOLESALER",
      active: true,
      unitPrice: UNIT,
      pcsPerCase: PCS_PER_CASE,
      testStationsPerCase: TEST_PER_CASE,
      firstOrderCases: FIRST_CASES,
      firstOrderUnpaidPcs: FIRST_UNPAID,
      timezone: TZ,
      tiers: [
        { minQty: 5000, rateUsd: 0.2 },
        { minQty: 10000, rateUsd: 0.4 },
        { minQty: 20000, rateUsd: 0.6 },
      ],
    },
    update: {
      active: true,
      unitPrice: UNIT,
      pcsPerCase: PCS_PER_CASE,
      testStationsPerCase: TEST_PER_CASE,
      firstOrderCases: FIRST_CASES,
      firstOrderUnpaidPcs: FIRST_UNPAID,
      timezone: TZ,
      tiers: [
        { minQty: 5000, rateUsd: 0.2 },
        { minQty: 10000, rateUsd: 0.4 },
        { minQty: 20000, rateUsd: 0.6 },
      ],
    },
  });

  const actor = await prisma.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    orderBy: { createdAt: "asc" },
  });
  if (!actor) throw new Error("No admin user. Run npm run db:seed-admin first.");

  const pacific = await companyByName("Pacific Distro Partners");
  const metro = await companyByName("Metro Smoke Wholesale");
  const sunrise = await upsertSunrise();
  const pacificBuyer = await buyerFor(pacific.id, "wholesale@demo.umaxes.com");
  const metroBuyer = await buyerFor(metro.id, "metro@demo.umaxes.com");

  await cleanupRebateSeed();

  // Metro: hit $0.40 tier, issue to wallet, then use some on the next order.
  await placeChannelOrder({
    number: `${PREFIX}METRO-VOL`,
    user: metroBuyer,
    company: metro,
    product,
    station,
    sellingQty: 10000,
    isFirst: false,
    paid: true,
    daysAgo: 8,
    note: "Seed: 10,000 paid pcs → $0.40 tier",
  });
  await rebuildMonth(metro.id, actor.id, { issue: true });
  const metroWallet = await prisma.company.findUnique({
    where: { id: metro.id },
    select: { rebateBalanceUsd: true },
  });
  await placeChannelOrder({
    number: `${PREFIX}METRO-USE`,
    user: metroBuyer,
    company: metro,
    product,
    station,
    sellingQty: 190,
    isFirst: false,
    applyWallet: metroWallet?.rebateBalanceUsd || 0,
    paid: true,
    daysAgo: 1,
    note: "Seed: wallet auto-applied",
  });

  // Pacific: $0.20 tier issued so a second wallet has a balance.
  await placeChannelOrder({
    number: `${PREFIX}PACIFIC-VOL`,
    user: pacificBuyer,
    company: pacific,
    product,
    station,
    sellingQty: 6000,
    isFirst: false,
    paid: true,
    daysAgo: 6,
    note: "Seed: 6,000 paid pcs → $0.20 tier",
  });
  await rebuildMonth(pacific.id, actor.id, { issue: true });
  await prisma.company.update({
    where: { id: pacific.id },
    data: { rebateBalanceUsd: { increment: 50 } },
  });
  await prisma.rebateLedger.create({
    data: {
      companyId: pacific.id,
      type: "ADJUST",
      amount: 50,
      note: "Seed goodwill credit",
      actorId: actor.id,
    },
  });

  // Sunrise: first order 95+1 + unpaid pcs, then a draft month ready to issue.
  await placeChannelOrder({
    number: `${PREFIX}SUN-FIRST`,
    user: sunrise.user,
    company: sunrise.company,
    product,
    station,
    sellingQty: 475,
    isFirst: true,
    paid: true,
    daysAgo: 12,
    note: "Seed: first order 5 cases, 5 test stations, 20 unpaid pcs",
  });
  await placeChannelOrder({
    number: `${PREFIX}SUN-VOL`,
    user: sunrise.user,
    company: sunrise.company,
    product,
    station,
    sellingQty: 5200,
    isFirst: false,
    paid: true,
    daysAgo: 3,
    note: "Seed: second order, rebate month left as Ready to issue",
  });
  await rebuildMonth(sunrise.company.id, actor.id, { issue: false });

  const wallets = await prisma.company.findMany({
    where: { level: "WHOLESALER" },
    select: { name: true, rebateBalanceUsd: true },
    orderBy: { name: "asc" },
  });
  const months = await prisma.rebateMonth.findMany({
    include: { company: { select: { name: true } } },
    orderBy: { yearMonth: "desc" },
  });
  const ledger = await prisma.rebateLedger.count();

  console.log("\n=== Rebate program seeded ===\n");
  console.log("Wallets:");
  for (const w of wallets) {
    console.log(`  ${w.name}: $${w.rebateBalanceUsd.toFixed(2)}`);
  }
  console.log("\nMonths:");
  for (const m of months) {
    console.log(
      `  ${m.company.name} ${m.yearMonth}: ${m.paidQty} pcs · $${m.rebateAmount.toFixed(2)} · ${m.status}`,
    );
  }
  console.log(`\nWallet activity rows: ${ledger}`);
  console.log("\nLogins:");
  console.log("  Admin        super@umaxes.com / Super1234!");
  console.log("  Pacific WHO  wholesale@demo.umaxes.com / Demo1234!");
  console.log("  Metro WHO    metro@demo.umaxes.com / Demo1234!");
  console.log("  Sunrise WHO  channel@demo.umaxes.com / Demo1234!");
  console.log("\nOpen /admin/rebates  (Ready to issue = Sunrise)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
