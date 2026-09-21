import type { CustomerLevel } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/catalog";
import { TEST_STATION_SKU } from "@/lib/pack";

export { TEST_STATION_SKU };
export const TEST_STATION_NAME = "Test Station (incl. 1 device)";

export type RebateTier = { minQty: number; rateUsd: number };

export type ChannelPolicy = {
  id: string;
  level: CustomerLevel;
  active: boolean;
  unitPrice: number | null;
  pcsPerCase: number;
  testStationsPerCase: number;
  firstOrderCases: number;
  firstOrderUnpaidPcs: number;
  timezone: string;
  tiers: RebateTier[];
};

export type ChannelQuote = {
  eligible: boolean;
  hideCoupon: boolean;
  isFirstOrder: boolean;
  sellingQty: number;
  cases: number;
  testStationQty: number;
  firstOrderUnpaidPcs: number;
  firstOrderDiscountUsd: number;
  rebateBalanceUsd: number;
  rebateAppliedUsd: number;
  chargedQty: number;
  unitPrice: number | null;
  monthPaidQty: number;
  monthProjectedRate: number;
  nextTierQty: number | null;
  nextTierRate: number | null;
  monthKey: string;
};

const WHOLESALER_TIERS: RebateTier[] = [
  { minQty: 5000, rateUsd: 0.2 },
  { minQty: 10000, rateUsd: 0.4 },
  { minQty: 20000, rateUsd: 0.6 },
];

export function parseTiers(raw: unknown): RebateTier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const minQty = Math.floor(Number(r.minQty) || 0);
      const rateUsd = Number(r.rateUsd);
      if (minQty < 1 || !Number.isFinite(rateUsd) || rateUsd < 0) return null;
      return { minQty, rateUsd };
    })
    .filter((t): t is RebateTier => Boolean(t))
    .sort((a, b) => a.minQty - b.minQty);
}

export function policyFromRow(row: {
  id: string;
  level: CustomerLevel;
  active: boolean;
  unitPrice: number | null;
  pcsPerCase: number;
  testStationsPerCase: number;
  firstOrderCases: number;
  firstOrderUnpaidPcs: number;
  timezone: string;
  tiers: unknown;
}): ChannelPolicy {
  return {
    id: row.id,
    level: row.level,
    active: row.active,
    unitPrice: row.unitPrice,
    pcsPerCase: Math.max(1, row.pcsPerCase || 95),
    testStationsPerCase: Math.max(0, row.testStationsPerCase || 0),
    firstOrderCases: Math.max(1, row.firstOrderCases || 5),
    firstOrderUnpaidPcs: Math.max(0, row.firstOrderUnpaidPcs || 0),
    timezone: row.timezone || "America/Los_Angeles",
    tiers: parseTiers(row.tiers),
  };
}

export function isChannelLevel(level: CustomerLevel) {
  return level === "WHOLESALER" || level === "DISTRO";
}

export function isPolicyLive(policy: ChannelPolicy | null | undefined) {
  if (!policy?.active) return false;
  if (policy.level === "SHOP") return false;
  if (policy.level === "DISTRO" && !(policy.unitPrice && policy.unitPrice > 0)) {
    return false;
  }
  if (policy.level === "DISTRO" && policy.tiers.length === 0) return false;
  return true;
}

export function yearMonthFor(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

export function monthBounds(yearMonth: string, timeZone: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = zonedDate(year, month, 1, timeZone);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = zonedDate(nextYear, nextMonth, 1, timeZone);
  return { start, end };
}

function zonedDate(year: number, month: number, day: number, timeZone: string) {
  const utcGuess = Date.UTC(year, month - 1, day, 12, 0, 0);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcGuess));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value || 0);
  const shown = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
  );
  const offset = shown - utcGuess;
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offset);
}

export function caseCount(sellingQty: number, pcsPerCase: number) {
  return Math.floor(Math.max(0, sellingQty) / Math.max(1, pcsPerCase));
}

export function testStationQty(
  sellingQty: number,
  pcsPerCase: number,
  perCase: number,
) {
  return caseCount(sellingQty, pcsPerCase) * Math.max(0, perCase);
}

export function firstOrderUnpaidPcs(
  sellingQty: number,
  policy: ChannelPolicy,
  isFirstOrder: boolean,
) {
  if (!isFirstOrder) return 0;
  const cases = caseCount(sellingQty, policy.pcsPerCase);
  const bundles = Math.floor(cases / policy.firstOrderCases);
  return bundles * policy.firstOrderUnpaidPcs;
}

