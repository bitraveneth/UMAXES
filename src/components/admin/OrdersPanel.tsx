"use client";

import { Fragment, useMemo, useState } from "react";
import {
  markPaymentReceived,
  updateOrderPaymentStatus,
  updateOrderStatus,
  deletePaymentSlip,
} from "@/lib/admin-actions";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { Package } from "@/components/admin/icons";
import { ClipboardList, FileText } from "lucide-react";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { useAppFeedback } from "@/components/ui/AppFeedback";
import {
  ADMIN_PAYMENT_STATUSES,
  type AdminPaymentStatus,
} from "@/lib/payment-slip";

export type OrdersPanelItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentRef: string | null;
  paymentStatus: string;
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
  return (
    (order.paymentStatus === "submitted" || Boolean(order.paymentSlipUrl)) &&
    !order.paymentPaid
  );
}

function paymentTone(status: string) {
  if (status === "paid" || status === "on_terms") return "success" as const;
  if (status === "rejected") return "error" as const;
  if (status === "submitted") return "brand" as const;
  return "warning" as const;
}

function normalizePaymentStatus(status: string): AdminPaymentStatus {
  if (status === "submitted" || status === "paid" || status === "rejected") {
    return status;
  }
  return "pending";
}

function paymentStatusLabelKey(status: string) {
  const normalized = normalizePaymentStatus(status);
  if (normalized === "submitted") return "orders.payStatusSubmitted" as const;
  if (normalized === "paid") return "orders.payStatusPaid" as const;
  if (normalized === "rejected") return "orders.payStatusRejected" as const;
  return "orders.payStatusPending" as const;
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
  allowedStatuses,
  canDeleteSlip,
  openId = null,
}: {
  orders: OrdersPanelItem[];
  allowedStatuses: OrderStatus[];
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
                  <th>{t("orders.colShipping")}</th>
                  <th>{t("orders.colTotal")}</th>
                  <th className="whitespace-nowrap">{t("orders.colDocs")}</th>
                  <th className="w-[1%] whitespace-nowrap pr-5 text-right">
                    {t("orders.updateStatus")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const open = editingId === order.id;
                  const thumb = order.items[0]?.image;
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
                        <td className="max-w-[10rem]">
                          <p
                            className="truncate font-medium text-[var(--admin-text)]"
                            title={order.companyName}
                          >
                            {order.companyName}
                          </p>
                          {order.supplierName ? (
                            <p
                              className="mt-0.5 truncate text-xs text-[var(--admin-muted)]"
                              title={order.supplierName}
                            >
                              {order.supplierName}
                            </p>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap">
                          <AdminBadge
                            tone={paymentTone(
                              order.paymentMethod === "CREDIT"
                                ? order.paymentPaid
                                  ? "paid"
                                  : "on_terms"
                                : order.paymentStatus,
                            )}
                          >
                            {order.paymentMethod === "CREDIT"
                              ? order.paymentPaid
                                ? t("orders.payStatusPaid")
                                : t("orders.payCredit")
                              : t(paymentStatusLabelKey(order.paymentStatus))}
                          </AdminBadge>
                        </td>
                        <td className="whitespace-nowrap">
                          <AdminBadge tone={orderTone(order.status)}>
                            {statusLabel(order.status)}
                          </AdminBadge>
                        </td>
                        <td className="whitespace-nowrap tabular-nums text-sm font-semibold">
                          {money(order.total)}
                        </td>
                        <td className="whitespace-nowrap">
                          <OrderDocLinks orderId={order.id} compact />
                        </td>
                        <td className="w-[1%] whitespace-nowrap pr-5 text-right align-middle">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingId(open ? null : order.id)
                            }
                            className={`admin-btn admin-btn-sm ml-auto ${
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
                          <td
                            colSpan={8}
                            className="!p-0 !align-top !text-left"
                          >
                            <OrderExpand
                              order={order}
                              allowedStatuses={allowedStatuses}
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
}: {
  orderId: string;
  compact?: boolean;
}) {
  const { t } = useAdminI18n();
  const docs = [
    {
      type: "pi" as const,
      label: t("orders.docPiBtn"),
      Icon: FileText,
    },
    {
      type: "packing" as const,
      label: t("orders.docPackBtn"),
      Icon: ClipboardList,
    },
  ];

  return (
    <div
      className={`admin-order-doc-links ${compact ? "is-compact" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {docs.map((doc) => {
        const Icon = doc.Icon;
        return (
          <a
            key={doc.type}
            href={`/api/orders/${orderId}/docs?type=${doc.type}`}
            target="_blank"
            rel="noopener noreferrer"
            title={doc.label}
            className="admin-order-doc-btn"
          >
            <Icon
              className={compact ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0"}
              strokeWidth={2}
              aria-hidden
            />
            <span>{doc.label}</span>
          </a>
        );
      })}
    </div>
  );
}

function OrderPipeline({
  status,
  paymentPaid,
  paymentMethod,
  statusLabel,
}: {
  status: OrderStatus;
  paymentPaid: boolean;
  paymentMethod: PaymentMethod;
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
  // Credit is on terms; cash/TT must actually be paid before this step looks "done".
  const paymentSettled = paymentMethod === "CREDIT" || paymentPaid;

  return (
    <ol className="admin-pipeline" aria-label={t("orders.colShipping")}>
      {PIPELINE.map((step, i) => {
        const isPayStep = step === "PAYMENT_PENDING";
        const unpaidPayStep = isPayStep && !paymentSettled;
        const done = !unpaidPayStep && i < currentIndex;
        const active = unpaidPayStep
          ? true
          : !done && i === currentIndex;
        const stateClass = unpaidPayStep
          ? "is-pay-pending"
          : done
            ? "is-done"
            : active
              ? "is-active"
              : "is-todo";
        return (
          <li key={step} className={`admin-pipeline-step ${stateClass}`}>
            <span className="admin-pipeline-node" aria-hidden>
              {done ? (
                <svg
                  className="admin-pipeline-check"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.5 8.2 6.4 11l6.1-6.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <span className="admin-pipeline-label">{statusLabel(step)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderExpand({
  order,
  allowedStatuses,
  canDeleteSlip,
  payLabel,
  statusLabel,
  onClose,
}: {
  order: OrdersPanelItem;
  allowedStatuses: OrderStatus[];
  canDeleteSlip: boolean;
  payLabel: (m: PaymentMethod) => string;
  statusLabel: (s: OrderStatus) => string;
  onClose: () => void;
}) {
  const { t } = useAdminI18n();
  const { confirm, ui } = useAppFeedback();
  const shipment = order.shipments[0];
  const isCredit = order.paymentMethod === "CREDIT";

  const fulfillmentStatuses: OrderStatus[] = allowedStatuses.filter(
    (s) => s !== "SUBMITTED" && s !== "PAYMENT_PENDING",
  );
  const preferredStatus: OrderStatus =
    order.status === "PICKING" ? "SENT_TO_SUPPLIER" : order.status;
  const defaultFulfillment = fulfillmentStatuses.includes(preferredStatus)
    ? preferredStatus
    : fulfillmentStatuses[0] || preferredStatus;

  const currentPayStatus = normalizePaymentStatus(order.paymentStatus);
  const methodLabel = payLabel(order.paymentMethod);
  const paySituation = isCredit
    ? order.paymentPaid
      ? t("orders.payStatusPaid")
      : t("orders.payOnTerms")
    : t(paymentStatusLabelKey(order.paymentStatus));
  const payTone = paymentTone(
    isCredit
      ? order.paymentPaid
        ? "paid"
        : "on_terms"
      : order.paymentStatus,
  );
  const totalPcs = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const trackingRows = order.shipments.filter(
    (s) => s.trackingNumber || s.carrier,
  );

  return (
    <div className="border-t border-[var(--admin-border)] bg-[var(--admin-card)]">
      {ui}
      <div className="space-y-6 px-5 py-6 sm:px-6 sm:py-7">
        <div className="admin-order-expand-head">
          <div className="admin-order-expand-head-main">
            <h3 className="admin-order-expand-no">{order.orderNumber}</h3>
            <p className="admin-order-expand-company">{order.companyName}</p>
            <div className="admin-order-expand-meta">
              <span className="admin-order-expand-chip">{methodLabel}</span>
              <span className="admin-order-expand-chip admin-order-expand-chip-amount">
                {money(order.total)}
              </span>
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

        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-4 py-5 sm:px-6 sm:py-6">
          <OrderPipeline
            status={order.status}
            paymentPaid={order.paymentPaid}
            paymentMethod={order.paymentMethod}
            statusLabel={statusLabel}
          />
        </div>

        <div className="admin-order-split">
          <section className="admin-order-lines">
            <div className="admin-order-card-title">{t("orders.lineItems")}</div>
            {order.items.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[var(--admin-muted)]">
                {t("common.noData")}
              </p>
            ) : (
              <>
                <div className="admin-order-lines-head" role="row">
                  <span className="admin-order-lines-h-item">
                    {t("orders.sku")}
                  </span>
                  <span className="admin-order-lines-h-qty">
                    {t("orders.quantity")}
                  </span>
                  <span className="admin-order-lines-h-price">
                    {t("orders.price")}
                  </span>
                </div>
                <ul className="admin-order-lines-list">
                  {order.items.map((item) => (
                    <li key={item.id} className="admin-order-line">
                      <div className="admin-order-line-main">
                        <p className="admin-order-line-name">{item.name}</p>
                        <span className="admin-order-line-sku" title={item.sku}>
                          {item.sku}
                        </span>
                      </div>
                      <div className="admin-order-line-qty">
                        <strong>{item.quantity}</strong>
                      </div>
                      <div className="admin-order-line-money">
                        <strong>{money(item.unitPrice)}</strong>
                        <span className="admin-order-line-total">
                          {money(item.quantity * item.unitPrice)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="admin-order-lines-foot">
              <span className="admin-order-lines-foot-spacer" aria-hidden />
              <strong className="admin-order-lines-foot-qty">
                {totalPcs} {t("orders.pcs")}
              </strong>
              <strong className="admin-order-lines-foot-amount">
                {money(order.total)}
              </strong>
            </div>
          </section>

          <section className="admin-order-detail-card">
            <div className="admin-order-card-title">{t("orders.detail")}</div>
            <dl className="admin-order-detail-list">
              <div>
                <dt>{t("orders.colCompany")}</dt>
                <dd>{order.companyName}</dd>
              </div>
              <div>
                <dt>{t("orders.colPayment")}</dt>
                <dd>
                  {methodLabel}
                  <span className="admin-order-detail-sep">·</span>
                  {paySituation}
                </dd>
              </div>
              <div>
                <dt>{t("orders.colTotal")}</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
              <div>
                <dt>{t("orders.quantity")}</dt>
                <dd className="tabular-nums">
                  {totalPcs} {t("orders.pcs")}
                </dd>
              </div>
              <div>
                <dt>{t("orders.colSupplier")}</dt>
                <dd>{order.supplierName || t("orders.noSupplier")}</dd>
              </div>
              <div>
                <dt>{t("orders.trackingFooter")}</dt>
                <dd className="font-mono text-[0.85rem]">
                  {trackingRows[0]?.trackingNumber ||
                    shipment?.trackingNumber ||
                    t("orders.noTracking")}
                </dd>
              </div>
              {order.paymentRef ? (
                <div>
                  <dt>{t("orders.paymentRef")}</dt>
                  <dd>{order.paymentRef}</dd>
                </div>
              ) : null}
              {order.placedByStaffName ? (
                <div>
                  <dt>{t("orders.staffLabel")}</dt>
                  <dd>{order.placedByStaffName}</dd>
                </div>
              ) : null}
              {order.notes ? (
                <div className="admin-order-detail-notes">
                  <dt>{t("orders.notes")}</dt>
                  <dd>{order.notes}</dd>
                </div>
              ) : null}
            </dl>
            <div className="admin-order-detail-docs">
              <OrderDocLinks orderId={order.id} />
              {order.paymentSlipUrl ? (
                <a
                  href={slipHref(order.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  {t("orders.docSlip")}
                </a>
              ) : null}
              {order.paymentSlipUrl && canDeleteSlip ? (
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
            {order.paymentSlipUrl ? (
              <div className="mt-3">
                <AdminSlipPhoto
                  orderId={order.id}
                  fileName={order.paymentSlipName}
                />
              </div>
            ) : null}
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h4 className="m-0 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
                {t("orders.paymentPanelTitle")}
              </h4>
              <AdminBadge tone={payTone}>{paySituation}</AdminBadge>
            </div>
            {!isCredit ? (
              <form
                action={async (fd) => {
                  const nextPay = String(
                    fd.get("paymentStatus") || "",
                  ) as AdminPaymentStatus;
                  if (!ADMIN_PAYMENT_STATUSES.includes(nextPay)) return;
                  await updateOrderPaymentStatus(
                    order.id,
                    nextPay,
                    order.paymentRef || undefined,
                  );
                  onClose();
                }}
                className="space-y-3"
              >
                <select
                  name="paymentStatus"
                  defaultValue={currentPayStatus}
                  aria-label={t("orders.paymentStatus")}
                  className="admin-input w-full"
                >
                  {ADMIN_PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(paymentStatusLabelKey(s))}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary admin-btn-sm"
                >
                  {t("orders.savePayment")}
                </button>
              </form>
            ) : !order.paymentPaid ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--admin-muted)]">
                  {t("orders.markPaidHint")}
                </p>
                <form
                  action={async () => {
                    await markPaymentReceived(
                      order.id,
                      order.paymentRef || "Credit settlement",
                    );
                    onClose();
                  }}
                >
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary admin-btn-sm"
                  >
                    {t("orders.markPaid")}
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-sm font-medium text-[var(--admin-success-700)]">
                {t("orders.payStatusPaid")}
              </p>
            )}
            {!isCredit && !order.paymentSlipUrl ? (
              <p className="mt-3 text-sm font-medium text-[var(--admin-warning-700)]">
                {t("orders.noSlip")}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h4 className="m-0 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
                {t("orders.shippingPanelTitle")}
              </h4>
              <AdminBadge tone={orderTone(order.status)}>
                {statusLabel(order.status)}
              </AdminBadge>
            </div>
            {fulfillmentStatuses.length > 0 ? (
              <form
                action={async (fd) => {
                  const nextStatus = String(
                    fd.get("status") || "",
                  ) as OrderStatus;
                  if (!nextStatus) return;
                  await updateOrderStatus(order.id, nextStatus);
                  onClose();
                }}
                className="space-y-3"
              >
                <select
                  name="status"
                  defaultValue={defaultFulfillment}
                  aria-label={t("orders.statusLabel")}
                  className="admin-input w-full"
                >
                  {fulfillmentStatuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary admin-btn-sm"
                >
                  {t("orders.applyStatus")}
                </button>
              </form>
            ) : (
              <p className="text-sm text-[var(--admin-muted)]">
                {statusLabel(order.status)}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
