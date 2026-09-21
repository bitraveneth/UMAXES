import { logos, PUFF_OPTIONS } from "@/lib/assets";
import {
  DEFAULT_INVOICE_BANK,
  type InvoiceBankDetails,
} from "@/lib/bank-accounts";
import { paymentLabels } from "@/lib/catalog";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

/** Seller (UMAXES) block on invoices — override via env when needed */
export function sellerCompany() {
  return {
    name: process.env.INVOICE_SELLER_NAME || "Umaxes Limited",
    legalName: process.env.INVOICE_SELLER_LEGAL || "Umaxes Limited",
    line1:
      process.env.INVOICE_SELLER_LINE1 ||
      "RM 59, 3/F, YAU LEE CENTRE, 45 HOI YUEN ROAD, KWUN TONG, HONG KONG",
    line2: process.env.INVOICE_SELLER_LINE2 || "",
    city: process.env.INVOICE_SELLER_CITY || "",
    region: process.env.INVOICE_SELLER_REGION || "",
    postalCode: process.env.INVOICE_SELLER_POSTAL || "",
    country: process.env.INVOICE_SELLER_COUNTRY || "",
    email: process.env.INVOICE_SELLER_EMAIL || SITE_CONTACT_EMAIL,
    phone: process.env.INVOICE_SELLER_PHONE || "",
  };
}

export function invoiceCommodity() {
  return process.env.INVOICE_COMMODITY || "Umaxes Hookamax";
}

export function invoicePuffsLabel() {
  return process.env.INVOICE_PUFFS_LABEL || "MTL/DLT - 80K/50K";
}

