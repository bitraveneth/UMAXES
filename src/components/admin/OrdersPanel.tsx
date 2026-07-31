"use client";

import { Fragment, useMemo, useState } from "react";
import {
  markPaymentReceived,
  updateOrderStatus,
  assignOrderToSupplier,
} from "@/lib/admin-actions";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { Package } from "@/components/admin/icons";
import { useAdminI18n } from "@/components/admin/AdminI18n";

export type OrdersPanelSupplier = {
  id: string;
  name: string;
};

export type OrdersPanelItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentRef: string | null;
  notes: string | null;
  total: number;
  createdAt: string;
  companyName: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierNote: string | null;
  placedByStaffName: string | null;
  items: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    image: string | null;
  }[];
  shipments: {
    id: string;
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
  }[];
};

type FilterKey =
  | "all"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "SENT_TO_SUPPLIER"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function orderTone(status: string) {
  if (status === "COMPLETED" || status === "SHIPPED" || status === "CONFIRMED")
    return "success" as const;
  if (status === "CANCELLED") return "error" as const;
  if (status === "PAYMENT_PENDING" || status === "SUBMITTED")
    return "warning" as const;
  if (status === "SENT_TO_SUPPLIER" || status === "PICKING")
    return "brand" as const;
  return "neutral" as const;
}

const FILTERS: { key: FilterKey; labelKey: string }[] = [
  { key: "all", labelKey: "orders.filterAll" },
  { key: "PAYMENT_PENDING", labelKey: "orders.filterPending" },
  { key: "CONFIRMED", labelKey: "orders.filterConfirmed" },
  { key: "SENT_TO_SUPPLIER", labelKey: "orders.filterSupplier" },
  { key: "SHIPPED", labelKey: "orders.filterShipped" },
  { key: "COMPLETED", labelKey: "orders.filterCompleted" },
  { key: "CANCELLED", labelKey: "orders.filterCancelled" },
];

function matchesFilter(status: OrderStatus, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "SENT_TO_SUPPLIER") {
    return status === "SENT_TO_SUPPLIER" || status === "PICKING";
  }
  return status === filter;
}

