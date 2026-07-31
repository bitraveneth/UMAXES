import { NextResponse } from "next/server";
import type { PaymentMethod } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { createOrder } from "@/lib/create-order";
import { prisma } from "@/lib/db";
import { canOrder } from "@/lib/rbac";
import { orderCompanyScopeForStaff } from "@/lib/sales-scope";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "CUSTOMER") {
    if (!session.user.companyId) {
      return NextResponse.json({ orders: [] });
    }
    const orders = await prisma.order.findMany({
      where: { companyId: session.user.companyId },
      include: { items: true, shipments: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ orders });
  }

  if (
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN" ||
    session.user.role === "SALES"
  ) {
    const orders = await prisma.order.findMany({
      where: orderCompanyScopeForStaff(session.user.role, session.user.id),
      include: { items: true, company: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ orders });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    !canOrder(
      session.user.status,
      session.user.role,
      session.user.companyRole,
    ) ||
    !session.user.companyId
  ) {
    return NextResponse.json(
      {
        error:
          session.user.companyRole === "FINANCE"
            ? "Finance users can view orders but cannot place them"
            : "Approved buyer account required to place orders",
      },
      { status: 403 },
    );
  }

  const body = await request.json();
  const result = await createOrder({
    companyId: session.user.companyId,
    customerUserId: session.user.id,
    customerEmail: session.user.email,
    addressId: String(body.addressId ?? ""),
    paymentMethod: String(body.paymentMethod ?? "").toUpperCase() as PaymentMethod,
    items: Array.isArray(body.items) ? body.items : [],
    couponCode: body.couponCode ? String(body.couponCode) : undefined,
    paymentRef: body.paymentRef ? String(body.paymentRef) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ order: result.order }, { status: 201 });
}
