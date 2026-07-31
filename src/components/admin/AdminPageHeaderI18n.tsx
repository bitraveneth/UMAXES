"use client";

import type { ReactNode } from "react";
import { useAdminI18n } from "./AdminI18n";

export function AdminPageHeaderI18n({
  titleKey,
  descriptionKey,
  descriptionValues,
  actions,
}: {
  titleKey: string;
  descriptionKey?: string;
  descriptionValues?: Record<string, string | number>;
  actions?: ReactNode;
}) {
  const { t } = useAdminI18n();
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="admin-title">{t(titleKey)}</h1>
        {descriptionKey ? (
          <p className="admin-subtitle">
            {t(descriptionKey, descriptionValues)}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
