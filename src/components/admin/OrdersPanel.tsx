"use client";

import { Fragment, useMemo, useState } from "react";
import {
  markPaymentReceived,
  updateOrderStatus,
  assignOrderToSupplier,
  deletePaymentSlip,
} from "@/lib/admin-actions";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { Package } from "@/components/admin/icons";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { useAppFeedback } from "@/components/ui/AppFeedback";
import DocumentDownloadMenu from "@/components/account/DocumentDownloadMenu";

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
  paymentPaid: boolean;
  paymentSlipUrl: string | null;
  paymentSlipName: string | null;
  paymentSlipMime: string | null;
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
  | "SLIP_IN"
  | "CONFIRMED"
  | "SENT_TO_SUPPLIER"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

const PIPELINE: OrderStatus[] = [
  "SUBMITTED",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "SENT_TO_SUPPLIER",
  "SHIPPED",
  "COMPLETED",
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  SUBMITTED: "PAYMENT_PENDING",
  PAYMENT_PENDING: "CONFIRMED",
  CONFIRMED: "SENT_TO_SUPPLIER",
  SENT_TO_SUPPLIER: "SHIPPED",
  PICKING: "SHIPPED",
  SHIPPED: "COMPLETED",
};

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

function pipelineStatus(status: OrderStatus): OrderStatus {
  return status === "PICKING" ? "SENT_TO_SUPPLIER" : status;
}

const FILTERS: { key: FilterKey; labelKey: string }[] = [
  { key: "all", labelKey: "orders.filterAll" },
  { key: "PAYMENT_PENDING", labelKey: "orders.filterPending" },
  { key: "SLIP_IN", labelKey: "orders.filterSlipIn" },
  { key: "CONFIRMED", labelKey: "orders.filterConfirmed" },
  { key: "SENT_TO_SUPPLIER", labelKey: "orders.filterSupplier" },
  { key: "SHIPPED", labelKey: "orders.filterShipped" },
  { key: "COMPLETED", labelKey: "orders.filterCompleted" },
  { key: "CANCELLED", labelKey: "orders.filterCancelled" },
];

function waitingSlip(order: OrdersPanelItem) {
  return Boolean(order.paymentSlipUrl) && !order.paymentPaid;
}

function matchesFilter(order: OrdersPanelItem, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "SLIP_IN") return waitingSlip(order);
  if (filter === "SENT_TO_SUPPLIER") {
    return order.status === "SENT_TO_SUPPLIER" || order.status === "PICKING";
  }
  return order.status === filter;
}

function slipHref(orderId: string) {
  return `/api/orders/${orderId}/payment-slip`;
}

function AdminSlipPhoto({
  orderId,
  fileName,
}: {
  orderId: string;
  fileName: string | null;
}) {
  const href = slipHref(orderId);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block overflow-hidden rounded-lg ring-1 ring-[var(--admin-border)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={href}
        alt={fileName || "Payment slip"}
        className="max-h-72 w-full bg-[var(--admin-hover)] object-contain"
      />
    </a>
  );
}

