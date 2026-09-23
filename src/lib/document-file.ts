import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  DEFAULT_INVOICE_BANK,
  type InvoiceBankDetails,
} from "@/lib/bank-accounts";
import { paymentLabels } from "@/lib/catalog";
import {
  formatIssuedDate,
  formatUsd,
  invoiceLineParts,
  parseAddressSnap,
  sellerCompany,
  type InvoiceDocType,
} from "@/lib/invoice-html";
import { casesFromPcs, isCasePackedSku } from "@/lib/pack";
import { zipStore } from "@/lib/zip-store";

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

/** Embedded PNG for real .xlsx (Excel / WPS / LibreOffice). */
export async function loadInvoiceLogoPng(): Promise<{
  data: Buffer;
  width: number;
  height: number;
} | null> {
  if (!fs.existsSync(LOGO_PATH)) return null;
  try {
    const resized = await sharp(LOGO_PATH)
      .flatten({ background: "#ffffff" })
      .resize({ width: 170, height: 50, fit: "inside" })
      .png()
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

/** PNG data URI for on-screen HTML invoices (print / browser). */
export async function loadInvoiceLogoDataUri(): Promise<string | null> {
  const logo = await loadInvoiceLogoPng();
  if (!logo) return null;
  return `data:image/png;base64,${logo.data.toString("base64")}`;
}

function money(n: number) {
  return Math.round(n * 100) / 100;
}

function dash(value?: string | null) {
  const v = (value || "").trim();
  return v || "—";
}

function xmlText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function factLines(input: InvoiceExportInput, showMoney: boolean) {
  const lines: string[] = [];
  if (showMoney && input.paymentMethod) {
    lines.push(`Payment · ${paymentLabels[input.paymentMethod]}`);
  }
  if (input.couponCode) lines.push(`Coupon · ${input.couponCode}`);
  if (input.testStationQty) {
    lines.push(
      `Test stations · ${input.testStationQty} · including 1 device inside each`,
    );
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

function colName(index: number) {
  let n = index;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

type SheetCell = {
  t?: "s" | "n";
  v?: string | number;
  style?: number;
};

type SheetRow = {
  cells: Array<SheetCell | null>;
  height?: number;
};

function cellXml(row: number, col: number, cell: SheetCell) {
  const ref = `${colName(col)}${row}`;
  const style = cell.style != null ? ` s="${cell.style}"` : "";
  if (cell.t === "n" && typeof cell.v === "number") {
    return `<c r="${ref}"${style}><v>${cell.v}</v></c>`;
  }
  const raw = String(cell.v ?? "");
  const text = xmlText(raw);
  const space = raw.includes("\n") || raw.startsWith(" ") || raw.endsWith(" ")
    ? ` xml:space="preserve"`
    : "";
  return `<c r="${ref}"${style} t="inlineStr"><is><t${space}>${text}</t></is></c>`;
}

function mergeXml(ref: string) {
  return `<mergeCell ref="${ref}"/>`;
}

function lineCount(value: string) {
  return Math.max(1, String(value || "").split("\n").length);
}

function rowHeightForLines(lines: number, perLine = 14, pad = 6) {
  return Math.min(96, Math.max(18, lines * perLine + pad));
}

function estimateWrapLines(text: string, charsPerLine = 40) {
  const parts = String(text || "").split("\n");
  let total = 0;
  for (const part of parts) {
    const len = part.trim().length || 1;
    total += Math.max(1, Math.ceil(len / Math.max(12, charsPerLine)));
  }
  return Math.max(1, total);
}

function addressLinesFromSnap(snap: string): string[] {
  try {
    const a = parseAddressSnap(snap);
    const cityLine = [a.city, a.region, a.postalCode].filter(Boolean).join(", ");
    const nameLine = [a.recipientName, a.phone].filter(Boolean).join(" · ");
    return [a.label, nameLine, a.line1, a.line2, cityLine, a.country]
      .map((v) => (v || "").trim())
      .filter(Boolean);
  } catch {
    return [(snap || "").trim()].filter(Boolean);
  }
}

function addressText(snap: string) {
  return addressLinesFromSnap(snap).join("\n") || "—";
}

function sellerAddressLines(): string[] {
  const s = sellerCompany();
  const cityLine = [s.city, s.region, s.postalCode].filter(Boolean).join(", ");
  return [s.line1, s.line2, cityLine, s.country]
    .map((v) => (v || "").trim())
    .filter(Boolean);
}

function sellerAddressText() {
  return sellerAddressLines().join("\n") || "—";
}

/**
 * Real OOXML .xlsx with embedded UMAXES logo.
 * Opens correctly in Microsoft Excel, WPS Office, LibreOffice, Numbers.
 */
export async function buildInvoiceXlsx(
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
  const discount = input.discount ?? 0;
  const shipping = input.shipping ?? 0;
  const grand =
    input.total ??
    input.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const logo = await loadInvoiceLogoPng();

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="10">
    <font><sz val="10"/><color rgb="FF111111"/><name val="Arial"/></font>
    <font><b/><sz val="18"/><color rgb="FF172033"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FF111111"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FF172033"/><name val="Arial"/></font>
    <font><b/><sz val="12"/><color rgb="FF172033"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FF111111"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FF3D1605"/><name val="Arial"/></font>
    <font><b/><sz val="14"/><color rgb="FF2F6FB2"/><name val="Arial"/></font>
    <font><sz val="9"/><color rgb="FF3F4F63"/><name val="Arial"/></font>
    <font><b/><sz val="16"/><color rgb="FF111111"/><name val="Arial"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFC5D9F1"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEEF4FB"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF6EF"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF7FAFC"/></patternFill></fill>
  </fills>
  <borders count="5">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF111111"/></left>
      <right style="thin"><color rgb="FF111111"/></right>
      <top style="thin"><color rgb="FF111111"/></top>
      <bottom style="thin"><color rgb="FF111111"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left/><right/><top/>
      <bottom style="medium"><color rgb="FFFF5B04"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FFD5DEE9"/></left>
      <right style="thin"><color rgb="FFD5DEE9"/></right>
      <top style="thin"><color rgb="FFD5DEE9"/></top>
      <bottom style="thin"><color rgb="FFD5DEE9"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FFFFD0AD"/></left>
      <right style="thin"><color rgb="FFFFD0AD"/></right>
      <top style="thin"><color rgb="FFFFD0AD"/></top>
      <bottom style="thin"><color rgb="FFFFD0AD"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="20">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment horizontal="right" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="5" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="7" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="7" fontId="5" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="4" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="8" fillId="5" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="9" fillId="5" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="8" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="8" fillId="6" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center" wrapText="1"/></xf>
  </cellXfs>
</styleSheet>`;

  const rows: SheetRow[] = [];
  const merges: string[] = [];

  function pushRow(cells: Array<SheetCell | null>, height?: number) {
    rows.push({ cells, height });
  }

  // —— Header (logo + title)
  pushRow(
    [
      logo ? { v: "", style: 12 } : { v: "UMAXES", style: 12 },
      null,
      null,
      null,
      { v: TITLES[input.type].toUpperCase(), style: 1 },
      null,
      null,
    ],
    36,
  );
  merges.push("A1:C1", "E1:G1");

  // Value must sit in the top-left cell of the merge (E), or Excel hides it.
  const docLine = `${NUMBER_LABELS[input.type]} ${input.docNumber}`;
  pushRow(
    [
      null,
      null,
      null,
      null,
      { v: docLine, style: 2 },
      null,
      null,
    ],
    rowHeightForLines(estimateWrapLines(docLine, 40), 14, 6),
  );
  merges.push("E2:G2");
  pushRow(
    [
      null,
      null,
      null,
      null,
      { v: `Issued date: ${issued}`, style: 17 },
      null,
      null,
    ],
    16,
  );
  merges.push("E3:G3");
  // One orange accent under the full header (none under the logo cell)
  pushRow(
    [
      { v: "", style: 18 },
      { v: "", style: 18 },
      { v: "", style: 18 },
      { v: "", style: 18 },
      { v: "", style: 18 },
      { v: "", style: 18 },
      { v: "", style: 18 },
    ],
    4,
  );

  pushRow([null], 8);

  // —— Parties: align Address with Address so Mobile/Name stay normal height
  const vendorAddress = sellerAddressText();
  const buyerAddress = addressText(input.addressSnap);
  const partyRows: Array<{
    left?: [string, string, boolean];
    right?: [string, string, boolean];
  }> = [
    {
      left: ["Vendor", seller.legalName || seller.name, true],
      right: ["Company", input.companyName, true],
    },
    {
      left: ["Address", vendorAddress, false],
      right: ["Address", buyerAddress, false],
    },
    {
      left: ["Mobile", dash(seller.phone), false],
      right: ["Name", dash(input.clientName), false],
    },
    {
      left: ["Email", dash(seller.email), false],
      right: ["Contact", dash(buyerContact), false],
    },
  ];
  if (input.companyTaxId) {
    partyRows.push({
      right: ["Tax ID", input.companyTaxId, false],
    });
  }

  for (const row of partyRows) {
    const v = row.left;
    const b = row.right;
    const vValue = v?.[1] || "";
    const bValue = b?.[1] || "";
    const isAddressRow = v?.[0] === "Address" || b?.[0] === "Address";
    const isContactRow = b?.[0] === "Contact";
    const vLines = estimateWrapLines(vValue, isAddressRow ? 32 : 40);
    const bLines = estimateWrapLines(
      bValue,
      isAddressRow || isContactRow ? 30 : 40,
    );
    const height = isAddressRow
      ? rowHeightForLines(Math.max(vLines, bLines), 15, 8)
      : isContactRow
        ? rowHeightForLines(Math.max(1, bLines), 14, 6)
        : 20;
    pushRow(
      [
        v ? { v: v[0], style: 3 } : null,
        v ? { v: vValue, style: v[2] ? 14 : 13 } : null,
        null,
        null,
        b ? { v: b[0], style: 3 } : null,
        b ? { v: bValue, style: b[2] ? 14 : 13 } : null,
        null,
      ],
      height,
    );
    const r = rows.length;
    merges.push(`B${r}:C${r}`, `F${r}:G${r}`);
  }

  // —— Facts line (same as printable PDF)
  const facts = factLines(input, showMoney);
  pushRow([null], 6);
  pushRow([{ v: facts.join("   "), style: 17 }], 18);
  merges.push(`A${rows.length}:G${rows.length}`);

  // —— Packing meta cards (always on packing list, like PDF)
  if (!showMoney) {
    const m = input.packingMeta || {
      boxCount: null,
      cbm: null,
      weightKg: null,
    };
    pushRow([null], 8);
    // Label row
    pushRow(
      [
        { v: "CASES", style: 15 },
        null,
        { v: "CBM", style: 15 },
        null,
        { v: "WEIGHT (KG)", style: 15 },
        null,
        null,
      ],
      18,
    );
    merges.push(
      `A${rows.length}:B${rows.length}`,
      `C${rows.length}:D${rows.length}`,
      `E${rows.length}:G${rows.length}`,
    );
    // Value row
    pushRow(
      [
        { v: String(m.boxCount ?? "—"), style: 16 },
        null,
        { v: String(m.cbm ?? "—"), style: 16 },
        null,
        { v: String(m.weightKg ?? "—"), style: 16 },
        null,
        null,
      ],
      28,
    );
    merges.push(
      `A${rows.length}:B${rows.length}`,
      `C${rows.length}:D${rows.length}`,
      `E${rows.length}:G${rows.length}`,
    );
    if (m.packingNote) {
      pushRow([null], 4);
      pushRow(
        [
          { v: `Packing note: ${m.packingNote}`, style: 17 },
        ],
        rowHeightForLines(lineCount(m.packingNote), 14, 6),
      );
      merges.push(`A${rows.length}:G${rows.length}`);
    }
    if (m.trackingNumber) {
      pushRow(
        [
          {
            v: `Tracking: ${m.carrier || "—"} · ${m.trackingNumber}`,
            style: 17,
          },
        ],
        18,
      );
      merges.push(`A${rows.length}:G${rows.length}`);
    }
    pushRow([null], 8);
  } else {
    pushRow([null], 8);
  }

  if (showMoney) {
    pushRow(
      [
        { v: "No", style: 5 },
        { v: "Commodity", style: 5 },
        { v: "Puffs", style: 5 },
        { v: "Description of goods", style: 5 },
        { v: "Unit price (USD)", style: 5 },
        { v: "Quantity", style: 5 },
        { v: "Total Price (USD)", style: 5 },
      ],
      24,
    );
    input.items.forEach((item, index) => {
      const parts = invoiceLineParts(item.name);
      pushRow(
        [
          { t: "n", v: index + 1, style: 7 },
          { v: parts.commodity, style: 6 },
          { v: parts.puffs, style: 7 },
          { v: parts.description, style: 6 },
          { t: "n", v: money(item.unitPrice), style: 8 },
          { t: "n", v: item.quantity, style: 7 },
          { t: "n", v: money(item.unitPrice * item.quantity), style: 8 },
        ],
        22,
      );
    });
    if (discount > 0) {
      const label =
        input.rebateAppliedUsd && input.rebateAppliedUsd > 0
          ? "Discount / rebate credit"
          : "Discount";
      pushRow([
        { v: "", style: 9 },
        { v: label, style: 9 },
        { v: "", style: 9 },
        { v: "", style: 9 },
        { v: "", style: 9 },
        { v: "", style: 9 },
        { t: "n", v: -money(discount), style: 10 },
      ]);
      merges.push(`B${rows.length}:D${rows.length}`);
    }
    if (shipping > 0) {
      pushRow([
        { v: "", style: 9 },
        { v: "Shipping", style: 9 },
        { v: "", style: 9 },
        { v: "", style: 9 },
        { v: "", style: 9 },
        { v: "", style: 9 },
        { t: "n", v: money(shipping), style: 10 },
      ]);
      merges.push(`B${rows.length}:D${rows.length}`);
    }
    pushRow([
      { v: "", style: 9 },
      { v: "Total", style: 9 },
      { v: "", style: 9 },
      { v: "", style: 9 },
      { v: "", style: 9 },
      { t: "n", v: qtyTotal, style: 9 },
      { t: "n", v: money(grand), style: 10 },
    ]);
    merges.push(`B${rows.length}:D${rows.length}`);
  } else {
    const source =
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
    function packingCases(line: {
      sku: string;
      quantity: number;
      boxes?: number | null;
    }) {
      if (line.boxes != null) return line.boxes;
      if (!isCasePackedSku(line.sku)) return null;
      const n = casesFromPcs(line.quantity);
      return n > 0 ? n : null;
    }
    pushRow(
      [
        { v: "No", style: 5 },
        { v: "Commodity", style: 5 },
        { v: "Puffs", style: 5 },
        { v: "Description of goods", style: 5 },
        { v: "Size", style: 5 },
        { v: "Quantity", style: 5 },
        { v: "Case", style: 5 },
      ],
      24,
    );
    source.forEach((line, index) => {
      const parts = invoiceLineParts(line.name);
      const description =
        (line.flavor || "").trim() || parts.description;
      const cases = packingCases(line);
      pushRow(
        [
          { t: "n", v: index + 1, style: 7 },
          { v: parts.commodity, style: 6 },
          { v: parts.puffs, style: 7 },
          { v: description, style: 6 },
          { v: line.size || "—", style: 7 },
          { t: "n", v: line.quantity, style: 7 },
          {
            v: cases != null ? cases : "—",
            t: cases != null ? "n" : "s",
            style: 7,
          },
        ],
        22,
      );
    });
    const boxesTotal = source.reduce((s, l) => s + (packingCases(l) ?? 0), 0);
    pushRow([
      { v: "", style: 9 },
      { v: "Total", style: 9 },
      { v: "", style: 9 },
      { v: "", style: 9 },
      { v: "", style: 9 },
      {
        t: "n",
        v: source.reduce((s, l) => s + l.quantity, 0),
        style: 9,
      },
      { v: boxesTotal || "—", style: 9 },
    ]);
    merges.push(`B${rows.length}:E${rows.length}`);
  }

  if (showMoney) {
    pushRow([null], 10);
    pushRow([{ v: "Bank Information", style: 4 }]);
    merges.push(`A${rows.length}:G${rows.length}`);
    for (const [label, value] of [
      ["Company", bank.companyName],
      ["Bank account", bank.accountNumber],
      ["Bank name", bank.bankName],
      ["Bank address", bank.bankAddress],
      ["Swift code", bank.swiftCode],
    ] as Array<[string, string]>) {
      const text = String(value || "");
      pushRow(
        [{ v: label, style: 3 }, { v: text, style: 13 }],
        rowHeightForLines(lineCount(text), 14, 6),
      );
      merges.push(`B${rows.length}:G${rows.length}`);
    }
  }

  pushRow([null], 12);
  pushRow(
    [
      {
        v: "Adults 21+ only. Nicotine is an addictive chemical.",
        style: 11,
      },
    ],
    30,
  );
  merges.push(`A${rows.length}:G${rows.length}`);

  const sheetRowsXml = rows
    .map((row, idx) => {
      const r = idx + 1;
      const ht = row.height ? ` ht="${row.height}" customHeight="1"` : "";
      const cells = row.cells
        .map((c, col) => (c ? cellXml(r, col, c) : ""))
        .filter(Boolean)
        .join("");
      return `<row r="${r}"${ht}>${cells}</row>`;
    })
    .join("");

  const drawingRel = logo ? `<drawing r:id="rId1"/>` : "";

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:G${rows.length}"/>
  <sheetViews>
    <sheetView workbookViewId="0" showGridLines="0"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>
    <col min="1" max="1" width="11" customWidth="1"/>
    <col min="2" max="2" width="20" customWidth="1"/>
    <col min="3" max="3" width="20" customWidth="1"/>
    <col min="4" max="4" width="26" customWidth="1"/>
    <col min="5" max="5" width="11" customWidth="1"/>
    <col min="6" max="6" width="18" customWidth="1"/>
    <col min="7" max="7" width="20" customWidth="1"/>
  </cols>
  <sheetData>${sheetRowsXml}</sheetData>
  <mergeCells count="${merges.length}">${merges.map(mergeXml).join("")}</mergeCells>
  <pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
  <pageSetup orientation="portrait" fitToWidth="1" fitToHeight="0" paperSize="1"/>
  ${drawingRel}
</worksheet>`;

  const sheetName = xmlText(TITLES[input.type].slice(0, 31));
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${sheetName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypes = logo
    ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`
    : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const entries: { name: string; data: Buffer }[] = [
    { name: "[Content_Types].xml", data: Buffer.from(contentTypes, "utf8") },
    { name: "_rels/.rels", data: Buffer.from(rootRels, "utf8") },
    { name: "xl/workbook.xml", data: Buffer.from(workbookXml, "utf8") },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: Buffer.from(workbookRels, "utf8"),
    },
    { name: "xl/styles.xml", data: Buffer.from(stylesXml, "utf8") },
    { name: "xl/worksheets/sheet1.xml", data: Buffer.from(sheetXml, "utf8") },
  ];

  if (logo) {
    const cx = Math.round(logo.width * 9525);
    const cy = Math.round(logo.height * 9525);
    const drawingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <xdr:oneCellAnchor>
    <xdr:from>
      <xdr:col>0</xdr:col>
      <xdr:colOff>0</xdr:colOff>
      <xdr:row>0</xdr:row>
      <xdr:rowOff>0</xdr:rowOff>
    </xdr:from>
    <xdr:ext cx="${cx}" cy="${cy}"/>
    <xdr:pic>
      <xdr:nvPicPr>
        <xdr:cNvPr id="1" name="UMAXES"/>
        <xdr:cNvPicPr/>
      </xdr:nvPicPr>
      <xdr:blipFill>
        <a:blip r:embed="rId1"/>
        <a:stretch><a:fillRect/></a:stretch>
      </xdr:blipFill>
      <xdr:spPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="${cx}" cy="${cy}"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
      </xdr:spPr>
    </xdr:pic>
    <xdr:clientData/>
  </xdr:oneCellAnchor>
</xdr:wsDr>`;

    const drawingRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
</Relationships>`;

    const sheetRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`;

    entries.push(
      {
        name: "xl/worksheets/_rels/sheet1.xml.rels",
        data: Buffer.from(sheetRels, "utf8"),
      },
      {
        name: "xl/drawings/drawing1.xml",
        data: Buffer.from(drawingXml, "utf8"),
      },
      {
        name: "xl/drawings/_rels/drawing1.xml.rels",
        data: Buffer.from(drawingRels, "utf8"),
      },
      { name: "xl/media/image1.png", data: logo.data },
    );
  }

  return zipStore(entries);
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
      `Cases: ${m.boxCount ?? "—"}   CBM: ${m.cbm ?? "—"}   Weight (kg): ${m.weightKg ?? "—"}`,
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
    textLines.push("No  Commodity / Puffs / Description / Size     Qty  Case");
    source.forEach((line, i) => {
      const parts = invoiceLineParts(line.name);
      const description =
        ("flavor" in line && (line.flavor || "").trim()) ||
        parts.description;
      const size =
        "size" in line && line.size ? String(line.size) : "—";
      let boxes = "—";
      if ("boxes" in line && line.boxes != null) {
        boxes = String(line.boxes);
      } else if (isCasePackedSku(line.sku)) {
        const n = casesFromPcs(line.quantity);
        if (n > 0) boxes = String(n);
      }
      textLines.push(
        `${String(i + 1).padStart(2, " ")}  ${description.slice(0, 36).padEnd(36, " ")}  ${String(line.quantity).padStart(4, " ")}  ${boxes.padStart(4, " ")}`,
      );
      textLines.push(
        `    ${parts.commodity} · ${parts.puffs} · Size ${size}`,
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