export function matchTier(paidQty: number, tiers: RebateTier[]) {
  let rate = 0;
  for (const tier of tiers) {
    if (paidQty >= tier.minQty) rate = tier.rateUsd;
  }
  return rate;
}

export function nextTier(paidQty: number, tiers: RebateTier[]) {
  const next = tiers.find((t) => t.minQty > paidQty);
  if (!next) return { qty: null as number | null, rate: null as number | null };
  return { qty: next.minQty - paidQty, rate: next.rateUsd };
}

export async function ensureRebatePolicies() {
  const wholesaler = await prisma.rebatePolicy.upsert({
    where: { level: "WHOLESALER" },
    create: {
      level: "WHOLESALER",
      active: true,
      unitPrice: 8.9,
      pcsPerCase: 95,
      testStationsPerCase: 1,
      firstOrderCases: 5,
      firstOrderUnpaidPcs: 20,
      timezone: "America/Los_Angeles",
      tiers: WHOLESALER_TIERS,
    },
    update: {},
  });
  const distro = await prisma.rebatePolicy.upsert({
    where: { level: "DISTRO" },
    create: {
      level: "DISTRO",
      active: false,
      unitPrice: null,
      pcsPerCase: 95,
      testStationsPerCase: 1,
      firstOrderCases: 5,
      firstOrderUnpaidPcs: 20,
      timezone: "America/Los_Angeles",
      tiers: [],
    },
    update: {},
  });
  return { wholesaler, distro };
}

export async function getPolicyForLevel(level: CustomerLevel) {
  if (!isChannelLevel(level)) return null;
  await ensureRebatePolicies();
  const row = await prisma.rebatePolicy.findUnique({ where: { level } });
  return row ? policyFromRow(row) : null;
}

export async function listRebatePolicies() {
  await ensureRebatePolicies();
  const rows = await prisma.rebatePolicy.findMany({
    orderBy: { level: "asc" },
  });
  return rows.map(policyFromRow);
}

export async function ensureTestStationProduct() {
  const existing = await prisma.product.findUnique({
    where: { sku: TEST_STATION_SKU },
  });
  if (existing) return existing;

  return prisma.product.create({
    data: {
      sku: TEST_STATION_SKU,
      name: TEST_STATION_NAME,
      description: "Free test station kit. Includes 1 HOOKAMAX device.",
      active: true,
      visibleLevels: ["WHOLESALER", "DISTRO"],
      inventory: { create: { quantity: 100000, reserved: 0 } },
      prices: {
        create: [
          { level: "WHOLESALER", unitPrice: 0, moq: 1 },
          { level: "DISTRO", unitPrice: 0, moq: 1 },
          { level: "SHOP", unitPrice: 0, moq: 1 },
        ],
      },
    },
  });
}

export async function companyIsFirstOrder(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { firstOrderId: true },
  });
  if (company?.firstOrderId) return false;
  const count = await prisma.order.count({
    where: { companyId, status: { not: "CANCELLED" } },
  });
  return count === 0;
}

export function emptyQuote(sellingQty: number): ChannelQuote {
  return {
    eligible: false,
    hideCoupon: false,
    isFirstOrder: false,
    sellingQty,
    cases: 0,
    testStationQty: 0,
    firstOrderUnpaidPcs: 0,
    firstOrderDiscountUsd: 0,
    rebateBalanceUsd: 0,
    rebateAppliedUsd: 0,
    chargedQty: sellingQty,
    unitPrice: null,
    monthPaidQty: 0,
    monthProjectedRate: 0,
    nextTierQty: null,
    nextTierRate: null,
    monthKey: "",
  };
}