export default function OrdersPanel({
  orders,
  suppliers,
  allowedStatuses,
  canAssignSupplier,
  canDeleteSlip,
  openId = null,
}: {
  orders: OrdersPanelItem[];
  suppliers: OrdersPanelSupplier[];
  allowedStatuses: OrderStatus[];
  canAssignSupplier: boolean;
  canDeleteSlip: boolean;
  openId?: string | null;
}) {
  const { t, locale } = useAdminI18n();
  const [editingId, setEditingId] = useState<string | null>(openId);
  const [filter, setFilter] = useState<FilterKey>(() => {
    if (!openId) return "all";
    const opened = orders.find((o) => o.id === openId);
    return opened && waitingSlip(opened) ? "SLIP_IN" : "all";
  });

  const filtered = useMemo(() => {
    return orders.filter((o) => matchesFilter(o, filter));
  }, [orders, filter]);

  function payLabel(method: PaymentMethod, short = false) {
    const map: Record<PaymentMethod, string> = short
      ? {
          TT: t("orders.payShortTT"),
          CHECK: t("orders.payShortCheck"),
          ONLINE: t("orders.payShortOnline"),
          CREDIT: t("orders.payShortCredit"),
        }
      : {
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
              : orders.filter((o) => matchesFilter(o, f.key)).length;
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
          <div className="overflow-x-auto">
            <table className="admin-table admin-table-compact">
              <thead>
                <tr>
                  <th>{t("orders.colDate")}</th>
                  <th>{t("orders.colOrder")}</th>
                  <th>{t("orders.colCompany")}</th>
                  <th>{t("orders.colPayment")}</th>
                  <th>{t("orders.colTotal")}</th>
                  <th>{t("orders.colStatus")}</th>
                  <th className="text-center">{t("orders.colDocs")}</th>
                  <th className="text-right">{t("orders.updateStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const open = editingId === order.id;
                  const thumb = order.items[0]?.image;
                  const unpaid =
                    !order.paymentPaid && order.status !== "CANCELLED";
                  return (
                    <Fragment key={order.id}>
                      <tr
                        className={`cursor-pointer ${
                          open ? "bg-[var(--admin-brand-50)]/50" : ""
                        }`}
                        onClick={(e) => {
                          const el = e.target as HTMLElement;
                          if (el.closest("a, button, select, input, label, form"))
                            return;
                          setEditingId(open ? null : order.id);
                        }}
                      >
                        <td className="whitespace-nowrap font-medium tabular-nums text-[var(--admin-text)]">
                          {formatDate(order.createdAt)}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--admin-gray-100)]">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-3.5 w-3.5 text-[var(--admin-muted)]" />
                              )}
                            </div>
                            <p className="whitespace-nowrap font-semibold text-[var(--admin-text)]">
                              {order.orderNumber}
                            </p>
                          </div>
                        </td>
                        <td className="max-w-[9.5rem]">
                          <p className="truncate font-medium text-[var(--admin-text)]">
                            {order.companyName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">
                            {order.supplierName
                              ? order.supplierName
                              : t("orders.noSupplier")}
                          </p>
                        </td>
                        <td>
                          <p className="whitespace-nowrap text-sm">
                            {payLabel(order.paymentMethod, true)}
                          </p>
                          <span
                            className={`mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              unpaid
                                ? order.paymentSlipUrl
                                  ? "bg-[var(--admin-brand-50)] text-[var(--admin-brand-700)]"
                                  : "bg-[var(--admin-warning-50)] text-[var(--admin-warning-700)]"
                                : "bg-[var(--admin-success-50)] text-[var(--admin-success-700)]"
                            }`}
                          >
                            {unpaid
                              ? order.paymentSlipUrl
                                ? t("orders.slipIn")
                                : t("orders.unpaid")
                              : t("orders.paid")}
                          </span>
                        </td>
                        <td className="whitespace-nowrap tabular-nums text-sm font-semibold">
                          {money(order.total)}
                        </td>
                        <td>
                          <AdminBadge tone={orderTone(order.status)}>
                            {statusLabel(order.status)}
                          </AdminBadge>
                        </td>
                        <td className="text-center">
                          <OrderDocLinks
                            orderId={order.id}
                            compact
                            hasSlip={Boolean(order.paymentSlipUrl)}
                          />
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingId(open ? null : order.id)
                            }
                            className={`admin-btn admin-btn-sm ${
                              open
                                ? "admin-btn-secondary"
                                : "admin-btn-primary"
                            }`}
                          >
                            {open ? t("common.close") : t("orders.updateStatus")}
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr className="bg-[var(--admin-brand-50)]/20">
                          <td colSpan={8} className="!p-0 !align-top">
                            <OrderExpand
                              order={order}
                              suppliers={suppliers}
                              allowedStatuses={allowedStatuses}
                              canAssignSupplier={canAssignSupplier}
                              canDeleteSlip={canDeleteSlip}
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
  hasSlip = false,
}: {
  orderId: string;
  compact?: boolean;
  hasSlip?: boolean;
}) {
  const { t } = useAdminI18n();
  const docs = [
    { type: "pi" as const, short: t("orders.docPi"), full: t("orders.viewPi") },
    {
      type: "packing" as const,
      short: t("orders.docPackShort"),
      full: t("orders.viewPacking"),
    },
    { type: "invoice" as const, short: t("orders.docCi"), full: t("orders.viewCi") },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {docs.map((doc) => (
        <DocumentDownloadMenu
          key={doc.type}
          orderId={orderId}
          type={doc.type}
          compact
          variant="admin"
          label={compact ? doc.short : doc.full}
        />
      ))}
      {hasSlip ? (
        <a
          href={slipHref(orderId)}
          target="_blank"
          rel="noopener noreferrer"
          title={t("orders.viewSlip")}
          className={
            compact
              ? undefined
              : "admin-btn admin-btn-secondary admin-btn-sm !px-2.5 !text-xs"
          }
        >
          {compact ? t("orders.docSlip") : t("orders.viewSlip")}
        </a>
      ) : null}
    </div>
  );
}

