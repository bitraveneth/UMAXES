"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAdminI18n } from "./AdminI18n";

export function AdminLinkBtn({
  href,
  labelKey,
  variant = "secondary",
  icon,
}: {
  href: string;
  labelKey: string;
  variant?: "primary" | "secondary";
  icon?: ReactNode;
}) {
  const { t } = useAdminI18n();
  return (
    <Link
      href={href}
      className={`admin-btn admin-btn-sm ${
        variant === "primary" ? "admin-btn-primary" : "admin-btn-secondary"
      }`}
    >
      {icon}
      {t(labelKey)}
    </Link>
  );
}

export function AdminText({
  id,
  values,
  as: Tag = "span",
  className,
}: {
  id: string;
  values?: Record<string, string | number>;
  as?: "span" | "p" | "h2" | "div";
  className?: string;
}) {
  const { t } = useAdminI18n();
  return <Tag className={className}>{t(id, values)}</Tag>;
}
