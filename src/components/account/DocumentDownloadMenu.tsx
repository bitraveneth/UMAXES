"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import type { BuyerDocType } from "@/lib/buyer-order";

export function documentFileHref(
  orderId: string,
  type: BuyerDocType,
  format: "pdf" | "xlsx",
) {
  return `/api/orders/${orderId}/docs?type=${type}&format=${format}`;
}

export default function DocumentDownloadMenu({
  orderId,
  type,
  compact = false,
}: {
  orderId: string;
  type: BuyerDocType;
  compact?: boolean;
}) {
  const pdf = documentFileHref(orderId, type, "pdf");
  const xlsx = documentFileHref(orderId, type, "xlsx");

  return (
    <div className={`flex ${compact ? "gap-1.5" : "gap-2"}`}>
      <a
        href={pdf}
        className={`inline-flex items-center gap-1.5 border border-black/12 bg-white font-display font-semibold text-black transition hover:border-[#1b4f72] hover:text-[#1b4f72] ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
        }`}
      >
        <FileText className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={1.85} />
        PDF
      </a>
      <a
        href={xlsx}
        className={`inline-flex items-center gap-1.5 border border-black/12 bg-white font-display font-semibold text-black transition hover:border-[#1b4f72] hover:text-[#1b4f72] ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
        }`}
      >
        <FileSpreadsheet
          className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
          strokeWidth={1.85}
        />
        Excel
      </a>
    </div>
  );
}
