"use client";

import { useEffect, useState } from "react";
import {
  PCS_PER_CASE,
  casesFromPcs,
  pcsFromCases,
} from "@/lib/pack";

type QtyStepperProps = {
  value: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  /** When true, setting below min removes (calls onChange(0)) */
  allowRemove?: boolean;
  ariaLabel?: string;
  size?: "sm" | "md";
};

/** +/- stepper with a typable quantity field. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99999,
  allowRemove = false,
  ariaLabel = "Quantity",
  size = "md",
}: QtyStepperProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(raw: string) {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits === "") {
      if (allowRemove) {
        onChange(0);
        return;
      }
      onChange(min);
      setDraft(String(min));
      return;
    }
    let next = parseInt(digits, 10) || min;
    next = Math.min(max, Math.max(allowRemove ? 0 : min, next));
    if (allowRemove && next < min) {
      onChange(0);
      return;
    }
    onChange(next);
    setDraft(String(next));
  }

  const btn =
    size === "sm"
      ? "flex h-9 w-9 items-center justify-center font-display text-lg text-black transition hover:text-umx-orange"
      : "flex h-12 w-11 items-center justify-center font-display text-xl text-black transition hover:bg-umx-cream hover:text-umx-orange";
  const input =
    size === "sm"
      ? "h-9 w-14 border-x border-black/10 bg-transparent text-center font-display text-sm font-semibold text-black outline-none [appearance:textfield] [-webkit-text-fill-color:#000] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      : "h-12 w-16 border-x border-black/10 bg-transparent text-center font-display text-base font-bold text-black outline-none [appearance:textfield] [-webkit-text-fill-color:#000] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-black/15 bg-white">
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel}`}
        className={btn}
        onClick={() => {
          const next = value - 1;
          if (next < min) {
            if (allowRemove) onChange(0);
            return;
          }
          onChange(next);
        }}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className={input}
      />
      <button
        type="button"
        aria-label={`Increase ${ariaLabel}`}
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}

type CaseQtyStepperProps = {
  pcs: number;
  onChangePcs: (pcs: number) => void;
  allowRemove?: boolean;
  ariaLabel?: string;
  size?: "sm" | "md";
  showHint?: boolean;
  align?: "end" | "center";
};

/** +/- stepper in cases. Cart still stores pieces (95 pcs per case). */
export function CaseQtyStepper({
  pcs,
  onChangePcs,
  allowRemove = false,
  ariaLabel = "Cases",
  size = "md",
  showHint = false,
  align = "end",
}: CaseQtyStepperProps) {
  const cases = Math.max(allowRemove ? 0 : 1, casesFromPcs(pcs));
  return (
    <div
      className={`flex w-full flex-col gap-1 ${
        align === "center" ? "items-center" : "items-end"
      }`}
    >
      <QtyStepper
        value={cases || 1}
        onChange={(nextCases) => onChangePcs(pcsFromCases(nextCases))}
        min={1}
        max={999}
        allowRemove={allowRemove}
        ariaLabel={ariaLabel}
        size={size}
      />
      {showHint ? (
        <p className="font-body text-[11px] leading-tight text-black/45">
          {PCS_PER_CASE} pcs / case
        </p>
      ) : null}
    </div>
  );
}

export function PackNote({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl bg-[#eef3f7] px-3.5 py-3 ${className ?? ""}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1b4f72] font-display text-sm font-bold text-white">
        {PCS_PER_CASE}
      </span>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold leading-tight text-black">
          1 case = {PCS_PER_CASE} pieces
        </p>
        <p className="mt-0.5 font-body text-xs leading-snug text-black/55">
          Sold by the case. + adds one case.
        </p>
      </div>
    </div>
  );
}
