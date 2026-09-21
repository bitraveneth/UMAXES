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

function formatRate(rate: number) {
  return `$${rate.toFixed(2)}`;
}

function thisOrderCopy(channel: CheckoutRebateQuote | null) {
  if (!channel) {
    return "Volume from this order posts after payment clears.";
  }
  if (channel.isFirstOrder) {
    if (channel.firstOrderUnpaidPcs > 0) {
      return `${channel.firstOrderUnpaidPcs.toLocaleString()} unpaid pieces on this first order — gift pricing applies.`;
    }
    return "First-order gift pricing is applied on this checkout.";
  }
  if (channel.chargedQty > 0) {
    return `+${channel.chargedQty.toLocaleString()} paid pieces will count toward your ladder once funds clear.`;
  }
  return "Volume from this order posts after payment clears.";
}

function testStationCopy(stationQty: number) {
  if (stationQty <= 0) return null;
  if (stationQty === 1) {
    return "Includes 1 free Test Station piece with this order.";
  }
  return `Includes ${stationQty} free Test Station pieces with this order.`;
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

  const currentRate =
    channel && channel.monthProjectedRate > 0 ? channel.monthProjectedRate : null;
  const activeTier = tiers.length
    ? tiers
    : currentRate != null
      ? [{ minQty: 0, rateUsd: currentRate }]
      : [];

  const wallet = channel?.rebateBalanceUsd ?? 0;
  const applied = channel?.rebateAppliedUsd ?? 0;
  const stationLine = testStationCopy(stationQty);

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_32px_rgba(61,22,5,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/8 bg-[#eef3f7] px-5 py-4 sm:px-6">
        <div>
          <p className="font-display text-[0.65rem] font-semibold tracking-[0.18em] text-[#1b4f72] uppercase">
            Rebate
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-black">
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

      <div className="grid gap-6 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-8 sm:p-6">
        <div className="mx-auto sm:mx-0 sm:pt-1">
          <div
            className="relative h-[8.25rem] w-[8.25rem] rounded-full"
            style={{
              background: `conic-gradient(#1b4f72 ${towardNext}%, #dbe4ec 0)`,
            }}
            role="img"
            aria-label={`${Math.round(towardNext)} percent toward next rebate level`}
          >
            {afterTowardNext > towardNext ? (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full opacity-45"
                style={{
                  background: `conic-gradient(transparent ${towardNext}%, #f97316 ${towardNext}%, #f97316 ${afterTowardNext}%, transparent 0)`,
                }}
              />
            ) : null}
            <div className="absolute inset-[0.75rem] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
              <p className="font-display text-[1.75rem] font-extrabold leading-none tabular-nums tracking-tight text-[#1b4f72]">
                {Math.round(towardNext)}%
              </p>
              <p className="mt-1 font-display text-[10px] font-semibold tracking-[0.14em] text-black/50 uppercase">
                to next
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-2xl font-extrabold tabular-nums tracking-tight text-black">
                {paid.toLocaleString()}{" "}
                <span className="font-display text-sm font-semibold text-black/55">
                  paid pcs
                </span>
              </p>
              <p className="mt-1 font-body text-sm leading-snug text-black/60">
                {channel?.nextTierQty != null && channel.nextTierRate != null
                  ? `${channel.nextTierQty.toLocaleString()} more to ${formatRate(channel.nextTierRate)}/pc`
                  : channel?.eligible
                    ? "Top rebate rate unlocked this month"
                    : "Rebate ladder activates after payment is confirmed"}
              </p>
            </div>
            {currentRate != null ? (
              <p className="font-display text-right text-sm font-semibold text-black/55">
                Now{" "}
                <span className="text-xl font-extrabold tabular-nums text-[#1b4f72]">
                  {formatRate(currentRate)}
                </span>
                <span className="text-[#1b4f72]/70">/pc</span>
              </p>
            ) : null}
          </div>

          <div>
            <div className="relative h-3 overflow-hidden rounded-full bg-black/10">
              {barAfterPct > barPaidPct ? (
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-umx-orange/60 transition-[width]"
                  style={{ width: `${barAfterPct}%` }}
                />
              ) : null}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#1b4f72] transition-[width]"
                style={{ width: `${barPaidPct}%` }}
              />
            </div>
            {barAfterPct > barPaidPct ? (
              <p className="mt-2 font-body text-[11px] text-black/50">
                Orange is this order after payment clears.
              </p>
            ) : null}
          </div>

          {activeTier.length > 0 ? (
            <div>
              <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-black/45 uppercase">
                Rebate rates
              </p>
              <div
                className={`mt-2 grid gap-2 ${
                  activeTier.length >= 3
                    ? "grid-cols-3"
                    : activeTier.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-1"
                }`}
              >
                {activeTier.map((tier) => {
                  const reached = paid >= tier.minQty;
                  const isCurrent =
                    currentRate != null &&
                    Math.abs(currentRate - tier.rateUsd) < 0.001;
                  return (
                    <div
                      key={`${tier.minQty}-${tier.rateUsd}`}
                      className={`rounded-xl border px-3 py-3 text-center transition ${
                        isCurrent
                          ? "border-[#1b4f72] bg-[#1b4f72] text-white shadow-[0_6px_16px_rgba(27,79,114,0.22)]"
                          : reached
                            ? "border-[#1b4f72]/35 bg-[#eef3f7]"
                            : "border-black/12 bg-[#f7f8fa]"
                      }`}
                    >
                      <p
                        className={`font-display text-xl font-extrabold tabular-nums leading-none tracking-tight sm:text-2xl ${
                          isCurrent
                            ? "text-white"
                            : reached
                              ? "text-[#1b4f72]"
                              : "text-black"
                        }`}
                      >
                        {formatRate(tier.rateUsd)}
                      </p>
                      <p
                        className={`mt-1.5 font-display text-[11px] font-semibold tracking-[0.06em] uppercase ${
                          isCurrent
                            ? "text-white/85"
                            : reached
                              ? "text-[#1b4f72]/75"
                              : "text-black/55"
                        }`}
                      >
                        {isCurrent
                          ? "Current"
                          : reached
                            ? "Unlocked"
                            : `${tier.minQty.toLocaleString()}+ pcs`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-[#1b4f72]/15 bg-[#eef3f7] px-4 py-3.5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-[#1b4f72]/80 uppercase">
                  Wallet
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums leading-none text-[#1b4f72]">
                  ${wallet.toFixed(2)}
                </p>
              </div>
              {showPrices && applied > 0 ? (
                <p className="font-display text-sm font-semibold text-[#1b4f72]/80">
                  −${applied.toFixed(2)} applied here
                </p>
              ) : (
                <p className="max-w-[16rem] text-right font-body text-xs leading-snug text-black/55">
                  Available credit for eligible channel orders
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="font-body text-sm leading-snug text-black/70">
              {thisOrderCopy(channel)}
            </p>
            {stationLine ? (
              <p className="font-body text-sm leading-snug text-black/70">
                {stationLine}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
