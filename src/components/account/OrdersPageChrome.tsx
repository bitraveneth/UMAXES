"use client";

import {
  AccountStat,
  AccountStatGrid,
} from "@/components/account/AccountUI";
import AccountHeaderI18n from "@/components/account/AccountHeaderI18n";
import { ContinueShoppingButton } from "@/components/account/ContinueShoppingButton";
import { useBuyerI18n } from "@/components/account/BuyerI18n";
import { Clock3, Package, Wallet } from "lucide-react";

export function OrdersPageHeader() {
  return (
    <AccountHeaderI18n
      eyebrowKey="orders.eyebrow"
      titleKey="orders.title"
      descriptionKey="orders.description"
      action={<ContinueShoppingButton variant="outline" />}
    />
  );
}

export function OrdersStatCards({
  openCount,
  pendingPay,
  spend,
}: {
  openCount: number;
  pendingPay: number;
  spend: number;
}) {
  const { t } = useBuyerI18n();
  return (
    <div className="mb-8">
      <AccountStatGrid cols={3}>
        <AccountStat
          label={t("orders.open")}
          value={openCount}
          hint={t("orders.openHint")}
          icon={Package}
          tone="orange"
        />
        <AccountStat
          label={t("orders.awaitingPay")}
          value={pendingPay}
          hint={t("orders.awaitingPayHint")}
          icon={Clock3}
          tone="cream"
        />
        <AccountStat
          label={t("orders.spend")}
          value={`$${Math.round(spend).toLocaleString()}`}
          hint={t("orders.spendHint")}
          icon={Wallet}
          tone="cream"
        />
      </AccountStatGrid>
    </div>
  );
}