export async function quoteForCompany(
  companyId: string,
  sellingQty: number,
  unitPriceHint?: number,
): Promise<ChannelQuote> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      level: true,
      rebateBalanceUsd: true,
      firstCompletedOrderId: true,
    },
  });
  if (!company || !isChannelLevel(company.level)) {
    return emptyQuote(sellingQty);
  }

  const policy = await getPolicyForLevel(company.level);
  const live = isPolicyLive(policy);
  if (!policy || !live) {
    return { ...emptyQuote(sellingQty), hideCoupon: false };
  }

  const isFirst = await companyIsFirstOrder(company.id);
  const cases = caseCount(sellingQty, policy.pcsPerCase);
  const stations = testStationQty(
    sellingQty,
    policy.pcsPerCase,
    policy.testStationsPerCase,
  );
  const unpaid = firstOrderUnpaidPcs(sellingQty, policy, isFirst);
  const unit = policy.unitPrice ?? unitPriceHint ?? 0;
  const firstDiscount = roundMoney(unpaid * unit);
  const sellSubtotal = roundMoney(Math.max(0, sellingQty * unit - firstDiscount));
  const rebateApplied = isFirst
    ? 0
    : roundMoney(Math.min(company.rebateBalanceUsd, sellSubtotal));
  const chargedQty = Math.max(0, sellingQty - unpaid);

  const monthKey = yearMonthFor(new Date(), policy.timezone);
  const { start, end } = monthBounds(monthKey, policy.timezone);
  const monthPaidQty = await sumPaidQty(
    company.id,
    start,
    end,
  );

  const monthProjectedRate = matchTier(monthPaidQty, policy.tiers);
  const nxt = nextTier(monthPaidQty, policy.tiers);

  return {
    eligible: true,
    hideCoupon: true,
    isFirstOrder: isFirst,
    sellingQty,
    cases,
    testStationQty: stations,
    firstOrderUnpaidPcs: unpaid,
    firstOrderDiscountUsd: firstDiscount,
    rebateBalanceUsd: roundMoney(company.rebateBalanceUsd),
    rebateAppliedUsd: rebateApplied,
    chargedQty,
    unitPrice: policy.unitPrice,
    monthPaidQty,
    monthProjectedRate,
    nextTierQty: nxt.qty,
    nextTierRate: nxt.rate,
    monthKey,
  };
}

async function sumPaidQty(
  companyId: string,
  start: Date,
  end: Date,
) {
  const payments = await prisma.payment.findMany({
    where: {
      status: "paid",
      paidAt: { gte: start, lt: end },
      order: {
        companyId,
        status: { not: "CANCELLED" },
        isFirstOrder: false,
      },
    },
    include: {
      order: { select: { id: true, sellingQty: true } },
    },
  });

  const seen = new Set<string>();
  let qty = 0;
  for (const p of payments) {
    if (seen.has(p.orderId)) continue;
    seen.add(p.orderId);
    qty += p.order.sellingQty || 0;
  }
  return qty;
}

export async function recalcRebateMonth(
  companyId: string,
  paidAt: Date = new Date(),
) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      level: true,
      firstCompletedOrderId: true,
    },
  });
  if (!company || !isChannelLevel(company.level)) return null;

  const policy = await getPolicyForLevel(company.level);
  if (!policy || !isPolicyLive(policy)) return null;

  const monthKey = yearMonthFor(paidAt, policy.timezone);
  const { start, end } = monthBounds(monthKey, policy.timezone);
  const paidQty = await sumPaidQty(
    company.id,
    start,
    end,
  );
  const tierRate = matchTier(paidQty, policy.tiers);
  const rebateAmount = roundMoney(paidQty * tierRate);
  const snapshot = JSON.stringify({
    unitPrice: policy.unitPrice,
    pcsPerCase: policy.pcsPerCase,
    tiers: policy.tiers,
    timezone: policy.timezone,
  });

  const existing = await prisma.rebateMonth.findUnique({
    where: {
      companyId_yearMonth: { companyId: company.id, yearMonth: monthKey },
    },
  });

  if (!existing) {
    return prisma.rebateMonth.create({
      data: {
        companyId: company.id,
        yearMonth: monthKey,
        paidQty,
        tierRate,
        rebateAmount,
        status: "DRAFT",
        policySnapshot: snapshot,
      },
    });
  }

  if (existing.status === "LOCKED") return existing;

  if (existing.status === "ISSUED") {
    const nextAmount = Math.max(existing.rebateAmount, rebateAmount);
    const updated = await prisma.rebateMonth.update({
      where: { id: existing.id },
      data: {
        paidQty: Math.max(existing.paidQty, paidQty),
        tierRate: Math.max(existing.tierRate, tierRate),
        rebateAmount: nextAmount,
        policySnapshot: existing.policySnapshot || snapshot,
      },
    });
    const delta = roundMoney(nextAmount - existing.issuedAmount);
    if (delta > 0) {
      await issueMonthDelta(updated.id, delta, "Tier top-up after additional paid volume");
    }
    return prisma.rebateMonth.findUnique({ where: { id: existing.id } });
  }

  return prisma.rebateMonth.update({
    where: { id: existing.id },
    data: {
      paidQty,
      tierRate,
      rebateAmount,
      policySnapshot: existing.policySnapshot || snapshot,
    },
  });
}

