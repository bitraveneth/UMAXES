"use client";

import AccountHeaderI18n from "@/components/account/AccountHeaderI18n";
import { ContinueShoppingButton } from "@/components/account/ContinueShoppingButton";
import { useBuyerI18n } from "@/components/account/BuyerI18n";

export default function OverviewHeader({
  name,
  companyName,
}: {
  name?: string | null;
  companyName?: string | null;
}) {
  const { t } = useBuyerI18n();
  const title = `${t("overview.welcome")}${name ? `, ${name}` : ""}`;

  return (
    <AccountHeaderI18n
      eyebrowKey="overview.eyebrow"
      title={title}
      descriptionKey={companyName ? "overview.description" : undefined}
      descriptionValues={companyName ? { company: companyName } : undefined}
      action={<ContinueShoppingButton />}
    />
  );
}
