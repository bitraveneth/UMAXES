import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { paymentLabels } from "@/lib/catalog";
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
    include: { items: true, company: true },
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

  const address = JSON.parse(order.addressSnap) as {
    label?: string | null;
    line1: string;
    line2?: string | null;
    city: string;
    region?: string | null;
    postalCode: string;
    country: string;
  };

  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td>${item.sku}</td>
        <td>${item.name}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">$${item.unitPrice.toFixed(2)}</td>
        <td style="text-align:right">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${order.piNumber || order.orderNumber}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 40px; }
    h1 { color: #FF5B04; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #ddd; padding: 10px 8px; text-align: left; font-size: 14px; }
    th { background: #fdf6e3; }
    .muted { color: #666; }
    .totals { margin-top: 20px; width: 280px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .strong { font-weight: 700; font-size: 16px; }
  </style>
</head>
<body>
  <h1>UMAXES</h1>
  <p class="muted">Proforma Invoice</p>
  <p><strong>${order.piNumber}</strong> · Order ${order.orderNumber}</p>
  <p class="muted">Date: ${order.createdAt.toISOString().slice(0, 10)}</p>

  <h3>Bill / Ship to</h3>
  <p>
    ${order.company.name}<br/>
    ${address.label ? `${address.label}<br/>` : ""}
    ${address.line1}<br/>
    ${address.line2 ? `${address.line2}<br/>` : ""}
    ${address.city}${address.region ? `, ${address.region}` : ""} ${address.postalCode}<br/>
    ${address.country}
  </p>

  <p><strong>Payment:</strong> ${paymentLabels[order.paymentMethod]}</p>
  ${order.couponCode ? `<p><strong>Coupon:</strong> ${order.couponCode}</p>` : ""}

  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Item</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Unit</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
    <div><span>Discount</span><span>-$${order.discount.toFixed(2)}</span></div>
    <div><span>Shipping</span><span>$${order.shipping.toFixed(2)}</span></div>
    <div class="strong"><span>Total</span><span>$${order.total.toFixed(2)}</span></div>
  </div>

  <p class="muted" style="margin-top:40px">This is a proforma invoice for wholesale ordering. Adults 21+ only.</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${order.piNumber || order.orderNumber}.html"`,
    },
  });
}
