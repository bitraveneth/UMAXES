import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canOrder } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

/** Returns line items for quick reorder into the client cart */
export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canOrder(session.user.status, session.user.role, session.user.companyRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, companyId: session.user.companyId || undefined },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    items: order.items.map((i) => ({
      flavorId: i.sku,
      sku: i.sku,
      name: i.name,
      quantity: i.quantity,
      image: i.image,
    })),
  });
}
