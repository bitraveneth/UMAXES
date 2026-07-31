"use client";

import { useMemo, useState } from "react";
import { AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";

type Period = "7d" | "monthly" | "quarterly" | "all";

type ShipEvent = {
  updatedAt: string;
  status: string;
};

const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_ZH = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function buildBuckets(
  events: ShipEvent[],
  period: Period,
  locale: string,
): { label: string; count: number; hint: string }[] {
  const now = new Date();
  const months = locale === "zh" ? MONTHS_ZH : MONTHS_EN;

  if (period === "7d") {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = startOfDay(now);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    return days.map((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = events.filter((e) => {
        const t = new Date(e.updatedAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      }).length;
      const label = d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        month: "short",
        day: "numeric",
      });
      return { label, count, hint: label };
    });
  }

  if (period === "monthly") {
    const year = now.getFullYear();
    return months.map((label, month) => {
      const count = events.filter((e) => {
        const d = new Date(e.updatedAt);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length;
      return { label, count, hint: `${label} ${year}` };
    });
  }

  if (period === "quarterly") {
    const year = now.getFullYear();
    const labels =
      locale === "zh"
        ? ["Q1", "Q2", "Q3", "Q4"]
        : ["Q1", "Q2", "Q3", "Q4"];
    return labels.map((label, qi) => {
      const count = events.filter((e) => {
        const d = new Date(e.updatedAt);
        return d.getFullYear() === year && Math.floor(d.getMonth() / 3) === qi;
      }).length;
      return { label, count, hint: `${label} ${year}` };
    });
  }

  // all time — by year
  const years = new Set<number>();
  for (const e of events) {
    years.add(new Date(e.updatedAt).getFullYear());
  }
  if (years.size === 0) years.add(now.getFullYear());
  const sorted = [...years].sort((a, b) => a - b);
  // ensure at least current year shown
  if (!sorted.includes(now.getFullYear())) sorted.push(now.getFullYear());
  return sorted.map((year) => {
    const count = events.filter(
      (e) => new Date(e.updatedAt).getFullYear() === year,
    ).length;
    return { label: String(year), count, hint: String(year) };
  });
}

export default function LogisticsShipmentsChart({
  events,
}: {
  events: ShipEvent[];
}) {
  const { t, locale } = useAdminI18n();
  const [period, setPeriod] = useState<Period>("monthly");

  const buckets = useMemo(
    () => buildBuckets(events, period, locale),
    [events, period, locale],
  );
  const max = Math.max(...buckets.map((b) => b.count), 1);

  const periods: { key: Period; labelKey: string }[] = [
    { key: "monthly", labelKey: "dashboard.periodMonthly" },
    { key: "7d", labelKey: "dashboard.period7d" },
    { key: "quarterly", labelKey: "dashboard.periodQuarterly" },
    { key: "all", labelKey: "dashboard.periodAll" },
  ];

  const titleKey =
    period === "7d"
      ? "dashboard.shipments7d"
      : period === "quarterly"
        ? "dashboard.shipmentsQuarterly"
        : period === "all"
          ? "dashboard.shipmentsAllTime"
          : "dashboard.shipmentsThisYear";

  const hintKey =
    period === "7d"
      ? "dashboard.shipments7dHint"
      : period === "quarterly"
        ? "dashboard.shipmentsQuarterlyHint"
        : period === "all"
          ? "dashboard.shipmentsAllTimeHint"
          : "dashboard.shipmentsThisYearHint";

  return (
    <AdminCard className="xl:col-span-2">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="admin-section-title mb-0">{t(titleKey)}</h2>
          <p className="admin-subtitle mt-0">{t(hintKey)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {periods.map((p) => {
            const active = period === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`admin-btn admin-btn-sm ${
                  active ? "admin-btn-primary" : "admin-btn-secondary"
                }`}
              >
                {t(p.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="admin-bar-chart">
        {buckets.map((b) => (
          <div key={b.hint} className="admin-bar-chart-col">
            <div
              className="admin-bar-chart-bar"
              style={{ height: `${Math.max(4, (b.count / max) * 100)}%` }}
              title={`${b.hint}: ${b.count}`}
            />
            <span className="admin-bar-chart-label">{b.label}</span>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
