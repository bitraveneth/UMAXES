"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { ShipmentProgressHorizontal } from "@/components/admin/LogisticsShipmentProgress";

export type LogisticsOrderRow = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  route: string;
  addressLines: string[];
  itemCount: number;
  notes: string | null;
  contact: string;
  hasPacking: boolean;
  boxCount: number | null;
  items: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    image: string | null;
  }[];
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
};

type FilterKey =
  | "all"
  | "COMPLETED"
  | "SHIPPED"
  | "CONFIRMED"
  | "SENT_TO_SUPPLIER";

const FILTERS: { key: FilterKey; labelKey: string }[] = [
  { key: "all", labelKey: "logistics.filterAll" },
  { key: "COMPLETED", labelKey: "logistics.filterDelivered" },
  { key: "SHIPPED", labelKey: "logistics.filterTransit" },
  { key: "CONFIRMED", labelKey: "logistics.filterPending" },
  { key: "SENT_TO_SUPPLIER", labelKey: "logistics.filterProcessing" },
];

function statusTone(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "SHIPPED") return "warning" as const;
  if (status === "SENT_TO_SUPPLIER" || status === "PICKING")
    return "brand" as const;
  return "neutral" as const;
}

function matchesLogisticsFilter(status: OrderStatus, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "SENT_TO_SUPPLIER") {
    return status === "SENT_TO_SUPPLIER" || status === "PICKING";
  }
  return status === filter;
}

function DocLinks({ orderId }: { orderId: string }) {
  const { t } = useAdminI18n();
  return (
    <a
      href={`/admin/logistics/packing-lists/${orderId}`}
      className="admin-btn admin-btn-secondary admin-btn-sm !px-2 !text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {t("packingLists.view")}
    </a>
  );
}

