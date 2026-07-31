"use client";

import type { ReactNode } from "react";
import { AccountPageHeader } from "@/components/account/AccountUI";
import { useBuyerI18n } from "@/components/account/BuyerI18n";

/** Page header driven by buyer i18n keys (EN / 中文). */
export default function AccountHeaderI18n({
  eyebrowKey,
  titleKey,
  title,
  descriptionKey,
  descriptionValues,
  action,
}: {
  eyebrowKey: string;
  titleKey?: string;
  /** Override title (e.g. Welcome, Name) */
  title?: string;
  descriptionKey?: string;
  descriptionValues?: Record<string, string | number>;
  action?: ReactNode;
}) {
  const { t } = useBuyerI18n();
  return (
    <AccountPageHeader
      eyebrow={t(eyebrowKey)}
      title={title ?? (titleKey ? t(titleKey) : "")}
      description={
        descriptionKey ? t(descriptionKey, descriptionValues) : undefined
      }
      action={action}
    />
  );
}
