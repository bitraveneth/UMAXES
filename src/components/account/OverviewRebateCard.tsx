"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { useBuyerI18n } from "@/components/account/BuyerI18n";

export default function OverviewRebateCard({
  walletUsd,
}: {
  walletUsd: number;
}) {
  const { t } = useBuyerI18n();

  return (
    <Link
      href="/account/rebate"
      className="mt-8 block overflow-hidden border border-black/10 bg-white shadow-[0_10px_28px_rgba(14,36,56,0.04)] transition hover:-translate-y-0.5 hover:border-umx-orange/50 hover:shadow-[0_14px_32px_rgba(27,79,114,0.12)]"
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#eef3f7] text-[#1b4f72]">
            <Wallet className="h-5 w-5" strokeWidth={1.85} />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[10px] font-semibold tracking-[0.16em] text-[#1b4f72] uppercase">
              {t("rebate.eyebrow")}
            </span>
            <span className="mt-1 block font-display text-xl font-extrabold text-black">
              ${walletUsd.toFixed(2)} {t("rebate.available")}
            </span>
            <span className="mt-1 block font-body text-sm text-black/70">
              {t("rebate.overviewHint")}
            </span>
          </span>
        </div>
        <span className="shrink-0 font-display text-sm font-semibold text-umx-orange">
          {t("rebate.viewStatus")} →
        </span>
      </div>
    </Link>
  );
}