export default function LogisticsPanel({
  orders,
  monthlyShipments,
  monthlyDeliveries,
  monthLabels,
  shippedQty,
}: {
  orders: LogisticsOrderRow[];
  monthlyShipments: number[];
  monthlyDeliveries: number[];
  monthLabels: string[];
  shippedQty: number;
}) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => matchesLogisticsFilter(o.status, filter));
  }, [orders, filter]);

  function statusLabel(status: OrderStatus) {
    const key = `logistics.status${status}`;
    const label = t(key);
    return label === key ? status : label;
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(
        locale === "zh" ? "zh-CN" : "en-US",
        { month: "short", day: "numeric", year: "numeric" },
      );
    } catch {
      return iso.slice(0, 10);
    }
  }

  function formatTime(iso: string | null) {
    if (!iso) return "--:--";
    try {
      return new Date(iso).toLocaleTimeString(
        locale === "zh" ? "zh-CN" : "en-US",
        { hour: "2-digit", minute: "2-digit" },
      );
    } catch {
      return "--:--";
    }
  }

  const maxBar = Math.max(1, ...monthlyShipments, ...monthlyDeliveries);
  const progressLabels = {
    supplier: t("logistics.timelinePicked"),
    transit: t("logistics.timelineTransit"),
    delivered: t("logistics.timelineDelivered"),
  };

  function openOrder(id: string) {
    router.push(`/admin/logistics/${id}`);
  }

  return (
    <div className="space-y-6">
      <AdminCard>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="admin-section-title mb-0">
              {t("logistics.deliveryStats")}
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {t("logistics.deliveryStatsHint")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <span className="inline-flex items-center gap-2 text-[var(--admin-text)]">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              {t("logistics.shipment")}
            </span>
            <span className="inline-flex items-center gap-2 text-[var(--admin-text)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--admin-brand-500)]" />
              {t("logistics.delivery")}
            </span>
          </div>
        </div>
        <div className="admin-bar-chart logistics-dual-chart">
          {monthLabels.map((label, i) => (
            <div key={label} className="admin-bar-chart-col">
              <div className="flex h-36 items-end justify-center gap-1">
                <div
                  className="w-2.5 rounded-t-md bg-sky-400/90 sm:w-3"
                  style={{
                    height: `${Math.max(4, (monthlyShipments[i] / maxBar) * 100)}%`,
                  }}
                />
                <div
                  className="w-2.5 rounded-t-md bg-[var(--admin-brand-500)] sm:w-3"
                  style={{
                    height: `${Math.max(4, (monthlyDeliveries[i] / maxBar) * 100)}%`,
                  }}
                />
              </div>
              <span className="admin-bar-chart-label">{label}</span>
            </div>
          ))}
        </div>
      </AdminCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminCard>
          <p className="text-3xl font-bold tracking-tight text-[var(--admin-text)]">
            {shippedQty.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t("logistics.shippedQty")}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-3xl font-bold tracking-tight text-[var(--admin-text)]">
            {orders.filter((o) => o.status === "SHIPPED").length}
          </p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t("logistics.inTransit")}
          </p>
        </AdminCard>
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--admin-border)] px-5 py-4">
          <div>
            <h2 className="admin-section-title mb-0">
              {t("logistics.activitiesTitle")}
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {t("logistics.listedHintOpen", { count: filtered.length })}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const count =
                f.key === "all"
                  ? orders.length
                  : orders.filter((o) =>
                      matchesLogisticsFilter(o.status, f.key),
                    ).length;
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`admin-btn admin-btn-sm ${
                    active ? "admin-btn-primary" : "admin-btn-secondary"
                  }`}
                >
                  {t(f.labelKey)}
                  <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--admin-muted)]">
            {t("logistics.noOrders")}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("logistics.colOrder")}</th>
                  <th>{t("logistics.colCompany")}</th>
                  <th>{t("logistics.colArrival")}</th>
                  <th>{t("logistics.colRoute")}</th>
                  <th>{t("logistics.boxCount")}</th>
                  <th>{t("logistics.colStatus")}</th>
                  <th>{t("logistics.colDocs")}</th>
                  <th className="text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const open = expandedId === order.id;
                  return (
                    <Fragment key={order.id}>
                      <tr
                        className={
                          open
                            ? "cursor-pointer bg-[var(--admin-brand-50)]/35"
                            : "cursor-pointer"
                        }
                        onClick={() =>
                          setExpandedId(open ? null : order.id)
                        }
                        onDoubleClick={() => openOrder(order.id)}
                      >
                        <td className="font-semibold text-[var(--admin-muted)]">
                          {order.orderNumber}
                        </td>
                        <td className="font-medium text-[var(--admin-text)]">
                          {order.companyName}
                        </td>
                        <td className="whitespace-nowrap text-sm text-[var(--admin-muted)]">
                          {formatDate(order.updatedAt)}
                        </td>
                        <td className="max-w-[12rem] truncate text-sm">
                          {order.route}
                        </td>
                        <td className="tabular-nums">
                          {order.hasPacking ? order.boxCount ?? "—" : "—"}
                        </td>
                        <td>
                          <AdminBadge tone={statusTone(order.status)}>
                            {statusLabel(order.status)}
                          </AdminBadge>
                        </td>
                        <td>
                          <DocLinks orderId={order.id} />
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openOrder(order.id);
                            }}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                          >
                            {order.hasPacking
                              ? t("logistics.open")
                              : t("logistics.createShipment")}
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr className="bg-[var(--admin-brand-50)]/15">
                          <td colSpan={8} className="!p-0 !align-top">
                            <div className="border-t border-[var(--admin-border)] px-5 py-4">
                              <ShipmentProgressHorizontal
                                order={order}
                                formatDate={formatDate}
                                formatTime={formatTime}
                                labels={progressLabels}
                                size="sm"
                              />
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => openOrder(order.id)}
                                  className="admin-btn admin-btn-secondary admin-btn-sm"
                                >
                                  {t("logistics.openShipment")}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
