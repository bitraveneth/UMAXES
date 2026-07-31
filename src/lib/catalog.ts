import type { CustomerLevel, PaymentMethod } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

export async function getCatalogForLevel(level: CustomerLevel) {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { visibleLevels: { isEmpty: true } },
        { visibleLevels: { has: level } },
      ],
    },
    include: {
      prices: { where: { level } },
      inventory: true,
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    image: p.image,
    unitPrice: p.prices[0]?.unitPrice ?? 0,
    moq: p.prices[0]?.moq ?? 1,
    stock: Math.max(0, (p.inventory?.quantity ?? 0) - (p.inventory?.reserved ?? 0)),
  }));
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

export function nextOrderNumber() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `UMX-${stamp}-${rand}`;
}

export function nextPiNumber(orderNumber: string) {
  return `PI-${orderNumber.replace("UMX-", "")}`;
}

export const paymentLabels: Record<PaymentMethod, string> = {
  TT: "Telegraphic transfer (TT)",
  CHECK: "Check",
  ONLINE: "Online payment (gateway pending)",
  CREDIT: "Credit balance",
};
