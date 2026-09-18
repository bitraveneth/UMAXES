"use client";

import { useEffect, useState } from "react";
import {
  PACK_COPY,
  PCS_PER_CASE,
  casesFromPcs,
  formatPack,
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
};

/** +/- stepper in cases. Cart still stores pieces (95 pcs per case). */
export function CaseQtyStepper({
  pcs,
  onChangePcs,
  allowRemove = false,
  ariaLabel = "Cases",
  size = "md",
  showHint = false,
}: CaseQtyStepperProps) {
  const cases = Math.max(allowRemove ? 0 : 1, casesFromPcs(pcs));
  return (
    <div className="flex flex-col items-end gap-1">
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
          {formatPack(pcsFromCases(Math.max(1, cases)))} · {PCS_PER_CASE} pcs each
        </p>
      ) : null}
    </div>
  );
}

export function PackNote({ className }: { className?: string }) {
  return (
    <p className={className ?? "font-body text-sm text-black/60"}>{PACK_COPY}</p>
  );
}
