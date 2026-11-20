import type { CustomerLevel, PaymentMethod } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { CASE_MOQ_PCS } from "@/lib/pack";

export {
  companyInitials,
  docNumberBody,
  formatDocDate,
  nextOrderNumber,
  nextPiNumber,
  nextSystemId,
  parseDocNumber,
  siblingDocNumber,
  slugCompany,
  slugState,
} from "@/lib/doc-number";

/** Price tiers each buyer level is allowed to see on the storefront. */
export function priceLevelsVisibleTo(
  level: CustomerLevel,
): CustomerLevel[] {
  if (level === "DISTRO") return ["DISTRO", "WHOLESALER", "SHOP"];
  if (level === "WHOLESALER") return ["WHOLESALER", "SHOP"];
  return ["SHOP"];
}

export async function getCatalogForLevel(level: CustomerLevel) {
  const visiblePriceLevels = priceLevelsVisibleTo(level);
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      prices: { where: { level: { in: visiblePriceLevels } } },
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
      const wholesaler = p.prices.find((row) => row.level === "WHOLESALER");
      const shop = p.prices.find((row) => row.level === "SHOP");
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        image: p.image,
        unitPrice: account?.unitPrice ?? shop?.unitPrice ?? 0,
        wholesalerPrice: wholesaler?.unitPrice ?? 0,
        retailPrice: shop?.unitPrice ?? 0,
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

export const paymentLabels: Record<PaymentMethod, string> = {
  TT: "Telegraphic transfer (TT)",
  CHECK: "Check",
  ONLINE: "Online payment (gateway pending)",
  CREDIT: "Credit balance",
};