function OrderPipeline({
  status,
  statusLabel,
}: {
  status: OrderStatus;
  statusLabel: (s: OrderStatus) => string;
}) {
  const { t } = useAdminI18n();
  if (status === "CANCELLED") {
    return (
      <p className="text-sm font-medium text-[var(--admin-error-700)]">
        {t("orders.statusCANCELLED")}
      </p>
    );
  }

  const current = pipelineStatus(status);
  const currentIndex = PIPELINE.indexOf(current);

  return (
    <ol className="admin-pipeline">
      {PIPELINE.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li
            key={step}
            className={`admin-pipeline-step ${
              done ? "is-done" : active ? "is-active" : "is-todo"
            }`}
          >
            <span className="admin-pipeline-dot" aria-hidden />
            <span className="admin-pipeline-label">{statusLabel(step)}</span>
            {i < PIPELINE.length - 1 ? (
              <span className="admin-pipeline-line" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function OrderExpand({
  order,
  suppliers,
  allowedStatuses,
  canAssignSupplier,
  canDeleteSlip,
  payLabel,
  statusLabel,
  onClose,
}: {
  order: OrdersPanelItem;
  suppliers: OrdersPanelSupplier[];
  allowedStatuses: OrderStatus[];
  canAssignSupplier: boolean;
  canDeleteSlip: boolean;
  payLabel: (m: PaymentMethod) => string;
  statusLabel: (s: OrderStatus) => string;
  onClose: () => void;
}) {
  const { t } = useAdminI18n();
  const { confirm, ui } = useAppFeedback();
  const shipment = order.shipments[0];
  const unpaid = !order.paymentPaid && order.status !== "CANCELLED";
  const next = NEXT_STATUS[order.status] ?? null;
  const canAdvance = Boolean(
    next &&
      allowedStatuses.includes(next) &&
      !(unpaid && next === "CONFIRMED"),
  );
  const canAssign =
    canAssignSupplier &&
    suppliers.length > 0 &&
    ["CONFIRMED", "SENT_TO_SUPPLIER", "PICKING", "SUBMITTED"].includes(
      order.status,
    );

  return (
    <div className="border-t border-[var(--admin-border)] bg-[var(--admin-card)]">
      {ui}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
        <div className="min-w-0 flex-1">
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
            {order.placedByStaffName ? (
              <>
                {" · "}
                {t("orders.placedByStaff", { name: order.placedByStaffName })}
              </>
            ) : null}
          </p>
          <div className="mt-3">
            <OrderPipeline status={order.status} statusLabel={statusLabel} />
          </div>
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
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border-2 border-[var(--admin-brand-200)] bg-[var(--admin-brand-25)] p-4">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-brand-700)] uppercase">
              {t("orders.updateStatus")}
            </p>
            {unpaid ? (
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
                <p className="mb-2 text-xs text-[var(--admin-muted)]">
                  {order.paymentSlipUrl
                    ? t("orders.markPaidHint")
                    : t("orders.markPaidNeedSlip")}
                </p>
                {order.paymentSlipUrl ? (
                  <>
                    <AdminSlipPhoto
                      orderId={order.id}
                      fileName={order.paymentSlipName}
                    />
                    <a
                      href={slipHref(order.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-2 mt-2 block text-xs font-semibold text-[var(--admin-brand-700)] underline"
                    >
                      {t("orders.viewSlip")}
                    </a>
                  </>
                ) : null}
                <button
                  type="submit"
                  disabled={!order.paymentSlipUrl && order.paymentMethod !== "CREDIT"}
                  className="admin-btn admin-btn-primary admin-btn-sm w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("orders.markPaid")}
                </button>
              </form>
            ) : null}
            {canAdvance ? (
              <form
                action={async () => {
                  await updateOrderStatus(order.id, next!);
                  onClose();
                }}
                className={unpaid ? "mb-3 border-t border-[var(--admin-brand-100)] pt-3" : "mb-3"}
              >
                <button
                  type="submit"
                  className={`admin-btn admin-btn-sm w-full sm:w-auto ${
                    unpaid ? "admin-btn-secondary" : "admin-btn-primary"
                  }`}
                >
                  {t("orders.advanceTo", { status: statusLabel(next!) })}
                </button>
              </form>
            ) : null}
            {allowedStatuses.length > 0 ? (
              <form
                action={async (fd) => {
                  const nextStatus = String(fd.get("status") || "") as OrderStatus;
                  if (!nextStatus) return;
                  await updateOrderStatus(order.id, nextStatus);
                  onClose();
                }}
                className="flex flex-wrap items-end gap-2 border-t border-[var(--admin-brand-100)] pt-3"
              >
                <label className="min-w-[10rem] flex-1 text-xs font-medium text-[var(--admin-muted)]">
                  {t("orders.otherStatus")}
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
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
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

          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("orders.documents")}
            </p>
            <OrderDocLinks
              orderId={order.id}
              hasSlip={Boolean(order.paymentSlipUrl)}
            />
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-[var(--admin-muted)]">
                  {t("orders.paymentSlip")}
                </span>
                {order.paymentSlipUrl ? (
                  <>
                    <AdminSlipPhoto
                      orderId={order.id}
                      fileName={order.paymentSlipName}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <a
                        href={slipHref(order.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--admin-brand-700)] underline"
                      >
                        {order.paymentSlipName || t("orders.viewSlip")}
                      </a>
                      {canDeleteSlip ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={async () => {
                            const ok = await confirm({
                              title: t("orders.deleteSlip"),
                              message: t("orders.deleteSlipConfirm"),
                              confirmLabel: t("orders.deleteSlip"),
                              tone: "danger",
                            });
                            if (!ok) return;
                            await deletePaymentSlip(order.id);
                            onClose();
                          }}
                        >
                          {t("orders.deleteSlip")}
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <span className="mt-1 block font-medium text-[var(--admin-warning-700)]">
                    {t("orders.noSlip")}
                  </span>
                )}
              </div>
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
        </div>
      </div>
    </div>
  );
}