export type InvoiceAddress = {
  label?: string | null;
  recipientName?: string | null;
  phone?: string | null;
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

function addressLines(a: InvoiceAddress) {
  const cityLine = [a.city, a.region, a.postalCode].filter(Boolean).join(", ");
  const nameLine = [a.recipientName, a.phone].filter(Boolean).join(" · ");
  return [a.label, nameLine, a.line1, a.line2, cityLine, a.country]
    .map((v) => (v || "").trim())
    .filter(Boolean);
}

export function formatAddressHtml(a: InvoiceAddress) {
  return addressLines(a).map(escapeHtml).join("<br/>");
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

function dash(value?: string | null) {
  const v = (value || "").trim();
  return v ? escapeHtml(v) : "—";
}

export function formatUsd(n: number) {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatIssuedDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function resolvePublicUrl(path: string, origin?: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const prefix = (origin || "").replace(/\/$/, "");
  const rel = path.startsWith("/") ? path : `/${path}`;
  return prefix ? `${prefix}${rel}` : rel;
}

/** Append 80K / 50K puffs to every invoice line name */
export function invoiceItemName(name: string) {
  const suffix = `${PUFF_OPTIONS.join(" / ")} puffs`;
  if (/50\s*k|80\s*k|puffs/i.test(name)) return name;
  return `${name} · ${suffix}`;
}

const PUFF_ONLY = /^(?:\d+\s*k(?:\s*\/\s*\d+\s*k)?(?:\s*puffs)?)$/i;

/** Split a stored order-item name into commodity / puffs / flavor description. */
export function invoiceLineParts(name: string) {
  const parts = name
    .split(" · ")
    .map((p) => p.trim())
    .filter(Boolean);
  const descriptionParts = parts.filter(
    (p) => !PUFF_ONLY.test(p) && !/\bpuffs\b/i.test(p),
  );
  return {
    commodity: invoiceCommodity(),
    puffs: invoicePuffsLabel(),
    description: descriptionParts.join(" · ") || parts[0] || name,
  };
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
  rebateAppliedUsd?: number | null;
  firstOrderUnpaidPcs?: number | null;
  testStationQty?: number | null;
  chargedQty?: number | null;
  sellingQty?: number | null;
  items: MoneyItem[];
  packingLines?: PackingLine[] | null;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total?: number;
  packingMetaHtml?: string;
  forceDownloadHref?: string;
  pdfHref?: string;
  xlsxHref?: string;
  showToolbar?: boolean;
  bank?: InvoiceBankDetails | null;
  origin?: string;
};

const titles: Record<InvoiceDocType, string> = {
  pi: "Proforma Invoice",
  packing: "Packing List",
  invoice: "Commercial Invoice",
};

const numberLabels: Record<InvoiceDocType, string> = {
  pi: "PI No.",
  packing: "PL No.",
  invoice: "CI No.",
};

function kvRow(label: string, value: string) {
  return `<tr>
    <th>${escapeHtml(label)}</th>
    <td>${value}</td>
  </tr>`;
}

function bankBlock(bank: InvoiceBankDetails) {
  const rows = [
    ["Company", bank.companyName],
    ["Bank account", bank.accountNumber],
    ["Bank name", bank.bankName],
    ["Bank address", bank.bankAddress],
    ["Swift code", bank.swiftCode],
  ]
    .filter(([, v]) => (v || "").trim())
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `<section class="bank">
  <h2>Bank Information</h2>
  <table class="kv">${rows}</table>
</section>`;
}

export function buildInvoiceHtml(input: BuildInvoiceHtmlInput) {
  const showMoney = input.type !== "packing";
  const address = parseAddressSnap(input.addressSnap);
  const issued = formatIssuedDate(input.createdAt);
  const showToolbar = input.showToolbar !== false;
  const seller = sellerCompany();
  const logoSrc = resolvePublicUrl(logos.blueWordmark, input.origin);
  const bank = input.bank || DEFAULT_INVOICE_BANK;
  const buyerContact = [input.clientPhone, input.clientEmail]
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .join(" · ");
  const sellerAddress = [
    seller.line1,
    seller.line2,
    [seller.city, seller.region, seller.postalCode].filter(Boolean).join(", "),
    seller.country,
  ]
    .filter((v) => (v || "").trim())
    .join(", ");

  const qtyTotal = input.items.reduce((s, i) => s + i.quantity, 0);
  const linesTotal = input.items.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );
  const discount = input.discount ?? 0;
  const shipping = input.shipping ?? 0;
  const grand = input.total ?? linesTotal;
  const extraMoneyRows = showMoney && (discount > 0 || shipping > 0);

  const moneyRows = input.items
    .map((item, index) => {
      const parts = invoiceLineParts(item.name);
      const amount = item.unitPrice * item.quantity;
      return `<tr>
        <td class="num center">${index + 1}</td>
        <td>${escapeHtml(parts.commodity)}</td>
        <td class="center">${escapeHtml(parts.puffs)}</td>
        <td>${escapeHtml(parts.description)}</td>
        <td class="num center">${formatUsd(item.unitPrice)}</td>
        <td class="num center">${item.quantity}</td>
        <td class="num center">${formatUsd(amount)}</td>
      </tr>`;
    })
    .join("");

  const extraRows = extraMoneyRows
    ? `${
        discount > 0
          ? `<tr class="sum-row">
        <td></td>
        <td colspan="3" class="total-label">${
          input.rebateAppliedUsd && input.rebateAppliedUsd > 0
            ? "Discount / rebate credit"
            : "Discount"
        }</td>
        <td></td>
        <td></td>
        <td class="num center">−${formatUsd(discount)}</td>
      </tr>`
          : ""
      }${
        shipping > 0
          ? `<tr class="sum-row">
        <td></td>
        <td colspan="3" class="total-label">Shipping</td>
        <td></td>
        <td></td>
        <td class="num center">${formatUsd(shipping)}</td>
      </tr>`
          : ""
      }`
    : "";

  const totalRow = showMoney
    ? `<tr class="total-row">
        <td></td>
        <td colspan="3" class="total-label">Total</td>
        <td></td>
        <td class="num center">${qtyTotal}</td>
        <td class="num center">${formatUsd(grand)}</td>
      </tr>`
    : "";

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
    .map((line, index) => {
      const parts = invoiceLineParts(line.name);
      return `<tr>
        <td class="num center">${index + 1}</td>
        <td class="sku">${escapeHtml(line.sku)}</td>
        <td>${escapeHtml(parts.description)}</td>
        <td>${escapeHtml(line.flavor || parts.description)}</td>
        <td>${escapeHtml(line.size || "—")}</td>
        <td class="num center">${line.quantity}</td>
        <td class="num center">${line.boxes ?? "—"}</td>
      </tr>`;
    })
    .join("");

  const packingTotal = `<tr class="total-row">
        <td></td>
        <td colspan="4" class="total-label">Total</td>
        <td class="num center">${packingSource.reduce((s, l) => s + l.quantity, 0)}</td>
        <td class="num center">${packingSource.reduce((s, l) => s + (l.boxes ?? 0), 0) || "—"}</td>
      </tr>`;

  const toolbar = showToolbar
    ? `<div class="toolbar no-print">
  <p><strong>${titles[input.type]}</strong> · ${escapeHtml(input.docNumber)}</p>
  <div class="actions">
    <button type="button" class="primary" onclick="window.print()">Print</button>
    ${
      input.pdfHref
        ? `<a href="${escapeHtml(input.pdfHref)}">PDF</a>`
        : ""
    }
    ${
      input.xlsxHref
        ? `<a href="${escapeHtml(input.xlsxHref)}">Excel</a>`
        : ""
    }
    ${
      !input.pdfHref && input.forceDownloadHref
        ? `<a href="${escapeHtml(input.forceDownloadHref)}">Download</a>`
        : ""
    }
  </div>
</div>`
    : "";

  const facts = [
    showMoney && input.paymentMethod
      ? `<span><strong>Payment</strong> · ${escapeHtml(paymentLabels[input.paymentMethod])}</span>`
      : "",
    input.couponCode
      ? `<span><strong>Coupon</strong> · ${escapeHtml(input.couponCode)}</span>`
      : "",
    input.testStationQty
      ? `<span><strong>Test stations</strong> · ${input.testStationQty} free · 1 device each</span>`
      : "",
    input.firstOrderUnpaidPcs
      ? `<span><strong>First-order unpaid</strong> · ${input.firstOrderUnpaidPcs} pcs</span>`
      : "",
    input.rebateAppliedUsd
      ? `<span><strong>Rebate credit</strong> · −${formatUsd(input.rebateAppliedUsd)}</span>`
      : "",
    input.sellingQty
      ? `<span><strong>Shipped pcs</strong> · ${input.sellingQty}${
          input.chargedQty != null && input.chargedQty !== input.sellingQty
            ? ` · charged ${input.chargedQty}`
            : ""
        }</span>`
      : "",
    `<span><strong>Order</strong> · ${escapeHtml(input.orderNumber)}</span>`,
  ]
    .filter(Boolean)
    .join("");

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
  background:#e8edf3;
  font-family:Arial,Helvetica,sans-serif;
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
.toolbar .primary{background:#ff5b04;color:#fff}
.sheet{
  max-width:980px;margin:24px auto;padding:28px 32px 36px;
  background:#fff;border:1px solid #d5dee9;
  box-shadow:0 12px 40px rgba(23,32,51,.08);
}
.header{
  display:flex;justify-content:space-between;gap:24px;align-items:flex-start;
  padding-bottom:16px;border-bottom:3px solid #ff5b04;
}
.logo{display:block;height:52px;width:auto;max-width:220px;object-fit:contain}
.doc-title{margin:0;text-align:right;font-size:22px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#172033}
.doc-meta{margin:6px 0 0;text-align:right;font-size:13px;line-height:1.55;color:#3f4f63}
.doc-meta strong{color:#111}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin:18px 0 16px}
.kv{width:100%;border-collapse:collapse}
.kv th,.kv td{padding:4px 8px 4px 0;font-size:13px;vertical-align:top;border:0}
.kv th{width:108px;text-align:left;font-weight:700;color:#172033;white-space:nowrap}
.kv td{color:#111}
.facts{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 14px;font-size:12.5px;color:#3f4f63}
.facts strong{color:#111}
.items{width:100%;border-collapse:collapse;margin-top:4px}
.items th,.items td{border:1px solid #111;padding:8px 8px;font-size:12.5px;vertical-align:middle}
.items th{
  background:#c5d9f1;font-size:11.5px;font-weight:700;color:#111;text-align:center;
}
.items td{background:#fff}
.items .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.items .center{text-align:center}
.items .sku{font-size:11.5px;color:#3f4f63;white-space:nowrap}
.items .total-row td{font-weight:800;background:#eef4fb}
.items .total-label{text-align:center;font-weight:800}
.items .sum-row td{background:#f7fafc;font-weight:700}
.bank{margin-top:22px}
.bank h2{
  margin:0 0 8px;font-size:14px;font-weight:800;letter-spacing:.04em;
  text-transform:uppercase;color:#172033;
}
.bank .kv{max-width:640px}
.bank .kv th{width:130px}
.footer-note{
  margin:28px 0 0;padding:12px 16px;text-align:center;
  border:1px solid #ffd0ad;background:#fff6ef;
  font-size:12px;font-weight:600;color:#3d1605;line-height:1.55;
}
.muted{color:#666}
@media (max-width:720px){
  .sheet{margin:0;padding:18px 14px;border:0;box-shadow:none}
  .header,.parties{grid-template-columns:1fr;display:grid}
  .doc-title,.doc-meta{text-align:left}
}
@media print{
  body{background:#fff}
  .toolbar{display:none!important}
  .sheet{margin:0;border:0;box-shadow:none;max-width:none;padding:0}
}
</style>
</head>
<body>
${toolbar}
<div class="sheet">
  <div class="header">
    <img class="logo" src="${escapeHtml(logoSrc)}" alt="${escapeHtml(seller.name)}"/>
    <div>
      <p class="doc-title">${titles[input.type]}</p>
      <p class="doc-meta">
        <strong>${escapeHtml(numberLabels[input.type])}</strong> ${escapeHtml(input.docNumber)}<br/>
        <strong>Issued date:</strong> ${escapeHtml(issued)}
      </p>
    </div>
  </div>

  <div class="parties">
    <table class="kv">
      ${kvRow("Vendor", `<strong>${escapeHtml(seller.legalName || seller.name)}</strong>`)}
      ${kvRow("Address", dash(sellerAddress))}
      ${kvRow("Mobile", dash(seller.phone))}
      ${kvRow("Email", dash(seller.email))}
    </table>
    <table class="kv">
      ${kvRow("Company", `<strong>${escapeHtml(input.companyName)}</strong>`)}
      ${kvRow("Name", dash(input.clientName))}
      ${kvRow("Address", formatAddressHtml(address) || "—")}
      ${kvRow("Contact", dash(buyerContact))}
      ${
        input.companyTaxId
          ? kvRow("Tax ID", escapeHtml(input.companyTaxId))
          : ""
      }
    </table>
  </div>

  <div class="facts">${facts}</div>

  ${input.packingMetaHtml || ""}

  <table class="items">
    <thead>
      <tr>
        ${
          showMoney
            ? `<th style="width:44px">No</th>
        <th>Commodity</th>
        <th>Puffs</th>
        <th>Description of goods</th>
        <th>Unit price (USD)</th>
        <th>Quantity</th>
        <th>Total Price (USD)</th>`
            : `<th style="width:44px">No</th>
        <th>SKU</th>
        <th>Item</th>
        <th>Flavor</th>
        <th>Size</th>
        <th>Qty</th>
        <th>Boxes</th>`
        }
      </tr>
    </thead>
    <tbody>
      ${showMoney ? moneyRows : packingRows}
      ${showMoney ? extraRows : ""}
      ${showMoney ? totalRow : packingTotal}
    </tbody>
  </table>

  ${showMoney ? bankBlock(bank) : ""}

  <p class="footer-note">
    Adults 21+ only. Nicotine is an addictive chemical.
  </p>
</div>
</body>
</html>`;
}