export default function OrdersPanel({
  orders,
  suppliers,
  allowedStatuses,
  canAssignSupplier,
}: {
  orders: OrdersPanelItem[];
  suppliers: OrdersPanelSupplier[];
  allowedStatuses: OrderStatus[];
  canAssignSupplier: boolean;
}) {
  const { t, locale } = useAdminI18n();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => matchesFilter(o.status, filter));
  }, [orders, filter]);

  function payLabel(method: PaymentMethod) {
    const map: Record<PaymentMethod, string> = {
      TT: t("orders.payTT"),
      CHECK: t("orders.payCheck"),
      ONLINE: t("orders.payOnline"),
      CREDIT: t("orders.payCredit"),
    };
    return map[method] || method;
  }

  function statusLabel(status: OrderStatus) {
    return t(`orders.status${status}`);
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(
        locale === "zh" ? "zh-CN" : "en-US",
        { year: "numeric", month: "short", day: "numeric" },
      );
    } catch {
      return iso.slice(0, 10);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? orders.length
              : orders.filter((o) => matchesFilter(o.status, f.key)).length;
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
              <span
                className={`ml-1.5 tabular-nums ${
                  active ? "opacity-90" : "text-[var(--admin-muted)]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <div>
            <h2 className="admin-section-title mb-0">{t("orders.listed")}</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {t("orders.listedHint", { count: filtered.length })}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--admin-muted)]">
            {t("orders.noOrders")}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("orders.colOrder")}</th>
                  <th>{t("orders.colCompany")}</th>
                  <th>{t("orders.colSupplier")}</th>
                  <th>{t("orders.colDate")}</th>
                  <th>{t("orders.colPayment")}</th>
                  <th>{t("orders.colTotal")}</th>
                  <th>{t("orders.colStatus")}</th>
                  <th>{t("orders.colDocs")}</th>
                  <th className="text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const open = editingId === order.id;
                  const thumb = order.items[0]?.image;
                  return (
                    <Fragment key={order.id}>
                      <tr
                        className={
                          open ? "bg-[var(--admin-brand-50)]/40" : undefined
                        }
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--admin-gray-100)]">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-[var(--admin-muted)]" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--admin-text)]">
                                {order.orderNumber}
                              </p>
                              <p className="text-xs text-[var(--admin-muted)]">
                                {order.placedByStaffName
                                  ? `Staff: ${order.placedByStaffName}`
                                  : order.items[0]?.name || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="font-medium">{order.companyName}</td>
                        <td className="text-sm">
                          {order.supplierName || (
                            <span className="text-[var(--admin-muted)]">
                              {t("orders.noSupplier")}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap text-sm text-[var(--admin-muted)]">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="text-sm">{payLabel(order.paymentMethod)}</td>
                        <td className="tabular-nums font-medium">
                          {money(order.total)}
                        </td>
                        <td>
                          <AdminBadge tone={orderTone(order.status)}>
                            {statusLabel(order.status)}
                          </AdminBadge>
                        </td>
                        <td>
                          <OrderDocLinks orderId={order.id} compact />
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingId(open ? null : order.id)
                            }
                            className={`admin-btn admin-btn-sm ${
                              open
                                ? "admin-btn-primary"
                                : "admin-btn-secondary"
                            }`}
                          >
                            {open ? t("common.close") : t("common.edit")}
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr className="bg-[var(--admin-brand-50)]/25">
                          <td colSpan={9} className="!p-0 !align-top">
                            <OrderExpand
                              order={order}
                              suppliers={suppliers}
                              allowedStatuses={allowedStatuses}
                              canAssignSupplier={canAssignSupplier}
                              payLabel={payLabel}
                              statusLabel={statusLabel}
                              onClose={() => setEditingId(null)}
                            />
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

function OrderDocLinks({
  orderId,
  compact = false,
}: {
  orderId: string;
  compact?: boolean;
}) {
  const { t } = useAdminI18n();
  const links = [
    {
      type: "pi",
      short: t("orders.docPi"),
      full: t("orders.viewPi"),
    },
    {
      type: "packing",
      short: t("orders.docPack"),
      full: t("orders.viewPacking"),
    },
    {
      type: "invoice",
      short: t("orders.docCi"),
      full: t("orders.viewCi"),
    },
  ] as const;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((link) => (
        <a
          key={link.type}
          href={`/api/orders/${orderId}/docs?type=${link.type}`}
          target="_blank"
          rel="noopener noreferrer"
          title={link.full}
          className="admin-btn admin-btn-secondary admin-btn-sm !px-2 !text-xs"
        >
          {compact ? link.short : link.full}
        </a>
      ))}
    </div>
  );
}

function OrderExpand({
  order,
  suppliers,
  allowedStatuses,
  canAssignSupplier,
  payLabel,
  statusLabel,
  onClose,
}: {
  order: OrdersPanelItem;
  suppliers: OrdersPanelSupplier[];
  allowedStatuses: OrderStatus[];
  canAssignSupplier: boolean;
  payLabel: (m: PaymentMethod) => string;
  statusLabel: (s: OrderStatus) => string;
  onClose: () => void;
}) {
  const { t } = useAdminI18n();
  const shipment = order.shipments[0];
  const canAssign =
    canAssignSupplier &&
    suppliers.length > 0 &&
    ["CONFIRMED", "SENT_TO_SUPPLIER", "PICKING", "SUBMITTED"].includes(
      order.status,
    );

  return (
    <div className="border-t border-[var(--admin-border)] bg-[var(--admin-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--admin-text)]">
              {order.orderNumber}
            </h3>
            <AdminBadge tone={orderTone(order.status)}>
              {statusLabel(order.status)}
            </AdminBadge>
          </div>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {order.companyName}
            {" · "}
            {payLabel(order.paymentMethod)}
            {" · "}
            <span className="font-medium text-[var(--admin-text)]">
              {money(order.total)}
            </span>
            {order.supplierName ? (
              <>
                {" · "}
                <span className="font-medium text-[var(--admin-text)]">
                  {order.supplierName}
                </span>
              </>
            ) : null}
            {order.placedByStaffName ? (
              <>
                {" · "}
                Placed by {order.placedByStaffName}
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="admin-btn admin-btn-secondary admin-btn-sm"
        >
          {t("common.close")}
        </button>
      </div>

      <div className="grid gap-4 px-5 py-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
            {t("orders.lineItems")}
          </p>
          <ul className="divide-y divide-[var(--admin-border)]">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--admin-gray-100)]">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-4 w-4 text-[var(--admin-muted)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">{item.sku}</p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="tabular-nums text-[var(--admin-muted)]">
                    {t("orders.qty")} {item.quantity} × {money(item.unitPrice)}
                  </p>
                  <p className="font-medium tabular-nums text-[var(--admin-text)]">
                    {money(item.quantity * item.unitPrice)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("orders.documents")}
            </p>
            <OrderDocLinks orderId={order.id} />
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-[var(--admin-muted)]">
                  {t("orders.paymentRef")}
                </span>
                <br />
                <span className="font-medium text-[var(--admin-text)]">
                  {order.paymentRef || t("orders.noRef")}
                </span>
              </p>
              <p>
                <span className="text-[var(--admin-muted)]">
                  {t("orders.colSupplier")}
                </span>
                <br />
                <span className="font-medium text-[var(--admin-text)]">
                  {order.supplierName || t("orders.noSupplier")}
                </span>
                {order.supplierNote ? (
                  <span className="mt-1 block text-xs text-[var(--admin-muted)]">
                    {order.supplierNote}
                  </span>
                ) : null}
              </p>
              <p>
                <span className="text-[var(--admin-muted)]">
                  {t("orders.shipment")}
                </span>
                <br />
                <span className="font-medium text-[var(--admin-text)]">
                  {shipment
                    ? [
                        shipment.carrier,
                        shipment.trackingNumber,
                        shipment.status,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : t("orders.noShipment")}
                </span>
              </p>
              {order.notes ? (
                <p>
                  <span className="text-[var(--admin-muted)]">
                    {t("orders.notes")}
                  </span>
                  <br />
                  <span className="text-[var(--admin-text)]">{order.notes}</span>
                </p>
              ) : null}
            </div>
          </div>

          {canAssign ? (
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
              <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
                {t("orders.assignSupplier")}
              </p>
              <form
                action={async (fd) => {
                  const supplierId = String(fd.get("supplierId") || "");
                  const note = String(fd.get("supplierNote") || "");
                  if (!supplierId) return;
                  await assignOrderToSupplier(order.id, supplierId, note);
                  onClose();
                }}
                className="space-y-3"
              >
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("orders.colSupplier")}
                  <select
                    name="supplierId"
                    required
                    defaultValue={order.supplierId || ""}
                    className="admin-input mt-1.5 w-full"
                  >
                    <option value="" disabled>
                      {t("orders.selectSupplier")}
                    </option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("orders.supplierNote")}
                  <input
                    name="supplierNote"
                    defaultValue={order.supplierNote || ""}
                    className="admin-input mt-1.5 w-full"
                    placeholder={t("orders.supplierNotePlaceholder")}
                  />
                </label>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary admin-btn-sm w-full sm:w-auto"
                >
                  {t("orders.sendToSupplier")}
                </button>
              </form>
            </div>
          ) : null}

          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("orders.updateStatus")}
            </p>
            {order.status === "PAYMENT_PENDING" ? (
              <form
                action={async () => {
                  await markPaymentReceived(
                    order.id,
                    order.paymentRef || "TT/CHECK received",
                  );
                  onClose();
                }}
                className="mb-3"
              >
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary admin-btn-sm w-full sm:w-auto"
                >
                  {t("orders.markPaid")}
                </button>
              </form>
            ) : null}
            {allowedStatuses.length > 0 ? (
              <form
                action={async (fd) => {
                  const next = String(fd.get("status") || "") as OrderStatus;
                  if (!next) return;
                  await updateOrderStatus(order.id, next);
                  onClose();
                }}
                className="flex flex-wrap items-end gap-2"
              >
                <label className="min-w-[10rem] flex-1 text-xs font-medium text-[var(--admin-muted)]">
                  {t("orders.statusLabel")}
                  <select
                    name="status"
                    defaultValue={
                      order.status === "PICKING"
                        ? "SENT_TO_SUPPLIER"
                        : order.status
                    }
                    className="admin-input mt-1.5 w-full"
                  >
                    {allowedStatuses.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  {t("orders.applyStatus")}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
