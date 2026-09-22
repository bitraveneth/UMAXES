import ExcelJS from "exceljs";
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

const LOGO_PATH = path.join(
  process.cwd(),
  "public",
  "images",
  "logo",
  "umaxes-blue.png",
);

const ORANGE = "FFFF5B04";
const NAVY = "FF172033";
const MUTED = "FF3F4F63";
const HEADER_BG = "FFC5D9F1";
const TOTAL_BG = "FFEEF4FB";
const SUM_BG = "FFF7FAFC";
const FOOTER_BG = "FFFFF6EF";
const FOOTER_FG = "FF3D1605";
const THIN = { style: "thin" as const, color: { argb: "FF111111" } };
const ORANGE_BORDER = { style: "medium" as const, color: { argb: ORANGE } };

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

function applyBoxBorder(cell: ExcelJS.Cell, fill?: string) {
  cell.border = {
    top: THIN,
    left: THIN,
    bottom: THIN,
    right: THIN,
  };
  if (fill) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: fill },
    };
  }
  cell.font = { ...(cell.font || {}), name: "Arial", size: 10 };
  cell.alignment = {
    ...(cell.alignment || {}),
    vertical: "middle",
    wrapText: true,
  };
}

function styleHeaderCell(cell: ExcelJS.Cell) {
  applyBoxBorder(cell, HEADER_BG);
  cell.font = { name: "Arial", size: 10, bold: true };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
}

