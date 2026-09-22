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

const COLS = 7;

const LOGO_PATH = path.join(
  process.cwd(),
  "public",
  "images",
  "logo",
  "umaxes-blue.png",
);

function money(n: number) {
  return Math.round(n * 100) / 100;
}

function dash(value?: string | null) {
  const v = (value || "").trim();
  return v || "—";
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

type CellOpts = {
  style?: string;
  mergeAcross?: number;
};

function cell(value: string | number | null | undefined, opts: CellOpts = {}) {
  const style = opts.style ? ` ss:StyleID="${opts.style}"` : "";
  const merge =
    opts.mergeAcross && opts.mergeAcross > 0
      ? ` ss:MergeAcross="${opts.mergeAcross}"`
      : "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell${style}${merge}><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell${style}${merge}><Data ss:Type="String">${xmlEscape(String(value ?? ""))}</Data></Cell>`;
}

function emptyCells(count: number, style?: string) {
  return Array.from({ length: count }, () => cell("", { style })).join("");
}

function rowXml(cellsXml: string, height?: number) {
  const h = height ? ` ss:Height="${height}"` : "";
  return `<Row${h}>${cellsXml}</Row>`;
}

function kvPair(label: string, value: string) {
  return rowXml(
    `${cell(label, { style: "label" })}${cell(value, {
      style: "text",
      mergeAcross: COLS - 2,
    })}`,
  );
}

function stylesXml() {
  return `<Styles>
  <Style ss:ID="Default"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="title"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="18" ss:Bold="1" ss:Color="#172033"/></Style>
  <Style ss:ID="meta"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="11" ss:Bold="1"/></Style>
  <Style ss:ID="label"><Alignment ss:Horizontal="Left" ss:Vertical="Top"/><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#172033"/></Style>
  <Style ss:ID="text"><Alignment ss:Horizontal="Left" ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="section"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="12" ss:Bold="1" ss:Color="#172033"/></Style>
  <Style ss:ID="fact"><Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10" ss:Color="#3F4F63"/></Style>
  <Style ss:ID="th"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/><Interior ss:Color="#C5D9F1" ss:Pattern="Solid"/></Style>
  <Style ss:ID="td"><Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="tdc"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="tdn"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:FontName="Arial" ss:Size="10"/><NumberFormat ss:Format="&quot;$&quot;#,##0.00"/></Style>
  <Style ss:ID="total"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/><Interior ss:Color="#EEF4FB" ss:Pattern="Solid"/></Style>
  <Style ss:ID="totaln"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/><Interior ss:Color="#EEF4FB" ss:Pattern="Solid"/><NumberFormat ss:Format="&quot;$&quot;#,##0.00"/></Style>
  <Style ss:ID="sum"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/><Interior ss:Color="#F7FAFC" ss:Pattern="Solid"/></Style>
  <Style ss:ID="sumn"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/><Interior ss:Color="#F7FAFC" ss:Pattern="Solid"/><NumberFormat ss:Format="&quot;$&quot;#,##0.00"/></Style>
  <Style ss:ID="footer"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#3D1605"/><Interior ss:Color="#FFF6EF" ss:Pattern="Solid"/></Style>
</Styles>`;
}

/** SpreadsheetML Excel — no exceljs dependency (Turbopack-safe). */
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
  const linesTotal = input.items.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );
  const discount = input.discount ?? 0;
  const shipping = input.shipping ?? 0;
  const grand = input.total ?? linesTotal;

  const rows: string[] = [];
  rows.push(
    rowXml(cell(TITLES[input.type], { style: "title", mergeAcross: COLS - 1 }), 28),
  );
  rows.push(
    rowXml(
      cell(`${NUMBER_LABELS[input.type]} ${input.docNumber}`, {
        style: "meta",
        mergeAcross: COLS - 1,
      }),
    ),
  );
  rows.push(
    rowXml(
      cell(`Issued date: ${issued}`, { style: "text", mergeAcross: COLS - 1 }),
    ),
  );
  rows.push(rowXml(emptyCells(COLS)));

  rows.push(rowXml(cell("Vendor", { style: "section", mergeAcross: COLS - 1 })));
  rows.push(kvPair("Company", seller.legalName || seller.name));
  rows.push(kvPair("Address", sellerAddressText()));
  rows.push(kvPair("Mobile", dash(seller.phone)));
  rows.push(kvPair("Email", dash(seller.email)));
  rows.push(rowXml(emptyCells(COLS)));

  rows.push(rowXml(cell("Buyer", { style: "section", mergeAcross: COLS - 1 })));
  rows.push(kvPair("Company", input.companyName));
  rows.push(kvPair("Name", dash(input.clientName)));
  rows.push(kvPair("Address", addressText(input.addressSnap)));
  rows.push(kvPair("Contact", dash(buyerContact)));
  if (input.companyTaxId) rows.push(kvPair("Tax ID", input.companyTaxId));
  rows.push(rowXml(emptyCells(COLS)));

  rows.push(
    rowXml(
      cell(factLines(input, showMoney).join("   |   "), {
        style: "fact",
        mergeAcross: COLS - 1,
      }),
      36,
    ),
  );
  rows.push(rowXml(emptyCells(COLS)));

  if (!showMoney && input.packingMeta) {
    const m = input.packingMeta;
    rows.push(
      rowXml(
        [
          cell("Boxes", { style: "label" }),
          cell(m.boxCount ?? "—", { style: "text" }),
          cell("CBM", { style: "label" }),
          cell(m.cbm ?? "—", { style: "text" }),
          cell("Weight (kg)", { style: "label" }),
          cell(m.weightKg ?? "—", { style: "text" }),
          cell("", { style: "text" }),
        ].join(""),
      ),
    );
    if (m.packingNote) {
      rows.push(kvPair("Packing note", m.packingNote));
    }
    if (m.trackingNumber) {
      rows.push(
        kvPair("Tracking", `${m.carrier || "—"} · ${m.trackingNumber}`),
      );
    }
    rows.push(rowXml(emptyCells(COLS)));
  }

  if (showMoney) {
    rows.push(
      rowXml(
        [
          cell("No", { style: "th" }),
          cell("Commodity", { style: "th" }),
          cell("Puffs", { style: "th" }),
          cell("Description of goods", { style: "th" }),
          cell("Unit price (USD)", { style: "th" }),
          cell("Quantity", { style: "th" }),
          cell("Total Price (USD)", { style: "th" }),
        ].join(""),
        24,
      ),
    );
    input.items.forEach((item, index) => {
      const parts = invoiceLineParts(item.name);
      rows.push(
        rowXml(
          [
            cell(index + 1, { style: "tdc" }),
            cell(parts.commodity, { style: "td" }),
            cell(parts.puffs, { style: "tdc" }),
            cell(parts.description, { style: "td" }),
            cell(money(item.unitPrice), { style: "tdn" }),
            cell(item.quantity, { style: "tdc" }),
            cell(money(item.unitPrice * item.quantity), { style: "tdn" }),
          ].join(""),
        ),
      );
    });
    if (discount > 0) {
      const label =
        input.rebateAppliedUsd && input.rebateAppliedUsd > 0
          ? "Discount / rebate credit"
          : "Discount";
      rows.push(
        rowXml(
          [
            cell("", { style: "sum" }),
            cell(label, { style: "sum", mergeAcross: 2 }),
            cell("", { style: "sum" }),
            cell("", { style: "sum" }),
            cell(-money(discount), { style: "sumn" }),
          ].join(""),
        ),
      );
    }
    if (shipping > 0) {
      rows.push(
        rowXml(
          [
            cell("", { style: "sum" }),
            cell("Shipping", { style: "sum", mergeAcross: 2 }),
            cell("", { style: "sum" }),
            cell("", { style: "sum" }),
            cell(money(shipping), { style: "sumn" }),
          ].join(""),
        ),
      );
    }
    rows.push(
      rowXml(
        [
          cell("", { style: "total" }),
          cell("Total", { style: "total", mergeAcross: 2 }),
          cell("", { style: "total" }),
          cell(qtyTotal, { style: "total" }),
          cell(money(grand), { style: "totaln" }),
        ].join(""),
      ),
    );
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
    rows.push(
      rowXml(
        [
          cell("No", { style: "th" }),
          cell("SKU", { style: "th" }),
          cell("Item", { style: "th" }),
          cell("Flavor", { style: "th" }),
          cell("Size", { style: "th" }),
          cell("Qty", { style: "th" }),
          cell("Boxes", { style: "th" }),
        ].join(""),
        24,
      ),
    );
    source.forEach((line, index) => {
      const parts = invoiceLineParts(line.name);
      rows.push(
        rowXml(
          [
            cell(index + 1, { style: "tdc" }),
            cell(line.sku, { style: "tdc" }),
            cell(parts.description, { style: "td" }),
            cell(line.flavor || parts.description, { style: "td" }),
            cell(line.size || "—", { style: "tdc" }),
            cell(line.quantity, { style: "tdc" }),
            cell(line.boxes ?? "—", { style: "tdc" }),
          ].join(""),
        ),
      );
    });
    const boxesTotal = source.reduce((s, l) => s + (l.boxes ?? 0), 0);
    rows.push(
      rowXml(
        [
          cell("", { style: "total" }),
          cell("Total", { style: "total", mergeAcross: 3 }),
          cell(
            source.reduce((s, l) => s + l.quantity, 0),
            { style: "total" },
          ),
          cell(boxesTotal || "—", { style: "total" }),
        ].join(""),
      ),
    );
  }

  if (showMoney) {
    rows.push(rowXml(emptyCells(COLS)));
    rows.push(
      rowXml(
        cell("Bank Information", { style: "section", mergeAcross: COLS - 1 }),
      ),
    );
    rows.push(kvPair("Company", bank.companyName));
    rows.push(kvPair("Bank account", bank.accountNumber));
    rows.push(kvPair("Bank name", bank.bankName));
    rows.push(kvPair("Bank address", bank.bankAddress));
    rows.push(kvPair("Swift code", bank.swiftCode));
  }

  rows.push(rowXml(emptyCells(COLS)));
  rows.push(
    rowXml(
      cell("Adults 21+ only. Nicotine is an addictive chemical.", {
        style: "footer",
        mergeAcross: COLS - 1,
      }),
      28,
    ),
  );

  const widths = [42, 120, 110, 200, 100, 70, 110]
    .map((w) => `<Column ss:AutoFitWidth="0" ss:Width="${w}"/>`)
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 ${stylesXml()}
 <Worksheet ss:Name="${xmlEscape(TITLES[input.type].slice(0, 31))}">
  <Table ss:DefaultRowHeight="18">
   ${widths}
   ${rows.join("\n   ")}
  </Table>
 </Worksheet>
</Workbook>`;
  return Buffer.from(xml, "utf8");
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
  if (fs.existsSync(LOGO_PATH)) {
    try {
      const resized = await sharp(LOGO_PATH)
        .resize({ width: 170, height: 50, fit: "inside" })
        .jpeg({ quality: 90 })
        .toBuffer({ resolveWithObject: true });
      logoJpeg = resized.data;
      logoW = resized.info.width;
      logoH = resized.info.height;
    } catch {
      logoJpeg = null;
    }
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
