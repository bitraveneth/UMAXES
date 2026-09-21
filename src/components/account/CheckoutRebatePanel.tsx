"use client";

import Link from "next/link";

type Tier = { minQty: number; rateUsd: number };

export type CheckoutRebateQuote = {
  eligible: boolean;
  isFirstOrder: boolean;
  monthPaidQty: number;
  monthProjectedRate: number;
  nextTierQty: number | null;
  nextTierRate: number | null;
  rebateBalanceUsd: number;
  rebateAppliedUsd: number;
  firstOrderUnpaidPcs: number;
  firstOrderDiscountUsd: number;
  chargedQty: number;
  sellingQty: number;
  testStationQty: number;
  tiers?: Tier[];
};

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export default function CheckoutRebatePanel({
  channel,
  stationQty,
  showPrices,
}: {
  channel: CheckoutRebateQuote | null;
  stationQty: number;
  showPrices: boolean;
}) {
  const paid = channel?.monthPaidQty ?? 0;
  const tiers = channel?.tiers ?? [];
  const top = tiers[tiers.length - 1] ?? null;
  const nextMin =
    channel?.nextTierQty != null ? paid + channel.nextTierQty : top?.minQty ?? null;
  const towardNext =
    nextMin && nextMin > 0 ? clampPct((paid / nextMin) * 100) : paid > 0 ? 100 : 0;

  const afterPaid =
    channel && !channel.isFirstOrder
      ? paid + Math.max(0, channel.chargedQty)
      : paid;
  const afterTowardNext =
    nextMin && nextMin > 0
      ? clampPct((afterPaid / nextMin) * 100)
      : afterPaid > 0
        ? 100
        : 0;
  // Progress bar uses the same scale as tier ticks (0 → top minQty).
  const ladderMax = top?.minQty && top.minQty > 0 ? top.minQty : nextMin;
  const barPaidPct =
    ladderMax && ladderMax > 0
      ? clampPct((paid / ladderMax) * 100)
      : paid > 0
        ? 100
        : 0;
  const barAfterPct =
    ladderMax && ladderMax > 0
      ? clampPct((afterPaid / ladderMax) * 100)
      : afterPaid > 0
        ? 100
        : 0;

  const rateLabel =
    channel && channel.monthProjectedRate > 0
      ? `$${channel.monthProjectedRate.toFixed(2)}/pc`
      : "No rate yet";

  return (
    <section className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_12px_32px_rgba(61,22,5,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/8 bg-[#eef3f7] px-5 py-4 sm:px-6">
        <div>
          <p className="font-display text-[0.65rem] font-semibold tracking-[0.18em] text-[#1b4f72] uppercase">
            Rebate
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold text-black">
            This month
          </h2>
        </div>
        <Link
          href="/account/rebate"
          className="font-display text-sm font-semibold text-[#1b4f72] transition hover:text-umx-orange"
        >
          Full status →
        </Link>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-6">
        <div className="mx-auto sm:mx-0">
          <div
            className="relative h-[7.5rem] w-[7.5rem] rounded-full"
            style={{
              background: `conic-gradient(#1b4f72 ${towardNext}%, #dbe4ec 0)`,
            }}
            role="img"
            aria-label={`${Math.round(towardNext)} percent toward next rebate level`}
          >
            {afterTowardNext > towardNext ? (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full opacity-40"
                style={{
                  background: `conic-gradient(transparent ${towardNext}%, #f97316 ${towardNext}%, #f97316 ${afterTowardNext}%, transparent 0)`,
                }}
              />
            ) : null}
            <div className="absolute inset-[0.7rem] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
              <p className="font-display text-2xl font-extrabold tabular-nums tracking-tight text-[#1b4f72]">
                {Math.round(towardNext)}%
              </p>
              <p className="mt-0.5 font-display text-[10px] font-semibold tracking-[0.12em] text-black/45 uppercase">
                to next
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-display text-sm font-bold text-black">
                {paid.toLocaleString()} paid pcs
              </p>
              <p className="mt-0.5 font-body text-sm text-black/60">
                {channel?.nextTierQty != null && channel.nextTierRate != null
                  ? `${channel.nextTierQty.toLocaleString()} more to $${channel.nextTierRate.toFixed(2)}/pc`
                  : channel?.eligible
                    ? "Top rebate rate unlocked this month"
                    : "Rebate ladder activates after payment is confirmed"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-black/45 uppercase">
                Current rate
              </p>
              <p className="font-display text-base font-extrabold tabular-nums text-[#1b4f72]">
                {rateLabel}
              </p>
            </div>
          </div>

          <div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-black/8">
              {barAfterPct > barPaidPct ? (
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-umx-orange/55 transition-[width]"
                  style={{ width: `${barAfterPct}%` }}
                />
              ) : null}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#1b4f72] transition-[width]"
                style={{ width: `${barPaidPct}%` }}
              />
            </div>
            {tiers.length > 0 && ladderMax ? (
              <div className="relative mt-2 h-5">
                {tiers.map((tier) => {
                  const left = clampPct((tier.minQty / ladderMax) * 100);
                  const reached = paid >= tier.minQty;
                  return (
                    <span
                      key={tier.minQty}
                      className="absolute top-0 -translate-x-1/2 text-center"
                      style={{ left: `${left}%` }}
                    >
                      <span
                        className={`mx-auto block h-1.5 w-1.5 rounded-full ${
                          reached ? "bg-[#1b4f72]" : "bg-black/20"
                        }`}
                      />
                      <span className="mt-0.5 block font-display text-[9px] font-semibold tabular-nums text-black/45">
                        ${tier.rateUsd.toFixed(2)}
                      </span>
                    </span>
                  );
                })}
              </div>
            ) : null}
            {barAfterPct > barPaidPct ? (
              <p className="mt-2 font-body text-[11px] text-black/50">
                Orange shows where this order lands after funds are confirmed.
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="border border-black/8 bg-umx-cream-bright px-3 py-2.5">
              <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-black/45 uppercase">
                Wallet
              </p>
              <p className="mt-0.5 font-display text-sm font-bold tabular-nums text-black">
                ${(channel?.rebateBalanceUsd ?? 0).toFixed(2)}
                {showPrices && channel && channel.rebateAppliedUsd > 0
                  ? ` · −$${channel.rebateAppliedUsd.toFixed(2)} here`
                  : ""}
              </p>
            </div>
            <div className="border border-black/8 bg-umx-cream-bright px-3 py-2.5">
              <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-black/45 uppercase">
                This order
              </p>
              <p className="mt-0.5 font-display text-sm font-bold text-black">
                {channel?.isFirstOrder
                  ? channel.firstOrderUnpaidPcs
                    ? `${channel.firstOrderUnpaidPcs.toLocaleString()} unpaid pcs`
                    : "First-order gift"
                  : channel && channel.chargedQty > 0
                    ? `+${channel.chargedQty.toLocaleString()} pcs after paid`
                    : "Counts after funds confirmed"}
              </p>
            </div>
          </div>

          {stationQty > 0 ? (
            <p className="font-body text-xs text-black/55">
              Test Station ·{" "}
              {stationQty === 1 ? "1 piece" : `${stationQty} pieces`} · free
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
