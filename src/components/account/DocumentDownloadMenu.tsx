"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import type { BuyerDocType } from "@/lib/buyer-order";

export function documentFileHref(
  orderId: string,
  type: BuyerDocType,
  format: "pdf" | "xlsx" | "csv",
) {
  return `/api/orders/${orderId}/docs?type=${type}&format=${format}`;
}

export default function DocumentDownloadMenu({
  orderId,
  type,
  compact = false,
  variant = "storefront",
}: {
  orderId: string;
  type: BuyerDocType;
  compact?: boolean;
  variant?: "storefront" | "admin";
}) {
  const pdf = documentFileHref(orderId, type, "pdf");
  const xlsx = documentFileHref(orderId, type, "xlsx");
  const csv = documentFileHref(orderId, type, "csv");
  const admin = variant === "admin";

  if (admin) {
    return (
      <div
        className="admin-doc-pills"
        onClick={(e) => e.stopPropagation()}
        role="group"
        aria-label="Download format"
      >
        <a href={pdf} title="Download PDF">
          <FileText className="h-3.5 w-3.5" strokeWidth={1.85} />
          PDF
        </a>
        <a href={xlsx} title="Download Excel (xlsx) — Excel / WPS / LibreOffice">
          <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.85} />
          Excel
        </a>
        <a href={csv} title="Download CSV">
          CSV
        </a>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex overflow-hidden border border-black/12 bg-white ${
        compact ? "" : "shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      }`}
      role="group"
      aria-label="Download format"
    >
      <a
        href={pdf}
        className={`inline-flex items-center gap-1.5 border-r border-black/10 font-display font-semibold text-black transition hover:bg-[#eef3f7] hover:text-[#1b4f72] ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2.5 text-sm"
        }`}
      >
        <FileText
          className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
          strokeWidth={1.85}
        />
        PDF
      </a>
      <a
        href={xlsx}
        title="Excel / WPS / LibreOffice"
        className={`inline-flex items-center gap-1.5 border-r border-black/10 font-display font-semibold text-black transition hover:bg-[#eef3f7] hover:text-[#1b4f72] ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2.5 text-sm"
        }`}
      >
        <FileSpreadsheet
          className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
          strokeWidth={1.85}
        />
        Excel
      </a>
      <a
        href={csv}
        title="CSV"
        className={`inline-flex items-center gap-1.5 font-display font-semibold text-black transition hover:bg-[#eef3f7] hover:text-[#1b4f72] ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2.5 text-sm"
        }`}
      >
        CSV
      </a>
    </div>
  );
}
