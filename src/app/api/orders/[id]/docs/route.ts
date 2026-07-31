import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { paymentLabels } from "@/lib/catalog";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };
type DocType = "pi" | "packing" | "invoice";

async function loadOrder(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" as const, status: 401 as const };

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      company: true,
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
  const isStaff = ["SUPER_ADMIN", "ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"].includes(
    session.user.role,
  );
  if (!isOwner && !isStaff) {
    return { error: "Forbidden" as const, status: 403 as const };
  }

  return { order, role: session.user.role };
}

function addressBlock(snap: string) {
  const a = JSON.parse(snap) as {
    label?: string | null;
    line1: string;
    line2?: string | null;
    city: string;
    region?: string | null;
    postalCode: string;
    country: string;
  };
  return `${a.label ? a.label + "<br/>" : ""}${a.line1}<br/>${
    a.line2 ? a.line2 + "<br/>" : ""
  }${a.city}${a.region ? `, ${a.region}` : ""} ${a.postalCode}<br/>${a.country}`;
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await loadOrder(id);
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { order, role } = result;
  const url = new URL(request.url);
  const type = (url.searchParams.get("type") || "pi") as DocType;
  const forceDownload = url.searchParams.get("download") === "1";

  if (role === "LOGISTICS" && type !== "packing") {
    return NextResponse.json(
      { error: "Logistics can only access packing lists" },
      { status: 403 },
    );
  }

  const titles: Record<DocType, string> = {
    pi: "Proforma Invoice",
    packing: "Packing List",
    invoice: "Commercial Invoice",
  };
  const filenames: Record<DocType, string> = {
    pi: order.piNumber || order.orderNumber,
    packing: `PL-${order.orderNumber}`,
    invoice: `CI-${order.orderNumber}`,
  };

  const showMoney = type !== "packing";
  const shipment = order.shipments[0];
  const packingLines = shipment?.lines?.length ? shipment.lines : null;

  const rows = showMoney
    ? order.items
        .map((item) => {
          const amount = (item.unitPrice * item.quantity).toFixed(2);
          return `<tr>
        <td>${item.sku}</td>
        <td>${item.name}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">$${item.unitPrice.toFixed(2)}</td>
        <td style="text-align:right">$${amount}</td>
      </tr>`;
        })
        .join("")
    : packingLines
      ? packingLines
          .map(
            (line) => `<tr>
        <td>${line.sku}</td>
        <td>${line.name}</td>
        <td>${line.flavor || "—"}</td>
        <td>${line.size || "—"}</td>
        <td style="text-align:right">${line.quantity}</td>
        <td style="text-align:right">${line.boxes ?? "—"}</td>
      </tr>`,
          )
          .join("")
      : order.items
          .map(
            (item) => `<tr>
        <td>${item.sku}</td>
        <td>${item.name}</td>
        <td>—</td>
        <td>—</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">—</td>
      </tr>`,
          )
          .join("");

  const downloadHref = `?type=${type}&download=1`;
  const packingMeta =
    type === "packing"
      ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px">
  <div style="border:1px solid #eee;padding:10px;border-radius:8px"><div class="muted" style="font-size:12px">Boxes</div><div style="font-size:18px;font-weight:700">${shipment?.boxCount ?? "—"}</div></div>
  <div style="border:1px solid #eee;padding:10px;border-radius:8px"><div class="muted" style="font-size:12px">CBM</div><div style="font-size:18px;font-weight:700">${shipment?.cbm ?? "—"}</div></div>
  <div style="border:1px solid #eee;padding:10px;border-radius:8px"><div class="muted" style="font-size:12px">Weight (kg)</div><div style="font-size:18px;font-weight:700">${shipment?.weightKg ?? "—"}</div></div>
</div>${
          shipment?.packingNote
            ? `<p style="margin-top:12px"><strong>Packing note:</strong> ${shipment.packingNote}</p>`
            : ""
        }${
          shipment?.trackingNumber
            ? `<p style="margin-top:8px"><strong>Tracking:</strong> ${shipment.carrier || "—"} · ${shipment.trackingNumber}</p>`
            : ""
        }`
      : "";

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${filenames[type]}</title>
<style>
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#111;background:#f5f5f5}
.toolbar{position:sticky;top:0;z-index:10;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;padding:12px 20px;background:#111;color:#fff}
.toolbar p{margin:0;font-size:14px;opacity:.9}
.toolbar .actions{display:flex;flex-wrap:wrap;gap:8px}
.toolbar a,.toolbar button{appearance:none;border:0;border-radius:8px;padding:10px 14px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;color:#111;background:#fff}
.toolbar .primary{background:#FF5B04;color:#fff}
.sheet{max-width:860px;margin:24px auto;padding:40px;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.08)}
h1{color:#FF5B04;margin:0}
table{width:100%;border-collapse:collapse;margin-top:24px}
th,td{border-bottom:1px solid #ddd;padding:10px 8px;text-align:left;font-size:14px}
th{background:#fdf6e3}
.muted{color:#666}.totals{margin-top:20px;width:280px;margin-left:auto}
.totals div{display:flex;justify-content:space-between;padding:4px 0}.strong{font-weight:700}
@media print{
  body{background:#fff}
  .toolbar{display:none!important}
  .sheet{margin:0;padding:0;box-shadow:none;max-width:none}
}
</style></head><body>
<div class="toolbar no-print">
  <p><strong>${titles[type]}</strong> · ${order.orderNumber}</p>
  <div class="actions">
    <button type="button" class="primary" onclick="window.print()">Print</button>
    <a href="${downloadHref}">Download</a>
  </div>
</div>
<div class="sheet">
<h1>UMAXES</h1>
<p class="muted">${titles[type]}</p>
<p><strong>${filenames[type]}</strong> · Order ${order.orderNumber}</p>
<p class="muted">Date: ${order.createdAt.toISOString().slice(0, 10)}</p>
<h3>Ship to</h3>
<p>${order.company.name}<br/>${addressBlock(order.addressSnap)}</p>
${showMoney ? `<p><strong>Payment:</strong> ${paymentLabels[order.paymentMethod]}</p>` : ""}
${packingMeta}
<table><thead><tr>
${
  showMoney
    ? `<th>SKU</th><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Amount</th>`
    : `<th>SKU</th><th>Item</th><th>Flavor</th><th>Size</th><th style="text-align:right">Qty</th><th style="text-align:right">Boxes</th>`
}
</tr></thead><tbody>${rows}</tbody></table>
${
  showMoney
    ? `<div class="totals">
<div><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
<div><span>Discount</span><span>-$${order.discount.toFixed(2)}</span></div>
<div class="strong"><span>Total</span><span>$${order.total.toFixed(2)}</span></div>
</div>`
    : `<p class="muted" style="margin-top:24px">Total units: ${order.items.reduce((s, i) => s + i.quantity, 0)}</p>`
}
<p class="muted" style="margin-top:40px">Adults 21+ only. Nicotine is an addictive chemical.</p>
</div>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": forceDownload
        ? `attachment; filename="${filenames[type]}.html"`
        : `inline; filename="${filenames[type]}.html"`,
    },
  });
}
