import type { CustomerLevel, PaymentMethod } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { CASE_MOQ_PCS } from "@/lib/pack";

export async function getCatalogForLevel(level: CustomerLevel) {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      prices: { where: { level: { in: [level, "SHOP"] } } },
      inventory: true,
    },
    orderBy: { name: "asc" },
  });

  return products
    .filter((p) => p.sku !== "test-station")
    .filter(
      (p) =>
        p.visibleLevels.length === 0 || p.visibleLevels.includes(level),
    )
    .map((p) => {
      const account = p.prices.find((row) => row.level === level);
      const shop = p.prices.find((row) => row.level === "SHOP");
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        image: p.image,
        unitPrice: account?.unitPrice ?? shop?.unitPrice ?? 0,
        moq: account?.moq ?? shop?.moq ?? CASE_MOQ_PCS,
        stock: Math.max(
          0,
          (p.inventory?.quantity ?? 0) - (p.inventory?.reserved ?? 0),
        ),
      };
    });
}

export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export async function resolveCoupon(code: string, level: CustomerLevel, subtotal: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.active) return { error: "Invalid coupon" as const };
  if (coupon.startsAt && coupon.startsAt > new Date()) {
    return { error: "Coupon not active yet" as const };
  }
  if (coupon.endsAt && coupon.endsAt < new Date()) {
    return { error: "Coupon expired" as const };
  }
  if (!coupon.allowedLevels.includes(level)) {
    return { error: "Coupon not valid for your level" as const };
  }
  if (subtotal < coupon.minOrder) {
    return { error: `Minimum order $${coupon.minOrder}` as const };
  }

  const discount =
    coupon.type === "percent"
      ? roundMoney((subtotal * coupon.value) / 100)
      : roundMoney(Math.min(coupon.value, subtotal));

  return { coupon, discount };
}

export function nextSystemId() {
  return String(Math.floor(Math.random() * 9000 + 1000));
}

export function formatDocDate(date = new Date()) {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const mon = months[date.getUTCMonth()] || "JAN";
  return `${day}${mon}${date.getUTCFullYear()}`;
}

export function slugState(region?: string | null) {
  const raw = (region || "").trim().toUpperCase();
  if (!raw) return "";
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  return raw.replace(/[^A-Z0-9]+/g, "").slice(0, 8);
}

export function slugCompany(name: string) {
  const slug = (name || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 16);
  return slug || "CUSTOMER";
}

export function nextOrderNumber() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `UMX-${stamp}-${nextSystemId()}`;
}

export function nextPiNumber(opts: {
  companyName: string;
  region?: string | null;
  orderNumber: string;
  date?: Date;
}) {
  const systemId = opts.orderNumber.split("-").pop() || nextSystemId();
  const parts = [
    "PI",
    slugState(opts.region),
    slugCompany(opts.companyName),
    formatDocDate(opts.date),
    systemId,
  ].filter(Boolean);
  return parts.join("-");
}

export function siblingDocNumber(
  piNumber: string | null | undefined,
  prefix: "PI" | "CI" | "PL",
  orderNumber: string,
) {
  if (piNumber && piNumber.startsWith("PI-")) {
    return `${prefix}-${piNumber.slice(3)}`;
  }
  return `${prefix}-${orderNumber.replace(/^UMX-/, "")}`;
}

export const paymentLabels: Record<PaymentMethod, string> = {
  TT: "Telegraphic transfer (TT)",
  CHECK: "Check",
  ONLINE: "Online payment (gateway pending)",
  CREDIT: "Credit balance",
};
