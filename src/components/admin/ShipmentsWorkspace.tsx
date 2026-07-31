"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";

export type ShipmentsWorkspaceOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  companyLevel: string;
  route: string;
  addressLines: string[];
  notes: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  hasPacking: boolean;
  boxCount: number | null;
  cbm: number | null;
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

type ShipmentFilter =
  | "all"
  | "awaiting_tracking"
  | "in_transit"
  | "delivered";

function statusTone(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "SHIPPED") return "warning" as const;
  if (status === "SENT_TO_SUPPLIER" || status === "PICKING")
    return "brand" as const;
  return "neutral" as const;
}

function isShipment(o: ShipmentsWorkspaceOrder) {
  return o.hasPacking || o.status === "SHIPPED" || o.status === "COMPLETED";
}

function matchesFilter(o: ShipmentsWorkspaceOrder, filter: ShipmentFilter) {
  if (filter === "all") return true;
  if (filter === "delivered") return o.status === "COMPLETED";
  if (filter === "in_transit") return o.status === "SHIPPED";
  if (filter === "awaiting_tracking") {
    return (
      o.hasPacking &&
      o.status !== "SHIPPED" &&
      o.status !== "COMPLETED" &&
      !o.shipment?.trackingNumber
    );
  }
  return true;
}

export default function ShipmentsWorkspace({
  orders,
}: {
  orders: ShipmentsWorkspaceOrder[];
}) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const [filter, setFilter] = useState<ShipmentFilter>("all");

  const shipments = useMemo(() => orders.filter(isShipment), [orders]);
  const list = useMemo(
    () => shipments.filter((o) => matchesFilter(o, filter)),
    [shipments, filter],
  );

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

  const filters: { key: ShipmentFilter; labelKey: string }[] = [
    { key: "all", labelKey: "logistics.filterAll" },
    { key: "awaiting_tracking", labelKey: "logistics.filterAwaitingTracking" },
    { key: "in_transit", labelKey: "logistics.filterTransit" },
    { key: "delivered", labelKey: "logistics.filterDelivered" },
  ];

  function openView(id: string) {
    router.push(`/admin/logistics/shipments/${id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const count = shipments.filter((o) => matchesFilter(o, f.key)).length;
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
              <span className="ml-1 tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <AdminCard padded={false}>
        <div className="border-b border-[var(--admin-border)] px-5 py-4">
          <h2 className="admin-section-title mb-0">
            {t("logistics.tabShipments")}
          </h2>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t("logistics.tabShipmentsHint")}
          </p>
        </div>

        {list.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
            {t("logistics.emptyShipments")}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("logistics.colOrder")}</th>
                  <th>{t("logistics.colCompany")}</th>
                  <th>{t("logistics.colRoute")}</th>
                  <th>{t("logistics.colArrival")}</th>
                  <th>{t("logistics.boxCount")}</th>
                  <th>{t("logistics.colTracking")}</th>
                  <th>{t("logistics.colStatus")}</th>
                  <th className="text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => openView(order.id)}
                  >
                    <td className="font-semibold text-[var(--admin-muted)]">
                      {order.orderNumber}
                    </td>
                    <td className="font-medium text-[var(--admin-text)]">
                      {order.companyName}
                    </td>
                    <td className="max-w-[10rem] truncate text-sm">
                      {order.route}
                    </td>
                    <td className="whitespace-nowrap text-sm text-[var(--admin-muted)]">
                      {formatDate(order.updatedAt)}
                    </td>
                    <td className="tabular-nums">{order.boxCount ?? "—"}</td>
                    <td className="max-w-[10rem] truncate text-sm text-[var(--admin-muted)]">
                      {order.shipment?.trackingNumber
                        ? `${order.shipment.carrier || ""} ${order.shipment.trackingNumber}`.trim()
                        : t("logistics.noTrackingYet")}
                    </td>
                    <td>
                      <AdminBadge tone={statusTone(order.status)}>
                        {statusLabel(order.status)}
                      </AdminBadge>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openView(order.id);
                        }}
                        className="admin-btn admin-btn-primary admin-btn-sm"
                      >
                        {t("logistics.view")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
