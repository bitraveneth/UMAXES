"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { Package } from "lucide-react";

export type LogisticsWorkspaceOrder = {
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

type Filter = "all" | "confirmed" | "supplier";

function statusTone(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "SHIPPED") return "warning" as const;
  if (status === "SENT_TO_SUPPLIER" || status === "PICKING")
    return "brand" as const;
  return "neutral" as const;
}

function isOrderQueue(o: LogisticsWorkspaceOrder) {
  if (o.hasPacking) return false;
  return (
    o.status === "SENT_TO_SUPPLIER" ||
    o.status === "PICKING" ||
    o.status === "CONFIRMED"
  );
}

function matchesFilter(o: LogisticsWorkspaceOrder, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "confirmed") return o.status === "CONFIRMED";
  if (filter === "supplier")
    return o.status === "SENT_TO_SUPPLIER" || o.status === "PICKING";
  return true;
}

export default function LogisticsWorkspace({
  orders,
}: {
  orders: LogisticsWorkspaceOrder[];
}) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const queue = useMemo(() => orders.filter(isOrderQueue), [orders]);
  const list = useMemo(
    () => queue.filter((o) => matchesFilter(o, filter)),
    [queue, filter],
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

  const filters: { key: Filter; labelKey: string }[] = [
    { key: "all", labelKey: "logistics.filterAll" },
    { key: "confirmed", labelKey: "logistics.statusCONFIRMED" },
    { key: "supplier", labelKey: "logistics.statusSENT_TO_SUPPLIER" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const count = queue.filter((o) => matchesFilter(o, f.key)).length;
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
          <h2 className="admin-section-title mb-0">{t("logistics.tabOrders")}</h2>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t("logistics.tabOrdersHint")}
          </p>
        </div>

        {list.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
            {t("logistics.emptyOrders")}
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
                  <th>{t("logistics.colQty")}</th>
                  <th>{t("logistics.colStatus")}</th>
                  <th className="text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((order) => {
                  const units = order.items.reduce((n, i) => n + i.quantity, 0);
                  return (
                    <tr
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/logistics/${order.id}`)
                      }
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--admin-gray-100)]">
                            {order.items[0]?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={order.items[0].image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-[var(--admin-muted)]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--admin-muted)]">
                              {order.orderNumber}
                            </p>
                            <p className="truncate text-xs text-[var(--admin-muted)]">
                              {order.items[0]?.name || "—"}
                              {order.items.length > 1
                                ? ` +${order.items.length - 1}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-[var(--admin-text)]">
                          {order.companyName}
                        </p>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {order.companyLevel}
                        </p>
                      </td>
                      <td className="max-w-[10rem] truncate text-sm">
                        {order.route}
                      </td>
                      <td className="whitespace-nowrap text-sm text-[var(--admin-muted)]">
                        {formatDate(order.updatedAt)}
                      </td>
                      <td className="tabular-nums">{units}</td>
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
                            router.push(`/admin/logistics/${order.id}`);
                          }}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                        >
                          {t("logistics.createShipment")}
                        </button>
                      </td>
                    </tr>
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
