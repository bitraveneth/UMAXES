import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="admin-title">{title}</h1>
        {description ? <p className="admin-subtitle">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminCard({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`admin-card ${padded ? "admin-card-pad" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function AdminStat({
  label,
  value,
  href,
  icon: Icon,
  trend,
  trendUp,
}: {
  label: ReactNode;
  value: number | string;
  href?: string;
  icon?: LucideIcon;
  trend?: ReactNode;
  trendUp?: boolean;
}) {
  const inner = (
    <div className="admin-stat">
      {Icon ? (
        <div className="admin-stat-icon" aria-hidden>
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      ) : null}
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value">{value}</p>
      {trend ? (
        <span
          className={`admin-stat-trend admin-badge ${
            trendUp === false ? "admin-badge-error" : "admin-badge-success"
          }`}
        >
          {trend}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="admin-card admin-card-pad admin-stat-card block transition hover:border-[var(--admin-brand-500)]"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="admin-card admin-card-pad admin-stat-card">{inner}</div>
  );
}

export function AdminBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "error" | "brand";
}) {
  return (
    <span className={`admin-badge admin-badge-${tone}`}>{children}</span>
  );
}

export function AdminTable({
  headers,
  children,
}: {
  headers: ReactNode[];
  children: ReactNode;
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={typeof h === "string" ? h : i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
