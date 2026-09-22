import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  DEFAULT_INVOICE_BANK,
  type InvoiceBankDetails,
} from "@/lib/bank-accounts";
import { paymentLabels } from "@/lib/catalog";
import {
  buildInvoiceHtml,
  escapeHtml,
  formatIssuedDate,
  formatUsd,
  invoiceLineParts,
  parseAddressSnap,
  sellerCompany,
  type InvoiceDocType,
} from "@/lib/invoice-html";

type ExportItem = {
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

export type PackingShipmentMeta = {
  boxCount?: number | null;
  cbm?: number | null;
  weightKg?: number | null;
  packingNote?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
};

export type InvoiceExportInput = {
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
  items: ExportItem[];
  packingLines?: PackingLine[] | null;
  packingMeta?: PackingShipmentMeta | null;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total?: number;
  bank?: InvoiceBankDetails | null;
};

const TITLES: Record<InvoiceDocType, string> = {
  pi: "Proforma Invoice",
  packing: "Packing List",
  invoice: "Commercial Invoice",
};

const NUMBER_LABELS: Record<InvoiceDocType, string> = {
  pi: "PI No.",
  packing: "PL No.",
  invoice: "CI No.",
};

const LOGO_PATH = path.join(
  process.cwd(),
  "public",
  "images",
  "logo",
  "umaxes-blue.png",
);

/** Flatten transparent logo onto white so PDF/JPEG never render a black box. */
export async function loadInvoiceLogoJpeg(): Promise<{
  data: Buffer;
  width: number;
  height: number;
} | null> {
  if (!fs.existsSync(LOGO_PATH)) return null;
  try {
    const resized = await sharp(LOGO_PATH)
      .flatten({ background: "#ffffff" })
      .resize({ width: 170, height: 50, fit: "inside" })
      .jpeg({ quality: 92 })
      .toBuffer({ resolveWithObject: true });
    return {
      data: resized.data,
      width: resized.info.width,
      height: resized.info.height,
    };
  } catch {
    return null;
  }
}

/** PNG data URI for HTML / Excel so the logo never depends on a public URL. */
export async function loadInvoiceLogoDataUri(): Promise<string | null> {
  if (!fs.existsSync(LOGO_PATH)) return null;
  try {
    const png = await sharp(LOGO_PATH)
      .flatten({ background: "#ffffff" })
      .resize({ width: 340, height: 100, fit: "inside" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    try {
      const raw = fs.readFileSync(LOGO_PATH);
      return `data:image/png;base64,${raw.toString("base64")}`;
    } catch {
      return null;
    }
  }
}

function money(n: number) {
  return Math.round(n * 100) / 100;
}

function dash(value?: string | null) {
  const v = (value || "").trim();
  return v || "—";
}

function addressText(snap: string) {
  const a = parseAddressSnap(snap);
  return (
    [
      [a.recipientName, a.phone].filter(Boolean).join(" · "),
      a.line1,
      a.line2,
      [a.city, a.region, a.postalCode].filter(Boolean).join(", "),
      a.country,
    ]
      .map((v) => (v || "").trim())
      .filter(Boolean)
      .join(", ") || "—"
  );
}

function sellerAddressText() {
  const s = sellerCompany();
  return (
    [
      s.line1,
      s.line2,
      [s.city, s.region, s.postalCode].filter(Boolean).join(", "),
      s.country,
    ]
      .map((v) => (v || "").trim())
      .filter(Boolean)
      .join(", ") || "—"
  );
}

function factLines(input: InvoiceExportInput, showMoney: boolean) {
  const lines: string[] = [];
  if (showMoney && input.paymentMethod) {
    lines.push(`Payment · ${paymentLabels[input.paymentMethod]}`);
  }
  if (input.couponCode) lines.push(`Coupon · ${input.couponCode}`);
  if (input.testStationQty) {
    lines.push(`Test stations · ${input.testStationQty} free · 1 device each`);
  }
  if (input.firstOrderUnpaidPcs) {
    lines.push(`First-order unpaid · ${input.firstOrderUnpaidPcs} pcs`);
  }
  if (input.rebateAppliedUsd) {
    lines.push(`Rebate credit · −${formatUsd(input.rebateAppliedUsd)}`);
  }
  if (input.sellingQty) {
    const charged =
      input.chargedQty != null && input.chargedQty !== input.sellingQty
        ? ` · charged ${input.chargedQty}`
        : "";
    lines.push(`Shipped pcs · ${input.sellingQty}${charged}`);
  }
  lines.push(`Order · ${input.orderNumber}`);
  return lines;
}

function packingMetaHtml(meta: PackingShipmentMeta | null | undefined) {
  if (!meta) return "";
  const cards = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 18px">
  <div style="border:1px solid rgba(0,0,0,.08);padding:12px;border-radius:12px;background:#fff"><div class="muted" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase">Boxes</div><div style="font-size:18px;font-weight:800;margin-top:4px">${meta.boxCount ?? "—"}</div></div>
  <div style="border:1px solid rgba(0,0,0,.08);padding:12px;border-radius:12px;background:#fff"><div class="muted" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase">CBM</div><div style="font-size:18px;font-weight:800;margin-top:4px">${meta.cbm ?? "—"}</div></div>
  <div style="border:1px solid rgba(0,0,0,.08);padding:12px;border-radius:12px;background:#fff"><div class="muted" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase">Weight (kg)</div><div style="font-size:18px;font-weight:800;margin-top:4px">${meta.weightKg ?? "—"}</div></div>
</div>`;
  const note = meta.packingNote
    ? `<p style="margin:0 0 12px;font-size:13px"><strong>Packing note:</strong> ${escapeHtml(meta.packingNote)}</p>`
    : "";
  const tracking = meta.trackingNumber
    ? `<p style="margin:0 0 12px;font-size:13px"><strong>Tracking:</strong> ${escapeHtml(meta.carrier || "—")} · ${escapeHtml(meta.trackingNumber)}</p>`
    : "";
  return `${cards}${note}${tracking}`;
}

/**
 * Excel download — same visual layout as the on-screen invoice / PDF print,
 * with the UMAXES logo embedded (no exceljs, Turbopack-safe).
 * Served as .xls; Excel and Numbers open the HTML worksheet.
 */
export async function buildInvoiceXlsx(
  input: InvoiceExportInput,
): Promise<Buffer> {
  const logoSrc = await loadInvoiceLogoDataUri();
  const html = buildInvoiceHtml({
    ...input,
    packingMetaHtml: packingMetaHtml(input.packingMeta),
    showToolbar: false,
    logoSrc: logoSrc || undefined,
    bank: input.bank,
  });
  return Buffer.from(html, "utf8");
}

function pdfEscape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(text: string, width = 88) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > width) {
      if (cur) lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

export async function buildInvoicePdf(
  input: InvoiceExportInput,
): Promise<Buffer> {
  const showMoney = input.type !== "packing";
  const seller = sellerCompany();
  const bank = input.bank || DEFAULT_INVOICE_BANK;
  const buyerContact = [input.clientPhone, input.clientEmail]
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .join(" · ");
  const issued = formatIssuedDate(input.createdAt);
  const qtyTotal = input.items.reduce((s, i) => s + i.quantity, 0);
  const linesTotal = input.items.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );
  const discount = input.discount ?? 0;
  const shipping = input.shipping ?? 0;
  const grand = input.total ?? linesTotal;

  const textLines: string[] = [
    TITLES[input.type],
    `${NUMBER_LABELS[input.type]} ${input.docNumber}`,
    `Issued date: ${issued}`,
    "",
    "Vendor",
    `Company: ${seller.legalName || seller.name}`,
    `Address: ${sellerAddressText()}`,
    `Mobile: ${dash(seller.phone)}`,
    `Email: ${dash(seller.email)}`,
    "",
    "Buyer",
    `Company: ${input.companyName}`,
    `Name: ${dash(input.clientName)}`,
    `Address: ${addressText(input.addressSnap)}`,
    `Contact: ${dash(buyerContact)}`,
    input.companyTaxId ? `Tax ID: ${input.companyTaxId}` : "",
    "",
    ...factLines(input, showMoney),
    "",
  ];

  if (!showMoney && input.packingMeta) {
    const m = input.packingMeta;
    textLines.push(
      `Boxes: ${m.boxCount ?? "—"}   CBM: ${m.cbm ?? "—"}   Weight (kg): ${m.weightKg ?? "—"}`,
    );
    if (m.packingNote) textLines.push(`Packing note: ${m.packingNote}`);
    if (m.trackingNumber) {
      textLines.push(`Tracking: ${m.carrier || "—"} · ${m.trackingNumber}`);
    }
    textLines.push("");
  }

  if (showMoney) {
    textLines.push(
      "No  Description                              Qty        Amount",
    );
    input.items.forEach((item, i) => {
      const parts = invoiceLineParts(item.name);
      const amount = money(item.unitPrice * item.quantity).toFixed(2);
      textLines.push(
        `${String(i + 1).padStart(2, " ")}  ${parts.description.slice(0, 36).padEnd(36, " ")}  ${String(item.quantity).padStart(4, " ")}  $${amount.padStart(9, " ")}`,
      );
      textLines.push(
        `    ${parts.commodity} · ${parts.puffs} · $${money(item.unitPrice).toFixed(2)}/pc`,
      );
    });
    if (discount > 0) {
      textLines.push(
        `Discount / rebate                         −$${money(discount).toFixed(2)}`,
      );
    }
    if (shipping > 0) {
      textLines.push(
        `Shipping                                   $${money(shipping).toFixed(2)}`,
      );
    }
    textLines.push(
      `TOTAL  Qty ${qtyTotal}                       $${money(grand).toFixed(2)}`,
    );
    textLines.push("");
    textLines.push("Bank Information");
    textLines.push(`Company: ${bank.companyName}`);
    textLines.push(`Bank account: ${bank.accountNumber}`);
    textLines.push(`Bank name: ${bank.bankName}`);
    textLines.push(`Bank address: ${bank.bankAddress}`);
    textLines.push(`Swift code: ${bank.swiftCode}`);
  } else {
    const source =
      input.packingLines && input.packingLines.length
        ? input.packingLines
        : input.items;
    textLines.push("No  SKU                 Qty   Boxes");
    source.forEach((line, i) => {
      const boxes =
        "boxes" in line && line.boxes != null ? String(line.boxes) : "—";
      textLines.push(
        `${String(i + 1).padStart(2, " ")}  ${(line.sku || "").padEnd(16, " ")}  ${String(line.quantity).padStart(4, " ")}  ${boxes.padStart(5, " ")}`,
      );
    });
  }

  textLines.push("");
  textLines.push("Adults 21+ only. Nicotine is an addictive chemical.");

  let logoJpeg: Buffer | null = null;
  let logoW = 0;
  let logoH = 0;
  const logo = await loadInvoiceLogoJpeg();
  if (logo) {
    logoJpeg = logo.data;
    logoW = logo.width;
    logoH = logo.height;
  }

  const content: string[] = [];
  let y = 760;
  const pageW = 612;
  const marginX = 40;
  const topY = 760;

  if (logoJpeg && logoW > 0 && logoH > 0) {
    const drawW = logoW * 0.75;
    const drawH = logoH * 0.75;
    content.push("q");
    content.push(
      `${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${marginX} ${(topY - drawH).toFixed(2)} cm`,
    );
    content.push("/Im1 Do");
    content.push("Q");
    y = Math.min(y, topY - drawH - 8);
  }

  const rightX = pageW - marginX - 240;
  content.push(
    `BT /F2 16 Tf ${rightX} ${topY - 16} Td (${pdfEscape(TITLES[input.type].toUpperCase())}) Tj ET`,
  );
  content.push(
    `BT /F2 11 Tf ${rightX} ${topY - 34} Td (${pdfEscape(`${NUMBER_LABELS[input.type]} ${input.docNumber}`)}) Tj ET`,
  );
  content.push(
    `BT /F1 10 Tf ${rightX} ${topY - 50} Td (${pdfEscape(`Issued date: ${issued}`)}) Tj ET`,
  );
  y = Math.min(y, topY - 58);
  content.push("0.9 0.36 0.02 RG");
  content.push("2 w");
  content.push(`${marginX} ${y} m ${pageW - marginX} ${y} l S`);
  content.push("0 0 0 RG");
  content.push("1 w");
  y -= 20;

  const bodyLines = textLines.slice(3);
  const withBlanks = bodyLines.flatMap((line) =>
    line === "" ? [""] : wrapLine(line),
  );

  for (const line of withBlanks) {
    if (y < 48) break;
    if (line === "") {
      y -= 10;
      continue;
    }
    const bold =
      line === "Vendor" ||
      line === "Buyer" ||
      line === "Bank Information" ||
      line.startsWith("TOTAL");
    const font = bold ? "/F2 10 Tf" : "/F1 10 Tf";
    content.push(`BT ${font} ${marginX} ${y} Td (${pdfEscape(line)}) Tj ET`);
    y -= 14;
  }

  const stream = content.join("\n");
  const resources = logoJpeg
    ? "<< /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R >> >>"
    : "<< /Font << /F1 5 0 R /F2 6 0 R >> >>";

  const textObjects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources ${resources} >>`,
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n", "utf8")];
  const offsets = [0];

  function pushObj(num: number, body: Buffer) {
    offsets[num] = Buffer.concat(chunks).length;
    chunks.push(
      Buffer.from(`${num} 0 obj\n`, "utf8"),
      body,
      Buffer.from("\nendobj\n", "utf8"),
    );
  }

  textObjects.forEach((body, i) => {
    pushObj(i + 1, Buffer.from(body, "utf8"));
  });

  if (logoJpeg) {
    const header = Buffer.from(
      `<< /Type /XObject /Subtype /Image /Width ${logoW} /Height ${logoH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoJpeg.length} >>\nstream\n`,
      "utf8",
    );
    const tail = Buffer.from("\nendstream", "utf8");
    pushObj(7, Buffer.concat([header, logoJpeg, tail]));
  }

  const bodyBuf = Buffer.concat(chunks);
  const objCount = logoJpeg ? 7 : 6;
  let xref = `xref\n0 ${objCount + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objCount; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objCount + 1} /Root 1 0 R >>\nstartxref\n${bodyBuf.length}\n%%EOF`;
  return Buffer.concat([bodyBuf, Buffer.from(xref, "utf8")]);
}
