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

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

type CellOpts = {
  style?: string;
  mergeAcross?: number;
  type?: "String" | "Number";
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

function stylesXml() {
  return `<Styles>
  <Style ss:ID="Default"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="title">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    <Font ss:FontName="Arial" ss:Size="18" ss:Bold="1" ss:Color="#172033"/>
  </Style>
  <Style ss:ID="meta">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="label">
    <Alignment ss:Horizontal="Left" ss:Vertical="Top"/>
    <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#172033"/>
  </Style>
  <Style ss:ID="text">
    <Alignment ss:Horizontal="Left" ss:Vertical="Top" ss:WrapText="1"/>
    <Font ss:FontName="Arial" ss:Size="10"/>
  </Style>
  <Style ss:ID="section">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    <Font ss:FontName="Arial" ss:Size="12" ss:Bold="1" ss:Color="#172033"/>
  </Style>
  <Style ss:ID="fact">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Arial" ss:Size="10" ss:Color="#3F4F63"/>
  </Style>
  <Style ss:ID="th">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Borders>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
    <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/>
    <Interior ss:Color="#C5D9F1" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="td">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/>
    <Borders>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
    <Font ss:FontName="Arial" ss:Size="10"/>
  </Style>
  <Style ss:ID="tdc">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Borders>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
    <Font ss:FontName="Arial" ss:Size="10"/>
  </Style>
  <Style ss:ID="tdn">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
    <Font ss:FontName="Arial" ss:Size="10"/>
    <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
  </Style>
  <Style ss:ID="total">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Borders>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
    <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/>
    <Interior ss:Color="#EEF4FB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="totaln">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
    <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/>
    <Interior ss:Color="#EEF4FB" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
  </Style>
  <Style ss:ID="sum">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Borders>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
    <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/>
    <Interior ss:Color="#F7FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sumn">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
    <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/>
    <Interior ss:Color="#F7FAFC" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
  </Style>
  <Style ss:ID="footer">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#3D1605"/>
    <Interior ss:Color="#FFF6EF" ss:Pattern="Solid"/>
  </Style>
</Styles>`;
}

function columnWidthsXml() {
  // Match invoice table proportions roughly
  const widths = [42, 120, 110, 200, 100, 70, 110];
  return widths
    .map((w) => `<Column ss:AutoFitWidth="0" ss:Width="${w}"/>`)
    .join("");
}

/** Same layout as on-screen / PDF invoice — title, parties, line items, bank. */
export function buildInvoiceXlsx(input: InvoiceExportInput) {
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
      cell(`Issued date: ${issued}`, {
        style: "text",
        mergeAcross: COLS - 1,
      }),
    ),
  );
  rows.push(rowXml(emptyCells(COLS)));

  rows.push(
    rowXml(cell("Vendor", { style: "section", mergeAcross: COLS - 1 })),
  );
  rows.push(kvPair("Company", seller.legalName || seller.name));
  rows.push(kvPair("Address", sellerAddressText()));
  rows.push(kvPair("Mobile", dash(seller.phone)));
  rows.push(kvPair("Email", dash(seller.email)));
  rows.push(rowXml(emptyCells(COLS)));

  rows.push(
    rowXml(cell("Buyer", { style: "section", mergeAcross: COLS - 1 })),
  );
  rows.push(kvPair("Company", input.companyName));
  rows.push(kvPair("Name", dash(input.clientName)));
  rows.push(kvPair("Address", addressText(input.addressSnap)));
  rows.push(kvPair("Contact", dash(buyerContact)));
  if (input.companyTaxId) {
    rows.push(kvPair("Tax ID", input.companyTaxId));
  }
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
      const amount = money(item.unitPrice * item.quantity);
      rows.push(
        rowXml(
          [
            cell(index + 1, { style: "tdc" }),
            cell(parts.commodity, { style: "td" }),
            cell(parts.puffs, { style: "tdc" }),
            cell(parts.description, { style: "td" }),
            cell(money(item.unitPrice), { style: "tdn" }),
            cell(item.quantity, { style: "tdc" }),
            cell(amount, { style: "tdn" }),
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

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 ${stylesXml()}
 <Worksheet ss:Name="${xmlEscape(TITLES[input.type].slice(0, 31))}">
  <Table ss:DefaultRowHeight="18">
   ${columnWidthsXml()}
   ${rows.join("\n   ")}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Portrait"/>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.5" x:Left="0.4" x:Right="0.4" x:Top="0.5"/>
   </PageSetup>
   <FitToPage/>
   <Print>
    <FitHeight>0</FitHeight>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
   </Print>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
  return Buffer.from(xml, "utf8");
}

function pdfEscape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(text: string, width = 92) {
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

/** Same content structure as Excel / on-screen invoice. */
export function buildInvoicePdf(input: InvoiceExportInput) {
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

  const lines: string[] = [
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
  ].filter((v) => v !== undefined) as string[];

  if (showMoney) {
    lines.push(
      "No  Commodity                 Puffs              Qty        Amount",
    );
    input.items.forEach((item, i) => {
      const parts = invoiceLineParts(item.name);
      const amount = money(item.unitPrice * item.quantity).toFixed(2);
      lines.push(
        `${String(i + 1).padStart(2, " ")}  ${parts.description.slice(0, 36).padEnd(36, " ")}  ${String(item.quantity).padStart(4, " ")}  $${amount.padStart(9, " ")}`,
      );
      lines.push(
        `    ${parts.commodity} · ${parts.puffs} · $${money(item.unitPrice).toFixed(2)}/pc`,
      );
    });
    if (discount > 0) {
      lines.push(
        `Discount / rebate                         −$${money(discount).toFixed(2)}`,
      );
    }
    if (shipping > 0) {
      lines.push(
        `Shipping                                   $${money(shipping).toFixed(2)}`,
      );
    }
    lines.push(
      `TOTAL  Qty ${qtyTotal}                       $${money(grand).toFixed(2)}`,
    );
    lines.push("");
    lines.push("Bank Information");
    lines.push(`Company: ${bank.companyName}`);
    lines.push(`Bank account: ${bank.accountNumber}`);
    lines.push(`Bank name: ${bank.bankName}`);
    lines.push(`Bank address: ${bank.bankAddress}`);
    lines.push(`Swift code: ${bank.swiftCode}`);
  } else {
    const source =
      input.packingLines && input.packingLines.length
        ? input.packingLines
        : input.items;
    lines.push("No  SKU                 Qty   Boxes");
    source.forEach((line, i) => {
      const boxes =
        "boxes" in line && line.boxes != null ? String(line.boxes) : "—";
      lines.push(
        `${String(i + 1).padStart(2, " ")}  ${(line.sku || "").padEnd(16, " ")}  ${String(line.quantity).padStart(4, " ")}  ${boxes.padStart(5, " ")}`,
      );
    });
  }

  lines.push("");
  lines.push("Adults 21+ only. Nicotine is an addictive chemical.");

  const content: string[] = [];
  let y = 760;
  const withBlanks = lines.flatMap((line) =>
    line === "" ? [""] : wrapLine(line),
  );

  for (const line of withBlanks) {
    if (y < 48) break;
    if (line === "") {
      y -= 10;
      continue;
    }
    content.push(`BT /F1 10 Tf 40 ${y} Td (${pdfEscape(line)}) Tj ET`);
    y -= 14;
  }

  const stream = content.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}
