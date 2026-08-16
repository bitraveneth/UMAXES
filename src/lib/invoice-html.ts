import { PUFF_OPTIONS } from "@/lib/assets";
import { paymentLabels } from "@/lib/catalog";

/** Seller (UMAXES) block on invoices — override via env when needed */
export function sellerCompany() {
  return {
    name: process.env.INVOICE_SELLER_NAME || "UMAXES",
    legalName:
      process.env.INVOICE_SELLER_LEGAL || "UMAXES Trading / HOOKAMAX",
    line1: process.env.INVOICE_SELLER_LINE1 || "Wholesale distribution",
    line2: process.env.INVOICE_SELLER_LINE2 || "",
    city: process.env.INVOICE_SELLER_CITY || "",
    region: process.env.INVOICE_SELLER_REGION || "",
    postalCode: process.env.INVOICE_SELLER_POSTAL || "",
    country: process.env.INVOICE_SELLER_COUNTRY || "United States",
    email: process.env.INVOICE_SELLER_EMAIL || "support@umaxes.com",
    phone: process.env.INVOICE_SELLER_PHONE || "",
  };
}

export type InvoiceAddress = {
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postalCode: string;
  country: string;
};

export function parseAddressSnap(snap: string): InvoiceAddress {
  return JSON.parse(snap) as InvoiceAddress;
}

export function formatAddressHtml(a: InvoiceAddress) {
  const cityLine = [a.city, a.region, a.postalCode].filter(Boolean).join(", ");
  return [
    a.label ? escapeHtml(a.label) : "",
    escapeHtml(a.line1),
    escapeHtml(cityLine),
    escapeHtml(a.country),
  ]
    .filter(Boolean)
    .join("<br/>");
}