async function issueMonthDelta(rebateMonthId: string, delta: number, note: string) {
  if (delta <= 0) return;
  const month = await prisma.rebateMonth.findUnique({
    where: { id: rebateMonthId },
  });
  if (!month) return;

  await prisma.$transaction([
    prisma.company.update({
      where: { id: month.companyId },
      data: { rebateBalanceUsd: { increment: delta } },
    }),
    prisma.rebateMonth.update({
      where: { id: month.id },
      data: { issuedAmount: { increment: delta } },
    }),
    prisma.rebateLedger.create({
      data: {
        companyId: month.companyId,
        rebateMonthId: month.id,
        type: "ISSUE",
        amount: delta,
        note,
      },
    }),
  ]);
}

export async function issueRebateMonth(rebateMonthId: string, actorId: string) {
  const month = await prisma.rebateMonth.findUnique({
    where: { id: rebateMonthId },
  });
  if (!month) throw new Error("Rebate month not found");
  if (month.status === "LOCKED") throw new Error("This month is locked");

  const delta = roundMoney(month.rebateAmount - month.issuedAmount);
  if (delta < 0) throw new Error("Issued amount exceeds calculated rebate");

  await prisma.$transaction(async (tx) => {
    if (delta > 0) {
      await tx.company.update({
        where: { id: month.companyId },
        data: { rebateBalanceUsd: { increment: delta } },
      });
      await tx.rebateLedger.create({
        data: {
          companyId: month.companyId,
          rebateMonthId: month.id,
          type: "ISSUE",
          amount: delta,
          note: `Issued ${month.yearMonth} rebate`,
          actorId,
        },
      });
    }
    await tx.rebateMonth.update({
      where: { id: month.id },
      data: {
        status: "ISSUED",
        issuedAmount: month.rebateAmount,
        issuedAt: month.issuedAt || new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "REBATE_ISSUED",
        entity: "RebateMonth",
        entityId: month.id,
        meta: JSON.stringify({
          companyId: month.companyId,
          yearMonth: month.yearMonth,
          amount: month.rebateAmount,
          delta,
        }),
      },
    });
  });
}

export async function adjustRebateWallet(
  companyId: string,
  amount: number,
  note: string,
  actorId: string,
) {
  const amt = roundMoney(amount);
  if (!amt) throw new Error("Amount required");
  const type = amt < 0 ? "CLAWBACK" : "ADJUST";
  await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
      data: { rebateBalanceUsd: { increment: amt } },
    }),
    prisma.rebateLedger.create({
      data: {
        companyId,
        type,
        amount: amt,
        note,
        actorId,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: actorId,
        action: type === "CLAWBACK" ? "REBATE_CLAWBACK" : "REBATE_ADJUST",
        entity: "Company",
        entityId: companyId,
        meta: JSON.stringify({ amount: amt, note }),
      },
    }),
  ]);
}

export async function applyWalletInTx(
  tx: Prisma.TransactionClient,
  companyId: string,
  orderId: string,
  amount: number,
) {
  const amt = roundMoney(amount);
  if (amt <= 0) return;
  await tx.company.update({
    where: { id: companyId },
    data: { rebateBalanceUsd: { decrement: amt } },
  });
  await tx.rebateLedger.create({
    data: {
      companyId,
      orderId,
      type: "APPLY",
      amount: -amt,
      note: "Applied to order",
    },
  });
}

export async function onPaymentReceived(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      companyId: true,
      isFirstOrder: true,
    },
  });
  if (!order) return;

  const company = await prisma.company.findUnique({
    where: { id: order.companyId },
    select: { firstCompletedOrderId: true, level: true },
  });
  if (!company) return;

  if (order.isFirstOrder && !company.firstCompletedOrderId) {
    await prisma.company.update({
      where: { id: order.companyId },
      data: { firstCompletedOrderId: order.id },
    });
  }

  await recalcRebateMonth(order.companyId, new Date());
}
