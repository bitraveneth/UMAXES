"use client";

import {
  AccountStat,
  AccountStatGrid,
} from "@/components/account/AccountUI";
import { useBuyerI18n } from "@/components/account/BuyerI18n";
import { Clock3, FileText, Heart, Package } from "lucide-react";

export default function OverviewStatCards({
  openOrders,
  paymentPending,
  wishlistCount,
  creditLimit,
  showCredit,
}: {
  openOrders: number;
  paymentPending: number;
  wishlistCount: number;
  creditLimit: number;
  showCredit: boolean;
}) {
  const { t } = useBuyerI18n();

  return (
    <AccountStatGrid cols={showCredit ? 4 : 3}>
      <AccountStat
        label={t("overview.openOrders")}
        value={openOrders}
        hint={t("overview.openOrdersHint")}
        icon={Package}
        tone="orange"
      />
      <AccountStat
        label={t("overview.paymentPending")}
        value={paymentPending}
        hint={t("overview.paymentPendingHint")}
        icon={Clock3}
      />
      <AccountStat
        label={t("overview.wishlist")}
        value={wishlistCount}
        hint={t("overview.wishlistHint")}
        icon={Heart}
      />
      {showCredit ? (
        <AccountStat
          label={t("overview.availableCredit")}
          value={`$${Math.round(creditLimit).toLocaleString()}`}
          icon={FileText}
        />
      ) : null}
    </AccountStatGrid>
  );
}
