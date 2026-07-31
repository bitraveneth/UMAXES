import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, CheckCircle2, Clock3, Package, Truck } from "lucide-react";
import { AdminCard } from "@/components/admin/ui";
import { AdminText } from "@/components/admin/AdminI18nBits";

type QueueItem = {
  id: string;
  labelKey: string;
  href: string;
  value: number;
  icon: LucideIcon;
  tone: "brand" | "warning" | "sky" | "success";
};

const toneClass: Record<QueueItem["tone"], string> = {
  brand: "bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export default function LogisticsQueueCard({
  awaitingPacking,
  awaitingTracking,
  inTransit,
  deliveredYtd,
}: {
  awaitingPacking: number;
  awaitingTracking: number;
  inTransit: number;
  deliveredYtd: number;
}) {
  const items: QueueItem[] = [
    {
      id: "packing",
      labelKey: "dashboard.awaitingPacking",
      href: "/admin/logistics",
      value: awaitingPacking,
      icon: Package,
      tone: "brand",
    },
    {
      id: "tracking",
      labelKey: "dashboard.awaitingTracking",
      href: "/admin/logistics/shipments",
      value: awaitingTracking,
      icon: Clock3,
      tone: "warning",
    },
    {
      id: "transit",
      labelKey: "dashboard.shipped",
      href: "/admin/logistics/shipments",
      value: inTransit,
      icon: Truck,
      tone: "sky",
    },
    {
      id: "delivered",
      labelKey: "dashboard.deliveredYtd",
      href: "/admin/logistics/shipments",
      value: deliveredYtd,
      icon: CheckCircle2,
      tone: "success",
    },
  ];

  const actionable = awaitingPacking + awaitingTracking;

  return (
    <AdminCard padded={false}>
      <div className="border-b border-[var(--admin-border)] px-5 py-4">
        <AdminText
          id="dashboard.fulfillmentFocus"
          as="h2"
          className="admin-section-title mb-0"
        />
        <AdminText
          id="dashboard.fulfillmentFocusHint"
          as="p"
          className="mt-1 text-sm text-[var(--admin-muted)]"
        />
        {actionable > 0 ? (
          <p className="mt-3 text-sm font-medium text-[var(--admin-text)]">
            <span className="tabular-nums text-[var(--admin-brand-500)]">
              {actionable}
            </span>{" "}
            <AdminText id="dashboard.queueNeedsAction" />
          </p>
        ) : (
          <p className="mt-3 text-sm text-[var(--admin-muted)]">
            <AdminText id="dashboard.queueClear" />
          </p>
        )}
      </div>

      <ul className="divide-y divide-[var(--admin-border)]">
        {items.map((item) => {
          const Icon = item.icon;
          const hot = item.value > 0 && item.id !== "delivered";
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[var(--admin-hover)]/50"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass[item.tone]}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--admin-text)]">
                    <AdminText id={item.labelKey} />
                  </p>
                  {hot ? (
                    <p className="text-xs text-[var(--admin-muted)]">
                      <AdminText id="dashboard.queueTapToOpen" />
                    </p>
                  ) : null}
                </div>
                <span
                  className={`rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums ${
                    hot
                      ? "bg-[var(--admin-brand-50)] text-[var(--admin-brand-600)]"
                      : "bg-[var(--admin-gray-100)] text-[var(--admin-text)]"
                  }`}
                >
                  {item.value.toLocaleString()}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[var(--admin-muted)]"
                  strokeWidth={1.75}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </AdminCard>
  );
}
