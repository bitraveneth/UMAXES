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

function thisOrderValue(channel: CheckoutRebateQuote | null) {
  if (!channel) return "Posts after payment clears";
  if (channel.isFirstOrder) {
    if (channel.firstOrderUnpaidPcs > 0) {
      return `${channel.firstOrderUnpaidPcs.toLocaleString()} unpaid pcs · gift pricing`;
    }
    return "First-order gift pricing applied";
  }
  if (channel.chargedQty > 0) {
    return `+${channel.chargedQty.toLocaleString()} pcs after payment clears`;
  }
  return "Posts after payment clears";
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

  const detailRows: { label: string; value: string; accent?: boolean }[] = [
    {
      label: "Wallet",
      value:
        showPrices && applied > 0
          ? `$${wallet.toFixed(2)} · −$${applied.toFixed(2)} here`
          : `$${wallet.toFixed(2)}`,
      accent: true,
    },
    {
      label: "This order",
      value: thisOrderValue(channel),
    },
  ];
  if (stationQty > 0) {
    detailRows.push({
      label: "Test Station",
      value:
        stationQty === 1
          ? "1 free piece included"
          : `${stationQty} free pieces included`,
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_32px_rgba(61,22,5,0.05)]">
      <div className="flex items-center justify-between gap-3 border-b border-black/8 bg-[#eef3f7] px-5 py-4 sm:px-6">
        <div>
          <p className="font-display text-[0.65rem] font-semibold tracking-[0.18em] text-[#1b4f72] uppercase">
            Rebate
          </p>
          <h2 className="mt-0.5 font-display text-xl font-semibold tracking-tight text-black">
            This month
          </h2>
        </div>
        <Link
          href="/account/rebate"
          className="shrink-0 font-display text-sm font-semibold text-[#1b4f72] transition hover:text-umx-orange"
        >
          Full status →
        </Link>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid items-center gap-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6">
          <div
            className="relative mx-auto h-[7.5rem] w-[7.5rem] rounded-full sm:mx-0"
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
            <div className="absolute inset-[0.7rem] flex flex-col items-center justify-center rounded-full bg-white text-center">
              <p className="font-display text-[1.65rem] font-extrabold leading-none tabular-nums text-[#1b4f72]">
                {Math.round(towardNext)}%
              </p>
              <p className="mt-1 font-display text-[10px] font-semibold tracking-[0.14em] text-black/45 uppercase">
                to next
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-2xl font-extrabold tabular-nums tracking-tight text-black">
                  {paid.toLocaleString()}
                  <span className="ml-1.5 text-sm font-semibold text-black/50">
                    paid pcs
                  </span>
                </p>
                <p className="mt-1 truncate font-body text-sm text-black/55">
                  {channel?.nextTierQty != null && channel.nextTierRate != null
                    ? `${channel.nextTierQty.toLocaleString()} more to ${formatRate(channel.nextTierRate)}/pc`
                    : channel?.eligible
                      ? "Top rebate rate unlocked"
                      : "Ladder unlocks after payment clears"}
                </p>
              </div>
              {currentRate != null ? (
                <div className="shrink-0 text-right">
                  <p className="font-display text-[10px] font-semibold tracking-[0.12em] text-black/40 uppercase">
                    Now
                  </p>
                  <p className="font-display text-xl font-extrabold tabular-nums text-[#1b4f72]">
                    {formatRate(currentRate)}
                    <span className="text-sm font-bold text-[#1b4f72]/65">/pc</span>
                  </p>
                </div>
              ) : null}
            </div>

            <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-black/10">
              {barAfterPct > barPaidPct ? (
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-umx-orange/60"
                  style={{ width: `${barAfterPct}%` }}
                />
              ) : null}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#1b4f72]"
                style={{ width: `${barPaidPct}%` }}
              />
            </div>
          </div>
        </div>

        {activeTier.length > 0 ? (
          <div
            className={`mt-5 grid gap-2 ${
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
                  className={`rounded-xl border px-2.5 py-2.5 text-center sm:px-3 sm:py-3 ${
                    isCurrent
                      ? "border-[#1b4f72] bg-[#1b4f72] text-white"
                      : reached
                        ? "border-[#1b4f72]/30 bg-[#eef3f7]"
                        : "border-black/10 bg-[#f7f8fa]"
                  }`}
                >
                  <p
                    className={`font-display text-lg font-extrabold tabular-nums leading-none sm:text-xl ${
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
                    className={`mt-1 font-display text-[10px] font-semibold tracking-[0.06em] uppercase ${
                      isCurrent
                        ? "text-white/85"
                        : reached
                          ? "text-[#1b4f72]/75"
                          : "text-black/50"
                    }`}
                  >
                    {isCurrent
                      ? "Current"
                      : reached
                        ? "Unlocked"
                        : `${tier.minQty.toLocaleString()}+`}
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}

        <dl className="mt-5 divide-y divide-black/8 border-t border-black/8">
          {detailRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 py-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4"
            >
              <dt className="font-display text-[11px] font-semibold tracking-[0.12em] text-black/45 uppercase">
                {row.label}
              </dt>
              <dd
                className={`min-w-0 font-display text-sm font-semibold tabular-nums sm:text-base ${
                  row.accent ? "text-[#1b4f72]" : "text-black"
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
