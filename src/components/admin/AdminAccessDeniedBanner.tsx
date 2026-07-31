"use client";

import { useAdminI18n } from "./AdminI18n";

export function AdminAccessDeniedBanner({ deniedPath }: { deniedPath: string }) {
  const { t } = useAdminI18n();
  const label = t(`nav.${deniedPath}`);
  const pageName =
    label && label !== `nav.${deniedPath}` ? label : deniedPath;

  return (
    <div className="mb-6 rounded-xl border border-[var(--admin-warning-500)]/40 bg-[var(--admin-warning-50)] px-4 py-3 text-sm text-[var(--admin-warning-700)]">
      <p className="font-semibold">{t("common.accessDenied")}</p>
      <p className="mt-1">
        {t("common.accessDeniedHint", { page: pageName })}
      </p>
    </div>
  );
}