function moneyFmt(cell: ExcelJS.Cell) {
  cell.numFmt = '"$"#,##0.00';
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

/** Real .xlsx matching the on-screen invoice / print PDF layout. */
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

  const wb = new ExcelJS.Workbook();
  wb.creator = "UMAXES";
  wb.created = new Date();
  const ws = wb.addWorksheet(TITLES[input.type].slice(0, 31), {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
    properties: { defaultRowHeight: 18 },
  });

  ws.columns = [
    { key: "c1", width: 12 },
    { key: "c2", width: 18 },
    { key: "c3", width: 16 },
    { key: "c4", width: 28 },
    { key: "c5", width: 14 },
    { key: "c6", width: 11 },
    { key: "c7", width: 14 },
  ];

  // —— Header: logo left, title + meta right (same as HTML invoice) ——
  ws.getRow(1).height = 22;
  ws.getRow(2).height = 18;
  ws.getRow(3).height = 18;

  if (fs.existsSync(LOGO_PATH)) {
    const imageId = wb.addImage({
      buffer: fs.readFileSync(LOGO_PATH) as unknown as ExcelJS.Buffer,
      extension: "png",
    });
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 170, height: 50 },
      editAs: "oneCell",
    });
  }

  ws.mergeCells("E1:G1");
  const titleCell = ws.getCell("E1");
  titleCell.value = TITLES[input.type].toUpperCase();
  titleCell.font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: NAVY },
  };
  titleCell.alignment = { horizontal: "right", vertical: "middle" };

  ws.mergeCells("E2:G2");
  const noCell = ws.getCell("E2");
  noCell.value = `${NUMBER_LABELS[input.type]} ${input.docNumber}`;
  noCell.font = { name: "Arial", size: 11, bold: true };
  noCell.alignment = { horizontal: "right", vertical: "middle" };

  ws.mergeCells("E3:G3");
  const dateCell = ws.getCell("E3");
  dateCell.value = `Issued date: ${issued}`;
  dateCell.font = { name: "Arial", size: 10, color: { argb: MUTED } };
  dateCell.alignment = { horizontal: "right", vertical: "middle" };

  for (const col of [1, 2, 3, 4, 5, 6, 7]) {
    ws.getCell(3, col).border = { bottom: ORANGE_BORDER };
  }

  // —— Parties: Vendor | Buyer side-by-side ——
  let row = 5;
  ws.getCell(row, 1).value = "Vendor";
  ws.getCell(row, 1).font = {
    name: "Arial",
    size: 11,
    bold: true,
    color: { argb: NAVY },
  };
  ws.getCell(row, 5).value = "Buyer";
  ws.getCell(row, 5).font = {
    name: "Arial",
    size: 11,
    bold: true,
    color: { argb: NAVY },
  };
  row += 1;

  const vendorRows: Array<[string, string]> = [
    ["Company", seller.legalName || seller.name],
    ["Address", sellerAddressText()],
    ["Mobile", dash(seller.phone)],
    ["Email", dash(seller.email)],
  ];
  const buyerRows: Array<[string, string]> = [
    ["Company", input.companyName],
    ["Name", dash(input.clientName)],
    ["Address", addressText(input.addressSnap)],
    ["Contact", dash(buyerContact)],
  ];
  if (input.companyTaxId) {
    buyerRows.push(["Tax ID", input.companyTaxId]);
  }

  const partyCount = Math.max(vendorRows.length, buyerRows.length);
  for (let i = 0; i < partyCount; i++) {
    const v = vendorRows[i];
    const b = buyerRows[i];
    if (v) {
      ws.getCell(row, 1).value = v[0];
      ws.getCell(row, 1).font = { name: "Arial", size: 10, bold: true };
      ws.mergeCells(row, 2, row, 3);
      ws.getCell(row, 2).value = v[1];
      ws.getCell(row, 2).font = { name: "Arial", size: 10 };
      ws.getCell(row, 2).alignment = { wrapText: true, vertical: "top" };
    }
    if (b) {
      ws.getCell(row, 5).value = b[0];
      ws.getCell(row, 5).font = { name: "Arial", size: 10, bold: true };
      ws.mergeCells(row, 6, row, 7);
      ws.getCell(row, 6).value = b[1];
      ws.getCell(row, 6).font = { name: "Arial", size: 10 };
      ws.getCell(row, 6).alignment = { wrapText: true, vertical: "top" };
    }
    ws.getRow(row).height = v?.[0] === "Address" || b?.[0] === "Address" ? 36 : 18;
    row += 1;
  }

  row += 1;
  ws.mergeCells(row, 1, row, 7);
  const factsCell = ws.getCell(row, 1);
  factsCell.value = factLines(input, showMoney).join("   ·   ");
  factsCell.font = { name: "Arial", size: 10, color: { argb: MUTED } };
  factsCell.alignment = { wrapText: true, vertical: "middle" };
  ws.getRow(row).height = 28;
  row += 2;

  // —— Packing shipment meta (Boxes / CBM / Weight) ——
  if (!showMoney && input.packingMeta) {
    const meta = input.packingMeta;
    const boxes = meta.boxCount ?? "—";
    const cbm = meta.cbm ?? "—";
    const weight = meta.weightKg ?? "—";
    ws.getCell(row, 1).value = "Boxes";
    ws.getCell(row, 2).value = boxes;
    ws.getCell(row, 3).value = "CBM";
    ws.getCell(row, 4).value = cbm;
    ws.getCell(row, 5).value = "Weight (kg)";
    ws.getCell(row, 6).value = weight;
    for (const c of [1, 3, 5]) {
      ws.getCell(row, c).font = { name: "Arial", size: 9, bold: true, color: { argb: MUTED } };
    }
    for (const c of [2, 4, 6]) {
      ws.getCell(row, c).font = { name: "Arial", size: 14, bold: true };
    }
    row += 1;
    if (meta.packingNote) {
      ws.mergeCells(row, 1, row, 7);
      ws.getCell(row, 1).value = `Packing note: ${meta.packingNote}`;
      ws.getCell(row, 1).font = { name: "Arial", size: 10 };
      row += 1;
    }
    if (meta.trackingNumber) {
      ws.mergeCells(row, 1, row, 7);
      ws.getCell(row, 1).value =
        `Tracking: ${meta.carrier || "—"} · ${meta.trackingNumber}`;
      ws.getCell(row, 1).font = { name: "Arial", size: 10 };
      row += 1;
    }
    row += 1;
  }

  // —— Line items table ——
  if (showMoney) {
    const headers = [
      "No",
      "Commodity",
      "Puffs",
      "Description of goods",
      "Unit price (USD)",
      "Quantity",
      "Total Price (USD)",
    ];
    headers.forEach((h, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = h;
      styleHeaderCell(cell);
    });
    ws.getRow(row).height = 28;
    row += 1;

    input.items.forEach((item, index) => {
      const parts = invoiceLineParts(item.name);
      const amount = money(item.unitPrice * item.quantity);
      const values: Array<string | number> = [
        index + 1,
        parts.commodity,
        parts.puffs,
        parts.description,
        money(item.unitPrice),
        item.quantity,
        amount,
      ];
      values.forEach((v, i) => {
        const cell = ws.getCell(row, i + 1);
        cell.value = v;
        applyBoxBorder(cell);
        if (i === 0 || i === 2 || i === 5) {
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        }
        if (i === 4 || i === 6) moneyFmt(cell);
      });
      row += 1;
    });

    if (discount > 0) {
      const label =
        input.rebateAppliedUsd && input.rebateAppliedUsd > 0
          ? "Discount / rebate credit"
          : "Discount";
      for (let c = 1; c <= 7; c++) applyBoxBorder(ws.getCell(row, c), SUM_BG);
      ws.mergeCells(row, 2, row, 4);
      ws.getCell(row, 2).value = label;
      ws.getCell(row, 2).font = { name: "Arial", size: 10, bold: true };
      ws.getCell(row, 2).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(row, 7).value = -money(discount);
      moneyFmt(ws.getCell(row, 7));
      ws.getCell(row, 7).font = { name: "Arial", size: 10, bold: true };
      row += 1;
    }
    if (shipping > 0) {
      for (let c = 1; c <= 7; c++) applyBoxBorder(ws.getCell(row, c), SUM_BG);
      ws.mergeCells(row, 2, row, 4);
      ws.getCell(row, 2).value = "Shipping";
      ws.getCell(row, 2).font = { name: "Arial", size: 10, bold: true };
      ws.getCell(row, 2).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(row, 7).value = money(shipping);
      moneyFmt(ws.getCell(row, 7));
      ws.getCell(row, 7).font = { name: "Arial", size: 10, bold: true };
      row += 1;
    }

    for (let c = 1; c <= 7; c++) applyBoxBorder(ws.getCell(row, c), TOTAL_BG);
    ws.mergeCells(row, 2, row, 4);
    ws.getCell(row, 2).value = "Total";
    ws.getCell(row, 2).font = { name: "Arial", size: 10, bold: true };
    ws.getCell(row, 2).alignment = { horizontal: "center", vertical: "middle" };
    ws.getCell(row, 6).value = qtyTotal;
    ws.getCell(row, 6).font = { name: "Arial", size: 10, bold: true };
    ws.getCell(row, 6).alignment = { horizontal: "center", vertical: "middle" };
    ws.getCell(row, 7).value = money(grand);
    moneyFmt(ws.getCell(row, 7));
    ws.getCell(row, 7).font = { name: "Arial", size: 10, bold: true };
    row += 1;
  } else {
    const headers = ["No", "SKU", "Item", "Flavor", "Size", "Qty", "Boxes"];
    headers.forEach((h, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = h;
      styleHeaderCell(cell);
    });
    ws.getRow(row).height = 28;
    row += 1;

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

    source.forEach((line, index) => {
      const parts = invoiceLineParts(line.name);
      const values: Array<string | number> = [
        index + 1,
        line.sku,
        parts.description,
        line.flavor || parts.description,
        line.size || "—",
        line.quantity,
        line.boxes ?? "—",
      ];
      values.forEach((v, i) => {
        const cell = ws.getCell(row, i + 1);
        cell.value = v;
        applyBoxBorder(cell);
        if (i === 0 || i === 1 || i === 4 || i === 5 || i === 6) {
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
        }
      });
      row += 1;
    });

    for (let c = 1; c <= 7; c++) applyBoxBorder(ws.getCell(row, c), TOTAL_BG);
    ws.mergeCells(row, 2, row, 5);
    ws.getCell(row, 2).value = "Total";
    ws.getCell(row, 2).font = { name: "Arial", size: 10, bold: true };
    ws.getCell(row, 2).alignment = { horizontal: "center", vertical: "middle" };
    ws.getCell(row, 6).value = source.reduce((s, l) => s + l.quantity, 0);
    ws.getCell(row, 6).font = { name: "Arial", size: 10, bold: true };
    ws.getCell(row, 6).alignment = { horizontal: "center", vertical: "middle" };
    const boxesTotal = source.reduce((s, l) => s + (l.boxes ?? 0), 0);
    ws.getCell(row, 7).value = boxesTotal || "—";
    ws.getCell(row, 7).font = { name: "Arial", size: 10, bold: true };
    ws.getCell(row, 7).alignment = { horizontal: "center", vertical: "middle" };
    row += 1;
  }

  // —— Bank (PI / CI only) ——
  if (showMoney) {
    row += 1;
    ws.mergeCells(row, 1, row, 7);
    ws.getCell(row, 1).value = "Bank Information";
    ws.getCell(row, 1).font = {
      name: "Arial",
      size: 12,
      bold: true,
      color: { argb: NAVY },
    };
    row += 1;
    const bankRows: Array<[string, string]> = [
      ["Company", bank.companyName],
      ["Bank account", bank.accountNumber],
      ["Bank name", bank.bankName],
      ["Bank address", bank.bankAddress],
      ["Swift code", bank.swiftCode],
    ];
    for (const [label, value] of bankRows) {
      ws.getCell(row, 1).value = label;
      ws.getCell(row, 1).font = { name: "Arial", size: 10, bold: true };
      ws.mergeCells(row, 2, row, 7);
      ws.getCell(row, 2).value = value;
      ws.getCell(row, 2).font = { name: "Arial", size: 10 };
      ws.getCell(row, 2).alignment = { wrapText: true };
      if (label === "Bank address") ws.getRow(row).height = 32;
      row += 1;
    }
  }

  row += 1;
  ws.mergeCells(row, 1, row, 7);
  const footer = ws.getCell(row, 1);
  footer.value = "Adults 21+ only. Nicotine is an addictive chemical.";
  footer.font = { name: "Arial", size: 10, bold: true, color: { argb: FOOTER_FG } };
  footer.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: FOOTER_BG },
  };
  footer.alignment = { horizontal: "center", vertical: "middle" };
  footer.border = {
    top: { style: "thin", color: { argb: "FFFFD0AD" } },
    left: { style: "thin", color: { argb: "FFFFD0AD" } },
    bottom: { style: "thin", color: { argb: "FFFFD0AD" } },
    right: { style: "thin", color: { argb: "FFFFD0AD" } },
  };
  ws.getRow(row).height = 28;

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
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

/** Same content structure as Excel / on-screen invoice, with logo when available. */
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

  // Title block top-right (aligned with logo, same as HTML invoice)
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

  // Orange rule under header
  content.push("0.9 0.36 0.02 RG");
  content.push("2 w");
  content.push(`${marginX} ${y} m ${pageW - marginX} ${y} l S`);
  content.push("0 0 0 RG");
  content.push("1 w");
  y -= 20;

  // Skip title/date lines already drawn in header
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
      line.startsWith("TOTAL") ||
      line === TITLES[input.type];
    const font = bold ? "/F2 10 Tf" : "/F1 10 Tf";
    content.push(
      `BT ${font} ${marginX} ${y} Td (${pdfEscape(line)}) Tj ET`,
    );
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
    chunks.push(Buffer.from(`${num} 0 obj\n`, "utf8"), body, Buffer.from("\nendobj\n", "utf8"));
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
