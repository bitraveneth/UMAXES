import type { PaymentMethod } from "@/generated/prisma/enums";
import {
  nextOrderNumber,
  nextPiNumber,
  nextSystemId,
  resolveCoupon,
  roundMoney,
} from "@/lib/catalog";
import { prisma } from "@/lib/db";
import {
  isWholeCases,
  minOrderPcsForLevel,
  sellsByCase,
} from "@/lib/pack";
import {
  TEST_STATION_NAME,
  TEST_STATION_SKU,
  applyWalletInTx,
  companyIsFirstOrder,
  ensureTestStationProduct,
  firstOrderUnpaidPcs,
  getPolicyForLevel,
  grantsTestStations,
  isPolicyLive,
  testStationQty,
} from "@/lib/rebate";

export type CreateOrderLineInput = {
  sku?: string;
  flavorId?: string;
  quantity: number;
  /** e.g. "80K" / "50K" — stored on the line name for ops */
  optionsLabel?: string;
};

export type CreateOrderInput = {
  companyId: string;
  /** Customer user that owns the order (account notification target). */
  customerUserId: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
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

  const customerUser = await prisma.user.findUnique({
    where: { id: input.customerUserId },
    select: { email: true, phone: true, name: true },
  });
  const orderEmail =
    input.customerEmail?.trim() || customerUser?.email || null;

  const address = await prisma.address.findFirst({
    where: { id: input.addressId, companyId: company.id },
  });
  if (!address) {
    return { ok: false, status: 400, error: "Select a valid shipping address" };
  }
  const orderPhone =
    address.phone?.trim() ||
    input.customerPhone?.trim() ||
    customerUser?.phone ||
    null;

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
    const minPcs = minOrderPcsForLevel(company.level, sku, price.moq);
    if (sellsByCase(company.level, sku)) {
      // Distro / Wholesaler: whole cases only.
      if (quantity < minPcs || !isWholeCases(quantity)) {
        return {
          ok: false,
          status: 400,
          error: `${product.name} is sold by the case (${minPcs} pcs / case)`,
        };
      }
    } else if (quantity < minPcs) {
      // SHOP (and non-case SKUs): MOQ in pieces.
      return {
        ok: false,
        status: 400,
        error: `${product.name} MOQ is ${minPcs} pcs`,
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
    const optionsLabel = String(line.optionsLabel || "").trim();
    orderItems.push({
      productId: product.id,
      sku: product.sku,
      name: optionsLabel ? `${product.name} · ${optionsLabel}` : product.name,
      quantity,
      unitPrice,
      image: product.image,
    });
  }

  const sellingQty = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const policy = await getPolicyForLevel(company.level);
  const channelOn = isPolicyLive(policy);
  const isFirstOrder = channelOn
    ? await companyIsFirstOrder(company.id)
    : false;

  let stations = 0;
  let unpaidPcs = 0;
  let firstOrderDiscount = 0;
  let rebateApplied = 0;

  if (grantsTestStations(policy) && policy) {
    stations = testStationQty(
      sellingQty,
      policy.pcsPerCase,
      policy.testStationsPerCase,
    );
  }

  if (channelOn && policy) {
    unpaidPcs = firstOrderUnpaidPcs(sellingQty, policy, isFirstOrder);
    const avgUnit =
      sellingQty > 0 ? subtotal / sellingQty : policy.unitPrice || 0;
    firstOrderDiscount = roundMoney(unpaidPcs * avgUnit);
  }

  if (stations > 0) {
    const station = await ensureTestStationProduct();
    const stationInv = await prisma.inventory.findUnique({
      where: { productId: station.id },
    });
    const stationAvailable =
      (stationInv?.quantity ?? 0) - (stationInv?.reserved ?? 0);
    if (stations > stationAvailable) {
      return {
        ok: false,
        status: 400,
        error: `Insufficient stock for ${TEST_STATION_NAME} (${stations} needed)`,
      };
    }
    orderItems.push({
      productId: station.id,
      sku: TEST_STATION_SKU,
      name: TEST_STATION_NAME,
      quantity: stations,
      unitPrice: 0,
      image: station.image,
    });
  }

  let discount = firstOrderDiscount;
  let couponId: string | null = null;
  let appliedCode: string | null = null;
  const couponCode = channelOn ? "" : input.couponCode?.trim() || "";

  if (couponCode) {
    const resolved = await resolveCoupon(couponCode, company.level, subtotal);
    if ("error" in resolved && resolved.error) {
      return { ok: false, status: 400, error: resolved.error };
    }
    if ("coupon" in resolved && resolved.coupon) {
      discount = roundMoney(discount + resolved.discount);
      couponId = resolved.coupon.id;
      appliedCode = resolved.coupon.code;
    }
  }

  const shipping = 0;
  let afterDiscount = roundMoney(Math.max(0, subtotal - discount + shipping));
  if (channelOn && !isFirstOrder && company.rebateBalanceUsd > 0) {
    rebateApplied = roundMoney(
      Math.min(company.rebateBalanceUsd, afterDiscount),
    );
    afterDiscount = roundMoney(afterDiscount - rebateApplied);
  }
  const total = afterDiscount;
  const chargedQty = Math.max(0, sellingQty - unpaidPcs);
  discount = roundMoney(discount + rebateApplied);

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
        error: "Insufficient credit. Contact your sales rep.",
      };
    }
  }

  const partyName = company.name;
  const partyContact = address.recipientName || customerUser?.name;
  let orderNumber = nextOrderNumber({
    companyName: partyName,
    customerName: partyContact,
  });
  for (let attempt = 0; attempt < 8; attempt++) {
    const taken = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });
    if (!taken) break;
    orderNumber = nextOrderNumber({
      companyName: partyName,
      customerName: partyContact,
      seq: nextSystemId(),
    });
  }
  let piNumber = nextPiNumber({
    companyName: partyName,
    customerName: partyContact,
    region: address.region,
    orderNumber,
  });
  for (let attempt = 0; attempt < 8; attempt++) {
    const taken = await prisma.order.findUnique({
      where: { piNumber },
      select: { id: true },
    });
    if (!taken) break;
    piNumber = `${nextPiNumber({
      companyName: partyName,
      customerName: partyContact,
      region: address.region,
    })}-${nextSystemId()}`;
  }
  const addressSnap = JSON.stringify({
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
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
        email: orderEmail,
        phone: orderPhone,
        addressSnap,
        subtotal,
        shipping,
        discount,
        total,
        couponId,
        couponCode: appliedCode,
        paymentRef,
        notes,
        sellingQty,
        chargedQty,
        testStationQty: stations,
        firstOrderUnpaidPcs: unpaidPcs,
        rebateAppliedUsd: rebateApplied,
        isFirstOrder,
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
      if (item.sku === TEST_STATION_SKU) {
        await tx.inventory.upsert({
          where: { productId: item.productId },
          create: {
            productId: item.productId,
            quantity: 0,
            reserved: 0,
          },
          update: { quantity: { decrement: item.quantity } },
        });
        continue;
      }
      await tx.inventory.upsert({
        where: { productId: item.productId },
        create: {
          productId: item.productId,
          quantity: 0,
          reserved: item.quantity,
        },
        update: { reserved: { increment: item.quantity } },
      });
    }

    if (isFirstOrder) {
      await tx.company.update({
        where: { id: company.id },
        data: { firstOrderId: created.id },
      });
    }

    if (rebateApplied > 0) {
      await applyWalletInTx(tx, company.id, created.id, rebateApplied);
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
          isFirstOrder,
          testStationQty: stations,
          firstOrderUnpaidPcs: unpaidPcs,
          rebateAppliedUsd: rebateApplied,
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

/** True if cancel/manual restore already ran for this order (blocks double restore). */
export async function orderStockAlreadyRestored(orderId: string) {
  const marker = await prisma.auditLog.findFirst({
    where: {
      action: "ORDER_STOCK_RESTORED",
      entity: "Order",
      entityId: orderId,
    },
    select: { id: true },
  });
  if (marker) return true;

  const adjusts = await prisma.auditLog.findMany({
    where: {
      action: "INVENTORY_ADJUST",
      meta: { contains: orderId },
    },
    select: { meta: true },
    take: 40,
  });
  for (const row of adjusts) {
    if (!row.meta) continue;
    try {
      const meta = JSON.parse(row.meta) as {
        reason?: string;
        orderId?: string;
      };
      if (
        meta.orderId === orderId &&
        (meta.reason === "ORDER_CANCELLED" ||
          meta.reason === "ORDER_CANCELLED_RESTORE")
      ) {
        return true;
      }
    } catch {
      /* ignore bad meta */
    }
  }
  return false;
}

/**
 * Reverse inventory taken/held when an order was created:
 * - test-station: add `quantity` back (create deducted it)
 * - normal SKUs: release `reserved`; if no hold exists (seed/legacy), add the
 *   shortfall back onto `quantity` so available stock still rises by the line qty
 * Always writes INVENTORY_ADJUST so Warehouse → Stock activity shows the restore.
 * Call only on first transition into CANCELLED, or via manual Restore stock.
 *
 * Product/inventory lookups run outside the transaction so multi-line orders
 * don't hit Prisma's default 5s interactive-transaction timeout on slower DBs.
 */
export async function releaseOrderInventoryHold(
  orderId: string,
  opts?: {
    actorUserId?: string | null;
    orderNumber?: string | null;
    source?: "cancel" | "manual";
  },
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      items: {
        select: {
          productId: true,
          sku: true,
          name: true,
          quantity: true,
        },
      },
    },
  });
  if (!order?.items.length) return;

  const orderNumber = opts?.orderNumber || order.orderNumber;
  const actorUserId = opts?.actorUserId || null;
  const source = opts?.source === "manual" ? "manual" : "cancel";
  const reason =
    source === "manual" ? "ORDER_CANCELLED_RESTORE" : "ORDER_CANCELLED";
  const nameSuffix =
    source === "manual" ? `restore ${orderNumber}` : `cancel ${orderNumber}`;

  const productIds = [
    ...new Set(
      order.items
        .map((i) => i.productId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const skusNeedingLookup = [
    ...new Set(
      order.items.filter((i) => !i.productId && i.sku).map((i) => i.sku),
    ),
  ];

  const [productsById, productsBySku] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, sku: true },
        })
      : Promise.resolve([]),
    skusNeedingLookup.length
      ? prisma.product.findMany({
          where: { sku: { in: skusNeedingLookup } },
          select: { id: true, name: true, sku: true },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(productsById.map((p) => [p.id, p]));
  const skuMap = new Map(productsBySku.map((p) => [p.sku, p]));

  type Line = {
    productId: string;
    productName: string;
    productSku: string;
    qty: number;
    isTestStation: boolean;
  };

  const merged = new Map<string, Line>();
  for (const item of order.items) {
    const qty = Math.max(0, Math.floor(item.quantity || 0));
    if (!qty) continue;

    let productId = item.productId;
    let productName = item.name;
    let productSku = item.sku;

    if (!productId) {
      const product = skuMap.get(item.sku);
      if (!product) continue;
      productId = product.id;
      productName = product.name;
      productSku = product.sku;
    } else {
      const product = productMap.get(productId);
      if (product) {
        productName = product.name;
        productSku = product.sku;
      }
    }

    const isTestStation =
      item.sku === TEST_STATION_SKU || productSku === TEST_STATION_SKU;
    const prev = merged.get(productId);
    if (prev) {
      prev.qty += qty;
    } else {
      merged.set(productId, {
        productId,
        productName,
        productSku,
        qty,
        isTestStation,
      });
    }
  }

  const resolvedIds = [...merged.keys()];
  if (!resolvedIds.length) return;

  const inventories = await prisma.inventory.findMany({
    where: { productId: { in: resolvedIds } },
    select: { productId: true, quantity: true, reserved: true },
  });
  const invMap = new Map(
    inventories.map((row) => [
      row.productId,
      { quantity: row.quantity, reserved: row.reserved },
    ]),
  );

  type Step = {
    productId: string;
    productName: string;
    productSku: string;
    createQty: number;
    createReserved: number;
    nextOnHand: number;
    nextReserved: number;
    prevAvailable: number;
    nextAvailable: number;
    previousReserved: number;
    onHandBefore: number;
  };

  const steps: Step[] = [];
  for (const line of merged.values()) {
    const inv = invMap.get(line.productId);
    const onHand = inv?.quantity ?? 0;
    const reserved = inv?.reserved ?? 0;
    const prevAvailable = Math.max(0, onHand - reserved);

    if (line.isTestStation) {
      const nextQty = onHand + line.qty;
      steps.push({
        productId: line.productId,
        productName: line.productName,
        productSku: line.productSku,
        createQty: line.qty,
        createReserved: 0,
        nextOnHand: nextQty,
        nextReserved: 0,
        prevAvailable: onHand,
        nextAvailable: nextQty,
        previousReserved: reserved,
        onHandBefore: onHand,
      });
      invMap.set(line.productId, { quantity: nextQty, reserved: 0 });
      continue;
    }

    const releasedFromReserved = Math.min(line.qty, reserved);
    const shortfall = line.qty - releasedFromReserved;
    const nextReserved = reserved - releasedFromReserved;
    const nextOnHand = onHand + shortfall;
    const nextAvailable = Math.max(0, nextOnHand - nextReserved);

    steps.push({
      productId: line.productId,
      productName: line.productName,
      productSku: line.productSku,
      createQty: shortfall,
      createReserved: 0,
      nextOnHand,
      nextReserved,
      prevAvailable,
      nextAvailable,
      previousReserved: reserved,
      onHandBefore: onHand,
    });
    invMap.set(line.productId, {
      quantity: nextOnHand,
      reserved: nextReserved,
    });
  }

  await prisma.$transaction(
    async (tx) => {
      for (const step of steps) {
        await tx.inventory.upsert({
          where: { productId: step.productId },
          create: {
            productId: step.productId,
            quantity: step.createQty,
            reserved: step.createReserved,
          },
          update: {
            quantity: step.nextOnHand,
            reserved: step.nextReserved,
          },
        });
        await tx.auditLog.create({
          data: {
            userId: actorUserId,
            action: "INVENTORY_ADJUST",
            entity: "Product",
            entityId: step.productId,
            meta: JSON.stringify({
              sku: step.productSku,
              name: `${step.productName} · ${nameSuffix}`,
              previousQuantity: step.prevAvailable,
              quantity: step.nextAvailable,
              previousReserved: step.previousReserved,
              reserved: step.nextReserved,
              onHandBefore: step.onHandBefore,
              onHandAfter: step.nextOnHand,
              reason,
              orderId,
              orderNumber,
              source,
            }),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "ORDER_STOCK_RESTORED",
          entity: "Order",
          entityId: orderId,
          meta: JSON.stringify({ orderNumber, source }),
        },
      });
    },
    { timeout: 30000, maxWait: 10000 },
  );
}
