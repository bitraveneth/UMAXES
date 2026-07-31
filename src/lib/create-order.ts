import type { PaymentMethod } from "@/generated/prisma/enums";
import {
  nextOrderNumber,
  nextPiNumber,
  resolveCoupon,
  roundMoney,
} from "@/lib/catalog";
import { prisma } from "@/lib/db";

export type CreateOrderLineInput = {
  sku?: string;
  flavorId?: string;
  quantity: number;
};

export type CreateOrderInput = {
  companyId: string;
  /** Customer user that owns the order (account notification target). */
  customerUserId: string;
  customerEmail?: string | null;
  addressId: string;
  paymentMethod: PaymentMethod;
  items: CreateOrderLineInput[];
  couponCode?: string;
  paymentRef?: string;
  notes?: string;
  /** When set, order was placed by staff on behalf of the company. */
  placedByStaffId?: string | null;
};

export type CreateOrderResult =
  | {
      ok: true;
      order: {
        id: string;
        orderNumber: string;
        piNumber: string | null;
        total: number;
        status: string;
        paymentMethod: PaymentMethod;
        items: unknown[];
      };
    }
  | { ok: false; status: number; error: string };

const METHODS: PaymentMethod[] = ["TT", "CHECK", "ONLINE", "CREDIT"];

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const paymentMethod = input.paymentMethod;
  if (!METHODS.includes(paymentMethod)) {
    return { ok: false, status: 400, error: "Invalid payment method" };
  }

  const lines = input.items || [];
  if (!lines.length) {
    return { ok: false, status: 400, error: "Cart is empty" };
  }

  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
  });
  if (!company || company.status !== "APPROVED") {
    return { ok: false, status: 403, error: "Company not approved" };
  }

  const address = await prisma.address.findFirst({
    where: { id: input.addressId, companyId: company.id },
  });
  if (!address) {
    return { ok: false, status: 400, error: "Select a valid shipping address" };
  }

  const skus = lines.map((l) => String(l.sku || l.flavorId || ""));
  const products = await prisma.product.findMany({
    where: { sku: { in: skus }, active: true },
    include: {
      prices: { where: { level: company.level } },
      inventory: true,
    },
  });
  const bySku = new Map(products.map((p) => [p.sku, p]));

  const orderItems: {
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    image: string | null;
  }[] = [];

  let subtotal = 0;

  for (const line of lines) {
    const sku = String(line.sku || line.flavorId || "");
    const quantity = Math.floor(Number(line.quantity) || 0);
    const product = bySku.get(sku);
    if (!product || quantity < 1) {
      return { ok: false, status: 400, error: `Invalid item: ${sku}` };
    }
    const price = product.prices[0];
    if (!price) {
      return {
        ok: false,
        status: 400,
        error: `No price for ${sku} at company level (${company.level})`,
      };
    }
    if (quantity < price.moq) {
      return {
        ok: false,
        status: 400,
        error: `${product.name} MOQ is ${price.moq}`,
      };
    }
    const available =
      (product.inventory?.quantity ?? 0) - (product.inventory?.reserved ?? 0);
    if (quantity > available) {
      return {
        ok: false,
        status: 400,
        error: `Insufficient stock for ${product.name}`,
      };
    }

    const unitPrice = price.unitPrice;
    subtotal = roundMoney(subtotal + unitPrice * quantity);
    orderItems.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity,
      unitPrice,
      image: product.image,
    });
  }

  let discount = 0;
  let couponId: string | null = null;
  let appliedCode: string | null = null;
  const couponCode = input.couponCode?.trim() || "";

  if (couponCode) {
    const resolved = await resolveCoupon(couponCode, company.level, subtotal);
    if ("error" in resolved && resolved.error) {
      return { ok: false, status: 400, error: resolved.error };
    }
    if ("coupon" in resolved && resolved.coupon) {
      discount = resolved.discount;
      couponId = resolved.coupon.id;
      appliedCode = resolved.coupon.code;
    }
  }

  const shipping = 0;
  const total = roundMoney(Math.max(0, subtotal - discount + shipping));

  if (paymentMethod === "CREDIT") {
    if (company.level === "SHOP") {
      return {
        ok: false,
        status: 400,
        error: "Retail accounts do not have trade credit",
      };
    }
    if (!company.paymentTermsDays || company.paymentTermsDays < 1) {
      return {
        ok: false,
        status: 400,
        error: "Credit terms are not enabled for this company",
      };
    }
    const availableCredit = roundMoney(company.creditLimit - company.creditUsed);
    if (total > availableCredit) {
      return {
        ok: false,
        status: 400,
        error: `Insufficient credit. Available: $${availableCredit.toFixed(2)}`,
      };
    }
  }

  const orderNumber = nextOrderNumber();
  const piNumber = nextPiNumber(orderNumber);
  const addressSnap = JSON.stringify({
    label: address.label,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    country: address.country,
  });

  const dueDate =
    paymentMethod === "CREDIT"
      ? new Date(Date.now() + company.paymentTermsDays * 24 * 60 * 60 * 1000)
      : null;

  const paymentRef = input.paymentRef?.trim() || null;
  const notes = input.notes?.trim() || null;
  const actorId = input.placedByStaffId || input.customerUserId;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        piNumber,
        userId: input.customerUserId,
        placedByStaffId: input.placedByStaffId || null,
        companyId: company.id,
        status: paymentMethod === "CREDIT" ? "CONFIRMED" : "PAYMENT_PENDING",
        paymentMethod,
        email: input.customerEmail ?? null,
        phone: null,
        addressSnap,
        subtotal,
        shipping,
        discount,
        total,
        couponId,
        couponCode: appliedCode,
        paymentRef,
        notes,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            image: item.image,
          })),
        },
        payments: {
          create: {
            method: paymentMethod,
            amount: total,
            reference: paymentRef,
            status: paymentMethod === "CREDIT" ? "on_terms" : "pending",
          },
        },
      },
      include: { items: true },
    });

    for (const item of orderItems) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { reserved: { increment: item.quantity } },
      });
    }

    if (paymentMethod === "CREDIT") {
      await tx.company.update({
        where: { id: company.id },
        data: { creditUsed: { increment: total } },
      });
      await tx.creditLedger.create({
        data: {
          companyId: company.id,
          orderId: created.id,
          type: "charge",
          amount: total,
          dueDate,
          note: `Order ${orderNumber}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: input.placedByStaffId ? "ORDER_CREATED_ON_BEHALF" : "ORDER_CREATED",
        entity: "Order",
        entityId: created.id,
        meta: JSON.stringify({
          orderNumber,
          total,
          paymentMethod,
          companyId: company.id,
          placedByStaffId: input.placedByStaffId || null,
        }),
      },
    });

    return created;
  });

  const { notifyOrderPlaced, notifyCreditLimitCrossed, notifyNeedsSupplierAssign } =
    await import("@/lib/notify");
  await notifyOrderPlaced({
    email: input.customerEmail,
    userId: input.customerUserId,
    orderNumber: order.orderNumber,
    piNumber: order.piNumber,
    total: order.total,
    companyName: company.name,
    paymentMethod,
    placedByStaff: Boolean(input.placedByStaffId),
    salesRepUserId: company.salesRepId,
  });

  if (paymentMethod === "CREDIT") {
    const usedAfter = company.creditUsed + total;
    if (company.creditLimit > 0 && usedAfter >= company.creditLimit) {
      await notifyCreditLimitCrossed({
        companyId: company.id,
        companyName: company.name,
        creditUsed: usedAfter,
        creditLimit: company.creditLimit,
        orderNumber: order.orderNumber,
        customerEmail: input.customerEmail,
        customerUserId: input.customerUserId,
      });
    }
    await notifyNeedsSupplierAssign({
      orderNumber: order.orderNumber,
      companyName: company.name,
      paymentMethod: "CREDIT",
    });
  }

  return { ok: true, order };
}
