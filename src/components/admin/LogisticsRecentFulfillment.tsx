import Link from "next/link";
import type { OrderStatus } from "@/generated/prisma/enums";
import { AdminBadge } from "@/components/admin/ui";
import { AdminText } from "@/components/admin/AdminI18nBits";
import { shipmentStage } from "@/lib/logistics-progress";
import { Package } from "lucide-react";

export type RecentFulfillmentOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  updatedAt: string;
  companyName: string;
  route: string;
  totalUnits: number;
  lineCount: number;
  hasPacking: boolean;
  boxCount: number | null;
  cbm: number | null;
  trackingNumber: string | null;
  carrier: string | null;
  firstItemName: string | null;
  firstItemImage: string | null;
};

function orderTone(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "SHIPPED") return "warning" as const;
  if (status === "SENT_TO_SUPPLIER" || status === "PICKING")
    return "brand" as const;
  return "neutral" as const;
}

function statusLabelKey(status: string) {
  return `orders.status${status}`;
}

function hrefFor(order: RecentFulfillmentOrder) {
  if (
    order.hasPacking ||
    order.status === "SHIPPED" ||
    order.status === "COMPLETED"
  ) {
    return `/admin/logistics/shipments/${order.id}`;
  }
  return `/admin/logistics/${order.id}`;
}

function actionKey(order: RecentFulfillmentOrder) {
  if (order.status === "COMPLETED") return "dashboard.openLabel";
  if (order.hasPacking || order.status === "SHIPPED") return "logistics.view";
  return "logistics.createShipment";
}

export default function LogisticsRecentFulfillment({
  orders,
}: {
  orders: RecentFulfillmentOrder[];
}) {
  if (orders.length === 0) {
    return (
      <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
        <AdminText id="dashboard.noOrders" />
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            <th>
              <AdminText id="dashboard.colOrder" />
            </th>
            <th>
              <AdminText id="dashboard.colCompany" />
            </th>
            <th>
              <AdminText id="logistics.colRoute" />
            </th>
            <th>
              <AdminText id="dashboard.colUnits" />
            </th>
            <th>
              <AdminText id="dashboard.colTracking" />
            </th>
            <th>
              <AdminText id="dashboard.colStatus" />
            </th>
            <th className="text-right">
              <AdminText id="common.actions" />
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const stage = shipmentStage(order.status);
            const href = hrefFor(order);
            return (
              <tr key={order.id} className="group">
                <td>
                  <Link href={href} className="flex items-center gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--admin-gray-100)]">
                      {order.firstItemImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={order.firstItemImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-[var(--admin-muted)]" />
                      )}
                      <span
                        className="absolute inset-x-1 bottom-1 flex gap-0.5"
                        aria-hidden
                      >
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className={`h-0.5 flex-1 rounded-full ${
                              i <= stage
                                ? i === stage
                                  ? "bg-[var(--admin-brand-500)]"
                                  : "bg-sky-500"
                                : "bg-white/40"
                            }`}
                          />
                        ))}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--admin-text)] group-hover:text-[var(--admin-brand-500)]">
                        {order.orderNumber}
                      </p>
                      <p className="truncate text-xs text-[var(--admin-muted)]">
                        {order.firstItemName || "—"}
                        {order.lineCount > 1 ? ` +${order.lineCount - 1}` : ""}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="font-medium text-[var(--admin-text)]">
                  {order.companyName}
                </td>
                <td className="max-w-[9rem] truncate text-sm text-[var(--admin-muted)]">
                  {order.route}
                </td>
                <td className="tabular-nums">{order.totalUnits}</td>
                <td className="max-w-[11rem] truncate text-sm text-[var(--admin-muted)]">
                  {order.trackingNumber
                    ? `${order.carrier || ""} ${order.trackingNumber}`.trim()
                    : "—"}
                </td>
                <td>
                  <AdminBadge tone={orderTone(order.status)}>
                    <AdminText id={statusLabelKey(order.status)} />
                  </AdminBadge>
                </td>
                <td className="text-right">
                  <Link
                    href={href}
                    className="admin-btn admin-btn-primary admin-btn-sm"
                  >
                    <AdminText id={actionKey(order)} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
