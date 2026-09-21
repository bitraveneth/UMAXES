import { paymentLabels } from "@/lib/catalog";
import {
  invoiceLineParts,
  parseAddressSnap,
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
};

const TITLES: Record<InvoiceDocType, string> = {
  pi: "Proforma Invoice",
  packing: "Packing List",
  invoice: "Commercial Invoice",
};

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(value: string | number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell ss:StyleID="num"><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(String(value ?? ""))}</Data></Cell>`;
}

function row(values: Array<string | number>) {
  return `<Row>${values.map(cell).join("")}</Row>`;
}

function money(n: number) {
  return Math.round(n * 100) / 100;
}

export function buildInvoiceXlsx(input: InvoiceExportInput) {
  const addr = parseAddressSnap(input.addressSnap);
  const showMoney = input.type !== "packing";
  const headerRows = [
    row([TITLES[input.type]]),
    row(["Document", input.docNumber]),
    row(["Order", input.orderNumber]),
    row(["Date", input.createdAt.toISOString().slice(0, 10)]),
    row(["Company", input.companyName]),
    input.companyTaxId ? row(["Tax ID", input.companyTaxId]) : "",
    input.clientName ? row(["Contact", input.clientName]) : "",
    addr.recipientName ? row(["Ship to", addr.recipientName]) : "",
    addr.phone ? row(["Phone", addr.phone]) : "",
    row([
      "Address",
      [addr.line1, addr.city, addr.region, addr.postalCode, addr.country]
        .filter(Boolean)
        .join(", "),
    ]),
    input.paymentMethod && showMoney
      ? row(["Payment", paymentLabels[input.paymentMethod]])
      : "",
    "",
  ].filter(Boolean);

  let table: string;
  if (input.type === "packing") {
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
    table = [
      row(["#", "SKU", "Description", "Qty", "Boxes"]),
      ...source.map((line, i) => {
        const parts = invoiceLineParts(line.name);
        return row([
          i + 1,
          line.sku,
          parts.description,
          line.quantity,
          line.boxes ?? "",
        ]);
      }),
    ].join("");
  } else {
    table = [
      row(["#", "Item", "SKU", "Unit price", "Qty", "Amount"]),
      ...input.items.map((item, i) =>
        row([
          i + 1,
          item.name,
          item.sku,
          money(item.unitPrice),
          item.quantity,
          money(item.unitPrice * item.quantity),
        ]),
      ),
      input.discount
        ? row(["", "Discount / rebate", "", "", "", money(-input.discount)])
        : "",
      input.shipping
        ? row(["", "Shipping", "", "", "", money(input.shipping)])
        : "",
      row(["", "Total", "", "", "", money(input.total ?? 0)]),
    ]
      .filter(Boolean)
      .join("");
  }

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="num"><NumberFormat ss:Format="#,##0.00"/></Style>
 </Styles>
 <Worksheet ss:Name="${xmlEscape(TITLES[input.type].slice(0, 31))}">
  <Table>${headerRows.join("")}${table}</Table>
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

export function buildInvoicePdf(input: InvoiceExportInput) {
  const addr = parseAddressSnap(input.addressSnap);
  const showMoney = input.type !== "packing";
  const lines: string[] = [
    TITLES[input.type],
    input.docNumber,
    `Order ${input.orderNumber}  ·  ${input.createdAt.toISOString().slice(0, 10)}`,
    "",
    `Bill to: ${input.companyName}`,
    input.clientName ? `Contact: ${input.clientName}` : "",
    addr.recipientName ? `Ship to: ${addr.recipientName}` : "",
    addr.phone ? `Phone: ${addr.phone}` : "",
    [addr.line1, addr.city, addr.region, addr.postalCode, addr.country]
      .filter(Boolean)
      .join(", "),
    input.paymentMethod && showMoney
      ? `Payment: ${paymentLabels[input.paymentMethod]}`
      : "",
    "",
  ].filter((v) => v !== "");

  if (input.type === "packing") {
    const source =
      input.packingLines && input.packingLines.length
        ? input.packingLines
        : input.items;
    lines.push("#  SKU                 Qty");
    source.forEach((line, i) => {
      lines.push(
        `${String(i + 1).padStart(2, " ")}  ${(line.sku || "").padEnd(16, " ")}  ${line.quantity}`,
      );
    });
  } else {
    lines.push("#  Item                                      Qty     Amount");
    input.items.forEach((item, i) => {
      const amount = money(item.unitPrice * item.quantity).toFixed(2);
      const name = item.name.slice(0, 38).padEnd(38, " ");
      lines.push(
        `${String(i + 1).padStart(2, " ")}  ${name}  ${String(item.quantity).padStart(4, " ")}  ${amount.padStart(9, " ")}`,
      );
    });
    if (input.discount) {
      lines.push(`Discount / rebate                         −${money(input.discount).toFixed(2)}`);
    }
    lines.push(`TOTAL                                     ${money(input.total ?? 0).toFixed(2)}`);
  }

  const content: string[] = [];
  let y = 760;
  const wrapped = lines.flatMap((line) => wrapLine(line));
  for (const line of wrapped) {
    if (y < 56) break;
    content.push(`BT /F1 10 Tf 48 ${y} Td (${pdfEscape(line)}) Tj ET`);
    y -= 16;
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
