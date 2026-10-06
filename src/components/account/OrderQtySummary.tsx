"use client";

import { formatPack } from "@/lib/pack";

export default function OrderQtySummary({
  pcs,
  stationQty,
  compact = false,
}: {
  pcs: number;
  stationQty: number;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-[#eef3f7] ${compact ? "px-4 py-3.5" : "px-4 py-4 sm:px-5 sm:py-5"}`}
    >
      <p className="font-display text-[0.7rem] font-semibold tracking-[0.16em] text-black/45 uppercase">
        Quantity
      </p>
      <p
        className={`mt-1.5 font-display font-extrabold leading-none tracking-[-0.04em] text-black tabular-nums ${
          compact ? "text-xl" : "text-[1.65rem] sm:text-[2rem]"
        }`}
      >
        {formatPack(pcs)}
      </p>
      {stationQty > 0 ? (
        <p className="mt-2 font-body text-sm text-black/60">
          Test Station ·{" "}
          {stationQty === 1 ? "1 piece" : `${stationQty} pieces`}
        </p>
      ) : null}
    </div>
  );
}
