import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canOrder } from "@/lib/rbac";
import type { RmaReasonType } from "@/generated/prisma/enums";

function nextRmaNumber() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `RMA-${stamp}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

const REASON_TYPES = new Set(["RETURN", "DAMAGE", "DEFECT", "OTHER"]);

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "CUSTOMER") {
    if (!session.user.companyId) return NextResponse.json({ rmas: [] });
    const rmas = await prisma.rma.findMany({
      where: { companyId: session.user.companyId },
      include: { items: true, order: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ rmas });
  }

  if (["SUPER_ADMIN", "ADMIN", "SALES"].includes(session.user.role)) {
    const rmas = await prisma.rma.findMany({
      include: { items: true, order: true, company: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ rmas });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (
    !session?.user ||
    !canOrder(session.user.status, session.user.role, session.user.companyRole) ||
    !session.user.companyId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const orderId = String(body.orderId ?? "");
  const reason = String(body.reason ?? "").trim();
  const reasonTypeRaw = String(body.reasonType ?? "RETURN").toUpperCase();
  const reasonType = (
    REASON_TYPES.has(reasonTypeRaw) ? reasonTypeRaw : "RETURN"
  ) as RmaReasonType;
  const items = Array.isArray(body.items) ? body.items : [];
  const replacementNeeded = Boolean(body.replacementNeeded);

  if (!orderId || !reason || !items.length) {
    return NextResponse.json(
      { error: "orderId, reason, and items are required" },
      { status: 400 },
    );
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId: session.user.companyId },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const lineCreates = items
    .map(
      (item: {
        orderItemId?: string;
        sku?: string;
        name?: string;
        quantity?: number;
        flavor?: string;
        optionsLabel?: string;
      }) => {
        const line =
          (item.orderItemId
            ? order.items.find((i) => i.id === item.orderItemId)
            : null) ||
          order.items.find((i) => i.sku === item.sku);
        if (!line) return null;
        const qty = Math.min(
          line.quantity,
          Math.max(1, Math.floor(Number(item.quantity) || 1)),
        );
        return {
          orderItemId: line.id,
          productId: line.productId,
          sku: line.sku,
          name: item.name || line.name,
          flavor: item.flavor || line.name,
          optionsLabel: item.optionsLabel || null,
          quantity: qty,
          unitPrice: line.unitPrice,
          image: line.image,
        };
      },
    )
    .filter(Boolean) as {
    orderItemId: string;
    productId: string | null;
    sku: string;
    name: string;
    flavor: string;
    optionsLabel: string | null;
    quantity: number;
    unitPrice: number;
    image: string | null;
  }[];

  if (!lineCreates.length) {
    return NextResponse.json(
      { error: "No valid order lines selected" },
      { status: 400 },
    );
  }

  const rma = await prisma.rma.create({
    data: {
      rmaNumber: nextRmaNumber(),
      orderId: order.id,
      companyId: session.user.companyId,
      userId: session.user.id,
      reason,
      reasonType,
      status: "REQUESTED",
      resolution: replacementNeeded ? "REPLACEMENT" : "PENDING",
      replacementNeeded,
      addressSnap: order.addressSnap,
      items: { create: lineCreates },
    },
    include: { items: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "RMA_REQUESTED",
      entity: "Rma",
      entityId: rma.id,
      meta: JSON.stringify({
        rmaNumber: rma.rmaNumber,
        orderId,
        reasonType,
        itemCount: lineCreates.length,
        replacementNeeded,
      }),
    },
  });

  return NextResponse.json({ rma }, { status: 201 });
}
