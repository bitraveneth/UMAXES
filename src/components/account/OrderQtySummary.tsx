"use client";

import { formatPack } from "@/lib/pack";
import {
  formatTestStationMessage,
  formatTestStationQty,
} from "@/lib/test-station";

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
      <p className="mt-2 font-body text-xs text-black/50">
        1 case = 95 pieces. Sold by the case.
      </p>
      {stationQty > 0 ? (
        <div className="mt-3 border-t border-black/8 pt-3">
          <p className="font-display text-[0.7rem] font-semibold tracking-[0.16em] text-black/45 uppercase">
            Test stations
          </p>
          <p className="mt-1 font-display text-lg font-bold tracking-tight text-black">
            {formatTestStationQty(stationQty)}
          </p>
          <p className="mt-1 font-body text-sm leading-relaxed text-black/60">
            {formatTestStationMessage(stationQty)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
