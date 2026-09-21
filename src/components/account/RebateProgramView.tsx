"use client";

import Link from "next/link";
import {
  BadgePercent,
  Gift,
  Landmark,
  Package,
  Wallet,
} from "lucide-react";
import {
  AccountPageHeader,
  AccountStat,
  AccountStatGrid,
} from "@/components/account/AccountUI";
import { useBuyerI18n } from "@/components/account/BuyerI18n";
import { TEST_STATION_PER_CASE_COPY } from "@/lib/test-station";
import type { BuyerRebateStatus } from "@/lib/rebate-types";

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function monthLabel(yearMonth: string, locale: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  );
}

function ledgerLabel(
  t: (key: string) => string,
  type: string,
) {
  if (type === "ISSUE") return t("rebate.typeIssue");
  if (type === "APPLY") return t("rebate.typeApply");
  if (type === "CLAWBACK") return t("rebate.typeClawback");
  return t("rebate.typeAdjust");
}

function monthStatus(t: (key: string) => string, status: string) {
  if (status === "ISSUED") return t("rebate.statusIssued");
  if (status === "LOCKED") return t("rebate.statusLocked");
  return t("rebate.statusDraft");
}

export default function RebateProgramView({
  status,
}: {
  status: BuyerRebateStatus;
}) {
  const { t, locale } = useBuyerI18n();
  const maxTier = status.tiers[status.tiers.length - 1];
  const nextMin =
    status.nextTierQty != null
      ? status.monthPaidQty + status.nextTierQty
      : maxTier?.minQty ?? null;
  const overallPct = maxTier
    ? Math.min(100, (status.monthPaidQty / maxTier.minQty) * 100)
    : 0;
  const nextPct =
    nextMin && nextMin > 0
      ? Math.min(100, (status.monthPaidQty / nextMin) * 100)
      : status.tiers.length && status.monthPaidQty >= (maxTier?.minQty ?? 0)
        ? 100
        : 0;

  return (
    <div>
      <AccountPageHeader
        eyebrow={t("rebate.eyebrow")}
        title={t("rebate.title")}
        description={t("rebate.description")}
        action={
          <Link
            href="/shop"
            className="border border-black/15 bg-umx-cream-bright px-5 py-3 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange"
          >
            {t("common.shopAgain")}
          </Link>
        }
      />

      <AccountStatGrid cols={3}>
        <AccountStat
          label={t("rebate.wallet")}
          value={money(status.walletUsd)}
          hint={t("rebate.walletHint")}
          icon={Wallet}
          tone="orange"
        />
        <AccountStat
          label={t("rebate.paidMonth")}
          value={status.monthPaidQty.toLocaleString()}
          hint={t("rebate.paidMonthHint")}
          icon={Package}
        />
        <AccountStat
          label={t("rebate.currentRate")}
          value={
            status.live && status.monthProjectedRate
              ? `$${status.monthProjectedRate.toFixed(2)}`
              : "—"
          }
          hint={
            status.live && status.monthProjectedRate
              ? t("rebate.currentRateHint")
              : t("rebate.currentRateNone")
          }
          icon={BadgePercent}
        />
      </AccountStatGrid>

      <section className="mt-8 overflow-hidden border border-black/10 bg-white shadow-[0_10px_28px_rgba(61,22,5,0.05)]">
        <div className="border-b border-black/8 bg-[#eef3f7] px-5 py-4 sm:px-6">
          <p className="font-display text-[10px] font-semibold tracking-[0.16em] text-[#1b4f72] uppercase">
            {t("rebate.thisMonth")}
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-black">
            {status.monthKey ? monthLabel(status.monthKey, locale) : t("rebate.ladderTitle")}
          </h2>
          <p className="mt-1 font-body text-sm text-black/70">
            {status.live
              ? t("rebate.ladderHint")
              : t("rebate.ladderPending")}
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          {status.live && status.tiers.length > 0 ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-semibold text-black">
                    {status.monthPaidQty.toLocaleString()} {t("rebate.paidPcs")}
                  </p>
                  {status.nextTierQty != null && status.nextTierRate != null ? (
                    <p className="mt-1 font-body text-sm text-black/65">
                      {t("rebate.nextTier", {
                        qty: status.nextTierQty.toLocaleString(),
                        rate: status.nextTierRate.toFixed(2),
                      })}
                    </p>
                  ) : (
                    <p className="mt-1 font-body text-sm text-black/65">
                      {t("rebate.topTier")}
                    </p>
                  )}
                </div>
                <p className="font-display text-sm font-bold tabular-nums text-[#1b4f72]">
                  {status.nextTierQty != null && nextMin != null
                    ? `${status.monthPaidQty.toLocaleString()} / ${nextMin.toLocaleString()}`
                    : `${Math.round(overallPct)}%`}
                </p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden bg-black/8">
                <div
                  className="h-full bg-[#1b4f72] transition-[width]"
                  style={{ width: `${nextPct}%` }}
                />
              </div>
              <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                {status.tiers.map((tier, index) => {
                  const prev = index === 0 ? 0 : status.tiers[index - 1]!.minQty;
                  const reached = status.monthPaidQty >= tier.minQty;
                  const current =
                    status.monthPaidQty >= prev &&
                    status.monthPaidQty < tier.minQty;
                  return (
                    <li
                      key={tier.minQty}
                      className={`border px-4 py-4 ${
                        reached
                          ? "border-[#1b4f72]/30 bg-[#eef3f7]"
                          : current
                            ? "border-umx-orange/40 bg-umx-orange-wash/40"
                            : "border-black/10 bg-umx-cream-bright"
                      }`}
                    >
                      <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-black/55 uppercase">
                        {t("rebate.tierFrom")} {tier.minQty.toLocaleString()}{" "}
                        {t("rebate.paidPcs")}
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-black">
                        ${tier.rateUsd.toFixed(2)}
                        <span className="ml-1 font-display text-sm font-semibold text-black/55">
                          {t("rebate.perPc")}
                        </span>
                      </p>
                      <p className="mt-2 font-body text-xs font-semibold text-black/60">
                        {reached
                          ? t("rebate.tierReached")
                          : current
                            ? t("rebate.tierCurrent")
                            : t("rebate.tierLocked")}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : (
            <p className="font-body text-sm text-black/70">
              {t("rebate.ladderPending")}
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <p className="font-display text-[10px] font-semibold tracking-[0.16em] text-umx-orange uppercase">
          {t("rebate.howTitle")}
        </p>
        <ul className="mt-3 grid gap-3 lg:grid-cols-3">
          <li className="border border-black/10 bg-white p-5 shadow-[0_8px_20px_rgba(61,22,5,0.04)]">
            <Gift className="h-5 w-5 text-umx-orange" strokeWidth={1.85} />
            <p className="mt-3 font-display text-sm font-bold text-black">
              {t("rebate.howStations")}
            </p>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-black/70">
              {status.testStationsPerCase > 0
                ? `${TEST_STATION_PER_CASE_COPY}. ${t("rebate.howStationsBody")}`
                : t("rebate.howStationsNone")}
            </p>
          </li>
          <li className="border border-black/10 bg-white p-5 shadow-[0_8px_20px_rgba(61,22,5,0.04)]">
            <Package className="h-5 w-5 text-umx-orange" strokeWidth={1.85} />
            <p className="mt-3 font-display text-sm font-bold text-black">
              {t("rebate.howFirst")}
            </p>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-black/70">
              {t("rebate.howFirstBody", {
                unpaid: status.firstOrderUnpaidPcs,
                cases: status.firstOrderCases,
              })}
            </p>
          </li>
          <li className="border border-black/10 bg-white p-5 shadow-[0_8px_20px_rgba(61,22,5,0.04)]">
            <Landmark className="h-5 w-5 text-umx-orange" strokeWidth={1.85} />
            <p className="mt-3 font-display text-sm font-bold text-black">
              {t("rebate.howPay")}
            </p>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-black/70">
              {t("rebate.howPayBody")}
            </p>
          </li>
        </ul>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="border border-black/10 bg-white shadow-[0_8px_20px_rgba(61,22,5,0.04)]">
          <div className="border-b border-black/8 px-5 py-4">
            <h2 className="font-display text-lg font-extrabold text-black">
              {t("rebate.monthsTitle")}
            </h2>
          </div>
          {status.months.length === 0 ? (
            <p className="px-5 py-8 font-body text-sm text-black/60">
              {t("rebate.monthsEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-black/8">
              {status.months.map((m) => (
                <li
                  key={m.yearMonth}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-display text-sm font-bold text-black">
                      {monthLabel(m.yearMonth, locale)}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-black/60">
                      {m.paidQty.toLocaleString()} {t("rebate.paidPcs")}
                      {m.tierRate
                        ? ` · $${m.tierRate.toFixed(2)}${t("rebate.perPc")}`
                        : ""}
                      {" · "}
                      {monthStatus(t, m.status)}
                    </p>
                  </div>
                  <p className="font-display text-sm font-extrabold tabular-nums text-umx-orange">
                    {money(m.rebateAmount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-black/10 bg-white shadow-[0_8px_20px_rgba(61,22,5,0.04)]">
          <div className="border-b border-black/8 px-5 py-4">
            <h2 className="font-display text-lg font-extrabold text-black">
              {t("rebate.activityTitle")}
            </h2>
          </div>
          {status.ledger.length === 0 ? (
            <p className="px-5 py-8 font-body text-sm text-black/60">
              {t("rebate.activityEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-black/8">
              {status.ledger.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-display text-sm font-bold text-black">
                      {ledgerLabel(t, row.type)}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-black/60">
                      {row.createdAt.slice(0, 10)}
                      {row.note ? ` · ${row.note}` : ""}
                    </p>
                  </div>
                  <p
                    className={`font-display text-sm font-extrabold tabular-nums ${
                      row.amount < 0 ? "text-black" : "text-umx-orange"
                    }`}
                  >
                    {row.amount < 0 ? "−" : "+"}
                    {money(Math.abs(row.amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
