import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildInvoiceHtml, type InvoiceDocType } from "@/lib/invoice-html";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

async function loadOrder(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      company: true,
      user: { select: { name: true, email: true, phone: true } },
      shipments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { lines: true },
      },
    },
  });
  if (!order) return { error: "Not found" as const, status: 404 as const };

  const isOwner =
    session.user.role === "CUSTOMER" &&
    session.user.companyId === order.companyId;
  const isStaff = [
    "SUPER_ADMIN",
    "ADMIN",
    "SALES",
    "WAREHOUSE",
    "LOGISTICS",
  ].includes(session.user.role);
  if (!isOwner && !isStaff) {
    return { error: "Forbidden" as const, status: 403 as const };
  }

  return { order, role: session.user.role };
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await loadOrder(id);
  if ("error" in result && result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  const { order, role } = result;
  const url = new URL(request.url);
  const type = (url.searchParams.get("type") || "pi") as InvoiceDocType;
  const forceDownload = url.searchParams.get("download") === "1";

  if (role === "LOGISTICS" && type !== "packing") {
    return NextResponse.json(
      { error: "Logistics can only access packing lists" },
      { status: 403 },
    );
  }

  const filenames: Record<InvoiceDocType, string> = {
    pi: order.piNumber || order.orderNumber,
    packing: `PL-${order.orderNumber}`,
    invoice: `CI-${order.orderNumber}`,
  };

  const shipment = order.shipments[0];
  const packingMetaHtml =
    type === "packing"
      ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 18px">
  <div style="border:1px solid rgba(0,0,0,.08);padding:12px;border-radius:12px;background:#fff"><div class="muted" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase">Boxes</div><div style="font-size:18px;font-weight:800;margin-top:4px">${shipment?.boxCount ?? "—"}</div></div>
  <div style="border:1px solid rgba(0,0,0,.08);padding:12px;border-radius:12px;background:#fff"><div class="muted" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase">CBM</div><div style="font-size:18px;font-weight:800;margin-top:4px">${shipment?.cbm ?? "—"}</div></div>
  <div style="border:1px solid rgba(0,0,0,.08);padding:12px;border-radius:12px;background:#fff"><div class="muted" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase">Weight (kg)</div><div style="font-size:18px;font-weight:800;margin-top:4px">${shipment?.weightKg ?? "—"}</div></div>
</div>${
          shipment?.packingNote
            ? `<p style="margin:0 0 12px;font-size:13px"><strong>Packing note:</strong> ${shipment.packingNote}</p>`
            : ""
        }${
          shipment?.trackingNumber
            ? `<p style="margin:0 0 12px;font-size:13px"><strong>Tracking:</strong> ${shipment.carrier || "—"} · ${shipment.trackingNumber}</p>`
            : ""
        }`
      : "";

  const html = buildInvoiceHtml({
    type,
    orderNumber: order.orderNumber,
    docNumber: filenames[type],
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
    packingLines: shipment?.lines?.length ? shipment.lines : null,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    packingMetaHtml,
    forceDownloadHref: `?type=${type}&download=1`,
    showToolbar: true,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": forceDownload
        ? `attachment; filename="${filenames[type]}.html"`
        : `inline; filename="${filenames[type]}.html"`,
    },
  });
}