export function formatSellerHtml() {
  const s = sellerCompany();
  const cityLine = [s.city, s.region, s.postalCode].filter(Boolean).join(", ");
  return [
    `<strong>${escapeHtml(s.legalName || s.name)}</strong>`,
    s.line1 ? escapeHtml(s.line1) : "",
    s.line2 ? escapeHtml(s.line2) : "",
    cityLine ? escapeHtml(cityLine) : "",
    s.country ? escapeHtml(s.country) : "",
    s.email ? escapeHtml(s.email) : "",
    s.phone ? escapeHtml(s.phone) : "",
  ]
    .filter(Boolean)
    .join("<br/>");
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Append 80K / 50K puffs to every invoice line name */
export function invoiceItemName(name: string) {
  const suffix = `${PUFF_OPTIONS.join(" / ")} puffs`;
  if (/50\s*k|80\s*k|puffs/i.test(name)) return name;
  return `${name} · ${suffix}`;
}

export type InvoiceDocType = "pi" | "packing" | "invoice";

type MoneyItem = {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type PackingLine = {
  sku: string;
  name: string;
  flavor?: string | null;
  size?: string | null;
  quantity: number;
  boxes?: number | null;
};

type BuildInvoiceHtmlInput = {
  type: InvoiceDocType;
  orderNumber: string;
  docNumber: string;
  createdAt: Date;
  companyName: string;
  companyTaxId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  addressSnap: string;
  paymentMethod?: keyof typeof paymentLabels;
  couponCode?: string | null;
  items: MoneyItem[];
  packingLines?: PackingLine[] | null;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total?: number;
  packingMetaHtml?: string;
  forceDownloadHref?: string;
  showToolbar?: boolean;
};

const titles: Record<InvoiceDocType, string> = {
  pi: "Proforma Invoice",
  packing: "Packing List",
  invoice: "Commercial Invoice",
};

export function buildInvoiceHtml(input: BuildInvoiceHtmlInput) {
  const showMoney = input.type !== "packing";
  const address = parseAddressSnap(input.addressSnap);
  const date = input.createdAt.toISOString().slice(0, 10);
  const showToolbar = input.showToolbar !== false;

  const moneyRows = input.items
    .map((item) => {
      const amount = (item.unitPrice * item.quantity).toFixed(2);
      return `<tr>
        <td class="sku">${escapeHtml(item.sku)}</td>
        <td>
          <div class="item-name">${escapeHtml(invoiceItemName(item.name))}</div>
        </td>
        <td class="num">${item.quantity}</td>
        <td class="num">$${item.unitPrice.toFixed(2)}</td>
        <td class="num">$${amount}</td>
      </tr>`;
    })
    .join("");

  const packingSource =
    input.packingLines && input.packingLines.length
      ? input.packingLines
      : input.items.map((i) => ({
          sku: i.sku,
          name: i.name,
          flavor: null as string | null,
          size: null as string | null,
          quantity: i.quantity,
          boxes: null as number | null,
        }));

  const packingRows = packingSource
    .map(
      (line) => `<tr>
        <td class="sku">${escapeHtml(line.sku)}</td>
        <td>
          <div class="item-name">${escapeHtml(invoiceItemName(line.name))}</div>
        </td>
        <td>${escapeHtml(line.flavor || "—")}</td>
        <td>${escapeHtml(line.size || "—")}</td>
        <td class="num">${line.quantity}</td>
        <td class="num">${line.boxes ?? "—"}</td>
      </tr>`,
    )
    .join("");

  const toolbar = showToolbar
    ? `<div class="toolbar no-print">
  <p><strong>${titles[input.type]}</strong> · ${escapeHtml(input.orderNumber)}</p>
  <div class="actions">
    <button type="button" class="primary" onclick="window.print()">Print</button>
    ${
      input.forceDownloadHref
        ? `<a href="${escapeHtml(input.forceDownloadHref)}">Download</a>`
        : ""
    }
  </div>
</div>`
    : "";

  const totals =
    showMoney && input.total != null
      ? `<div class="totals">
  <div><span>Subtotal</span><span>$${(input.subtotal ?? 0).toFixed(2)}</span></div>
  <div><span>Discount</span><span>−$${(input.discount ?? 0).toFixed(2)}</span></div>
  <div><span>Shipping</span><span>$${(input.shipping ?? 0).toFixed(2)}</span></div>
  <div class="grand"><span>Total</span><span>$${input.total.toFixed(2)}</span></div>
</div>`
      : `<p class="muted units">Total units: ${input.items.reduce((s, i) => s + i.quantity, 0)}</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(input.docNumber)}</title>
<style>
*{box-sizing:border-box}
body{
  margin:0;
  color:#111;
  background:#ece7dc;
  font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
}
.toolbar{
  position:sticky;top:0;z-index:10;
  display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;
  padding:12px 20px;background:#111;color:#fff;
}
.toolbar p{margin:0;font-size:13px;opacity:.9}
.toolbar .actions{display:flex;flex-wrap:wrap;gap:8px}
.toolbar a,.toolbar button{
  appearance:none;border:0;border-radius:999px;padding:10px 16px;
  font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;color:#111;background:#fff;
}
.toolbar .primary{background:#111;color:#fff}
.sheet{
  max-width:880px;margin:28px auto;padding:0;
  background:#fffef8;border:1px solid rgba(0,0,0,.08);
  box-shadow:0 18px 50px rgba(61,22,5,.1);
}
.hero{
  padding:28px 36px 24px;
  background:linear-gradient(135deg,#111 0%,#000 100%);
  color:#fff;
}
.hero-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
.brand{font-size:28px;font-weight:800;letter-spacing:-.03em;margin:0}
.doc-type{margin:6px 0 0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.9}
.meta-box{text-align:right;font-size:13px;line-height:1.55}
.meta-box strong{display:block;font-size:16px;margin-bottom:2px}
.body{padding:28px 36px 36px}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:22px}
.party{
  border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:16px 18px;background:#fff;
}
.party h3{
  margin:0 0 10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#666;font-weight:700;
}
.party p{margin:0;font-size:13.5px;line-height:1.55;color:#111}
.facts{display:flex;flex-wrap:wrap;gap:10px 18px;margin:0 0 18px;font-size:13px;color:#444}
.facts strong{color:#111}
table{width:100%;border-collapse:collapse;margin-top:8px}
th,td{padding:12px 10px;text-align:left;font-size:13.5px;vertical-align:top}
th{
  background:#f5ebd0;border-bottom:2px solid rgba(0,0,0,.08);
  font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#3d1605;
}
td{border-bottom:1px solid rgba(0,0,0,.07)}
.sku{color:#666;font-size:12px;white-space:nowrap}
.item-name{font-weight:650;color:#111;line-height:1.35}
.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.totals{
  margin:22px 0 0 auto;width:min(100%,300px);
  border:1px solid rgba(0,0,0,.08);border-radius:14px;overflow:hidden;background:#fff;
}
.totals div{display:flex;justify-content:space-between;padding:10px 14px;font-size:13.5px;border-bottom:1px solid rgba(0,0,0,.06)}
.totals .grand{background:#111;color:#fff;font-weight:800;font-size:15px;border:0}
.units{margin-top:20px}
.footer-note{
  margin:32px 0 0;
  padding:16px 20px;
  text-align:center;
  border:1px solid rgba(255,91,4,.22);
  border-radius:12px;
  background:linear-gradient(180deg,rgba(255,91,4,.08),rgba(255,91,4,.03));
  font-size:12.5px;
  font-weight:650;
  letter-spacing:.02em;
  color:#3d1605;
  line-height:1.55;
}
.footer-note span{
  display:block;
  margin-bottom:4px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:#111;
}
.muted{color:#666}
@media (max-width:720px){
  .hero,.body{padding:22px 18px}
  .parties{grid-template-columns:1fr}
  .hero-top{flex-direction:column}
  .meta-box{text-align:left}
}
@media print{
  body{background:#fff}
  .toolbar{display:none!important}
  .sheet{margin:0;border:0;box-shadow:none;max-width:none}
}
</style>
</head>
<body>
${toolbar}
<div class="sheet">
  <div class="hero">
    <div class="hero-top">
      <div>
        <p class="brand">${escapeHtml(sellerCompany().name)}</p>
        <p class="doc-type">${titles[input.type]}</p>
      </div>
      <div class="meta-box">
        <strong>${escapeHtml(input.docNumber)}</strong>
        Order ${escapeHtml(input.orderNumber)}<br/>
        Date ${date}
      </div>
    </div>
  </div>

  <div class="body">
    <div class="parties">
      <div class="party">
        <h3>From</h3>
        <p>${formatSellerHtml()}</p>
      </div>
      <div class="party">
        <h3>Bill / Ship to</h3>
        <p>
          <strong>${escapeHtml(input.companyName)}</strong><br/>
          ${
            input.clientName
              ? `Attn: ${escapeHtml(input.clientName)}<br/>`
              : ""
          }
          ${
            input.clientPhone
              ? `Phone: ${escapeHtml(input.clientPhone)}<br/>`
              : ""
          }
          ${
            input.clientEmail
              ? `Email: ${escapeHtml(input.clientEmail)}<br/>`
              : ""
          }
          ${
            input.companyTaxId
              ? `Tax ID: ${escapeHtml(input.companyTaxId)}<br/>`
              : ""
          }
          ${formatAddressHtml(address)}
        </p>
      </div>
    </div>

    <div class="facts">
      ${
        showMoney && input.paymentMethod
          ? `<span><strong>Payment</strong> · ${escapeHtml(paymentLabels[input.paymentMethod])}</span>`
          : ""
      }
      ${
        input.couponCode
          ? `<span><strong>Coupon</strong> · ${escapeHtml(input.couponCode)}</span>`
          : ""
      }
    </div>

    ${input.packingMetaHtml || ""}

    <table>
      <thead>
        <tr>
          ${
            showMoney
              ? `<th>SKU</th><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Amount</th>`
              : `<th>SKU</th><th>Item</th><th>Flavor</th><th>Size</th><th class="num">Qty</th><th class="num">Boxes</th>`
          }
        </tr>
      </thead>
      <tbody>${showMoney ? moneyRows : packingRows}</tbody>
    </table>

    ${totals}

    <p class="footer-note">
      <span>Age-restricted product</span>
      Adults 21+ only. Nicotine is an addictive chemical.
    </p>
  </div>
</div>
</body>
</html>`;
}
