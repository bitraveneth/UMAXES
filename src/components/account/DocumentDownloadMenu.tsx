"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
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
  variant = "storefront",
  label = "Choose format",
}: {
  orderId: string;
  type: BuyerDocType;
  compact?: boolean;
  variant?: "storefront" | "admin";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pdf = documentFileHref(orderId, type, "pdf");
  const xlsx = documentFileHref(orderId, type, "xlsx");
  const admin = variant === "admin";

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerClass = admin
    ? "admin-btn admin-btn-secondary admin-btn-sm"
    : compact
      ? "inline-flex items-center gap-1.5 border border-black/12 bg-white px-2.5 py-1.5 font-display text-xs font-semibold text-black transition hover:border-[#1b4f72] hover:text-[#1b4f72]"
      : "inline-flex items-center gap-2 border border-black/12 bg-white px-3.5 py-2.5 font-display text-sm font-semibold text-black transition hover:border-[#1b4f72] hover:text-[#1b4f72]";

  const itemClass = admin
    ? "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--admin-text)] hover:bg-[var(--admin-brand-50)]"
    : "flex w-full items-center gap-2 px-3 py-2.5 text-left font-display text-sm font-semibold text-black hover:bg-[#eef3f7]";

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={triggerClass}
      >
        {label}
        <ChevronDown
          className={`${compact || admin ? "h-3.5 w-3.5" : "h-4 w-4"} ${open ? "rotate-180" : ""} transition`}
          strokeWidth={2}
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute top-[calc(100%+6px)] right-0 z-30 min-w-[11.5rem] overflow-hidden border border-black/10 bg-white py-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ${
            admin ? "rounded-lg" : "rounded-xl"
          }`}
        >
          <p className="px-3 pt-1.5 pb-1 font-display text-[10px] font-semibold tracking-[0.14em] text-black/45 uppercase">
            Download as
          </p>
          <a
            role="menuitem"
            href={pdf}
            className={itemClass}
            onClick={(e) => e.stopPropagation()}
          >
            <FileText className="h-4 w-4 shrink-0" strokeWidth={1.85} />
            PDF
          </a>
          <a
            role="menuitem"
            href={xlsx}
            className={itemClass}
            onClick={(e) => e.stopPropagation()}
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" strokeWidth={1.85} />
            Excel
          </a>
        </div>
      ) : null}
    </div>
  );
}
