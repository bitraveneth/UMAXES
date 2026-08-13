import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildInvoiceHtml } from "@/lib/invoice-html";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      company: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner =
    session.user.role === "CUSTOMER" &&
    session.user.companyId === order.companyId;
  const isStaff = ["SUPER_ADMIN", "ADMIN", "SALES"].includes(session.user.role);
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const docNumber = order.piNumber || order.orderNumber;
  const html = buildInvoiceHtml({
    type: "pi",
    orderNumber: order.orderNumber,
    docNumber,
    createdAt: order.createdAt,
    companyName: order.company.name,
    companyTaxId: order.company.taxId,
    clientName: order.user.name,
    clientEmail: order.email || order.user.email,
    clientPhone: order.phone || order.user.phone,
    addressSnap: order.addressSnap,
    paymentMethod: order.paymentMethod,
    couponCode: order.couponCode,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    showToolbar: true,
    forceDownloadHref: `/api/orders/${order.id}/docs?type=pi&download=1`,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${docNumber}.html"`,
    },
  });
}
