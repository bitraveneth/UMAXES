"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateRmaStatus,
  markRmaReplacement,
} from "@/lib/admin-actions";
import type {
  CustomerLevel,
  RmaReasonType,
  RmaResolution,
  RmaStatus,
} from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { Package } from "@/components/admin/icons";
import { MapPin, RotateCcw } from "lucide-react";

export type RmaPanelItem = {
  id: string;
  rmaNumber: string;
  status: RmaStatus;
  reasonType: RmaReasonType;
  resolution: RmaResolution;
  reason: string;
  creditAmount: number | null;
  adminNote: string | null;
  replacementNeeded: boolean;
  replacementNote: string | null;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  companyLevel: CustomerLevel;
  contactName: string | null;
  contactEmail: string | null;
  orderNumber: string;
  orderId: string;
  shipRoute: string;
  shipLines: string[];
  items: {
    id: string;
    sku: string;
    name: string;
    flavor: string | null;
    optionsLabel: string | null;
    quantity: number;
    unitPrice: number;
    image: string | null;
  }[];
};

type FilterKey =
  | "all"
  | "REQUESTED"
  | "APPROVED"
  | "RECEIVED"
  | "CREDITED"
  | "REPLACEMENT"
  | "DAMAGE"
  | "CLOSED";

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function statusTone(status: string) {
  if (status === "APPROVED" || status === "CREDITED" || status === "CLOSED")
    return "success" as const;
  if (status === "REJECTED") return "error" as const;
  if (status === "RECEIVED") return "brand" as const;
  return "warning" as const;
}

function reasonTone(type: string) {
  if (type === "DAMAGE" || type === "DEFECT") return "error" as const;
  if (type === "RETURN") return "brand" as const;
  return "neutral" as const;
}

const FILTERS: { key: FilterKey; labelKey: string }[] = [
  { key: "all", labelKey: "rma.filterAll" },
  { key: "REQUESTED", labelKey: "rma.filterRequested" },
  { key: "APPROVED", labelKey: "rma.filterApproved" },
  { key: "RECEIVED", labelKey: "rma.filterReceived" },
  { key: "CREDITED", labelKey: "rma.filterCredited" },
  { key: "REPLACEMENT", labelKey: "rma.filterReplacement" },
  { key: "DAMAGE", labelKey: "rma.filterDamage" },
  { key: "CLOSED", labelKey: "rma.filterClosed" },
];

function matchesFilter(row: RmaPanelItem, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "REPLACEMENT") return row.replacementNeeded;
  if (filter === "DAMAGE")
    return row.reasonType === "DAMAGE" || row.reasonType === "DEFECT";
  if (filter === "CLOSED")
    return row.status === "CLOSED" || row.status === "REJECTED";
  return row.status === filter;
}

export default function RmaPanel({ items }: { items: RmaPanelItem[] }) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => items.filter((r) => matchesFilter(r, filter)),
    [items, filter],
  );

  function levelLabel(level: CustomerLevel) {
    return t(`rma.level${level}`) || level;
  }

  function statusLabel(s: RmaStatus) {
    return t(`rma.status${s}`) || s;
  }

  function reasonLabel(s: RmaReasonType) {
    return t(`rma.reason${s}`) || s;
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso.slice(0, 16);
    }
  }

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? items.length
              : items.filter((r) => matchesFilter(r, f.key)).length;
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
        <div className="border-b border-[var(--admin-border)] px-5 py-4">
          <h2 className="admin-section-title mb-0">{t("rma.history")}</h2>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t("rma.historyHint", { count: filtered.length, total: items.length })}
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
            {items.length === 0 ? t("rma.empty") : t("rma.emptyFilter")}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("rma.colRma")}</th>
                  <th>{t("rma.colCustomer")}</th>
                  <th>{t("rma.colOrder")}</th>
                  <th>{t("rma.colProducts")}</th>
                  <th>{t("rma.colShipTo")}</th>
                  <th>{t("rma.colType")}</th>
                  <th>{t("rma.colStatus")}</th>
                  <th className="text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const open = openId === row.id;
                  const qty = row.items.reduce((s, i) => s + i.quantity, 0);
                  const thumb = row.items[0]?.image;
                  return (
                    <Fragment key={row.id}>
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
                                <RotateCcw className="h-4 w-4 text-[var(--admin-muted)]" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--admin-text)]">
                                {row.rmaNumber}
                              </p>
                              <p className="text-xs text-[var(--admin-muted)]">
                                {formatDate(row.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="font-medium">{row.companyName}</p>
                          <p className="text-xs text-[var(--admin-muted)]">
                            {levelLabel(row.companyLevel)}
                            {row.contactName ? ` · ${row.contactName}` : ""}
                          </p>
                        </td>
                        <td className="whitespace-nowrap font-medium">
                          {row.orderNumber}
                        </td>
                        <td className="text-sm">
                          <p className="font-medium">
                            {row.items[0]?.flavor ||
                              row.items[0]?.name ||
                              "—"}
                            {row.items.length > 1
                              ? ` +${row.items.length - 1}`
                              : ""}
                          </p>
                          <p className="text-xs text-[var(--admin-muted)]">
                            {t("rma.qty")} {qty}
                          </p>
                        </td>
                        <td className="max-w-[10rem] truncate text-sm text-[var(--admin-muted)]">
                          {row.shipRoute}
                        </td>
                        <td>
                          <AdminBadge tone={reasonTone(row.reasonType)}>
                            {reasonLabel(row.reasonType)}
                          </AdminBadge>
                          {row.replacementNeeded ? (
                            <span className="mt-1 block text-[10px] font-bold tracking-wide text-[var(--admin-brand-500)] uppercase">
                              {t("rma.needsReship")}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <AdminBadge tone={statusTone(row.status)}>
                            {statusLabel(row.status)}
                          </AdminBadge>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => setOpenId(open ? null : row.id)}
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
                          <td colSpan={8} className="!p-0 !align-top">
                            <RmaExpand
                              row={row}
                              pending={pending}
                              levelLabel={levelLabel}
                              statusLabel={statusLabel}
                              reasonLabel={reasonLabel}
                              formatDate={formatDate}
                              onClose={() => setOpenId(null)}
                              run={run}
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

function RmaExpand({
  row,
  pending,
  levelLabel,
  statusLabel,
  reasonLabel,
  formatDate,
  onClose,
  run,
}: {
  row: RmaPanelItem;
  pending: boolean;
  levelLabel: (l: CustomerLevel) => string;
  statusLabel: (s: RmaStatus) => string;
  reasonLabel: (s: RmaReasonType) => string;
  formatDate: (iso: string) => string;
  onClose: () => void;
  run: (action: () => Promise<void>) => void;
}) {
  const { t } = useAdminI18n();
  const lineValue = row.items.reduce(
    (s, i) => s + i.quantity * i.unitPrice,
    0,
  );

  return (
    <div className="border-t border-[var(--admin-border)] bg-[var(--admin-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--admin-text)]">
              {row.rmaNumber}
            </h3>
            <AdminBadge tone={statusTone(row.status)}>
              {statusLabel(row.status)}
            </AdminBadge>
            <AdminBadge tone={reasonTone(row.reasonType)}>
              {reasonLabel(row.reasonType)}
            </AdminBadge>
          </div>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {row.companyName} ({levelLabel(row.companyLevel)}) ·{" "}
            {row.orderNumber} · {formatDate(row.createdAt)}
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
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("rma.returnedLines")}
            </p>
            <ul className="divide-y divide-[var(--admin-border)]">
              {row.items.map((item) => (
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
                      {item.flavor || item.name}
                    </p>
                    <p className="text-xs text-[var(--admin-muted)]">
                      SKU {item.sku}
                      {item.optionsLabel ? ` · ${item.optionsLabel}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="tabular-nums text-[var(--admin-muted)]">
                      {t("rma.qty")} {item.quantity} × {money(item.unitPrice)}
                    </p>
                    <p className="font-medium tabular-nums">
                      {money(item.quantity * item.unitPrice)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-[var(--admin-border)] pt-3 text-right text-sm font-semibold">
              {t("rma.linesTotal")}: {money(lineValue)}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("rma.reasonDetail")}
            </p>
            <p className="text-sm text-[var(--admin-text)]">{row.reason}</p>
            {row.adminNote ? (
              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                {t("rma.adminNote")}: {row.adminNote}
              </p>
            ) : null}
            {row.replacementNote ? (
              <p className="mt-2 text-sm text-[var(--admin-brand-500)]">
                {t("rma.replacementNote")}: {row.replacementNote}
              </p>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              <MapPin className="h-3.5 w-3.5" />
              {t("rma.shipTo")}
            </p>
            {row.shipLines.length ? (
              row.shipLines.map((line) => (
                <p
                  key={line}
                  className="text-sm font-medium text-[var(--admin-text)]"
                >
                  {line}
                </p>
              ))
            ) : (
              <p className="text-sm text-[var(--admin-muted)]">—</p>
            )}
            <p className="mt-3 text-xs text-[var(--admin-muted)]">
              {t("rma.contact")}:{" "}
              {[row.contactName, row.contactEmail].filter(Boolean).join(" · ") ||
                "—"}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4 space-y-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("rma.workflow")}
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                ["APPROVED", "REJECTED", "RECEIVED", "CLOSED"] as RmaStatus[]
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={pending || row.status === status}
                  onClick={() =>
                    run(async () => {
                      await updateRmaStatus(row.id, status);
                      onClose();
                    })
                  }
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  {statusLabel(status)}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const amount = Number(fd.get("creditAmount"));
                if (!amount) return;
                run(async () => {
                  await updateRmaStatus(row.id, "CREDITED", amount);
                  onClose();
                });
              }}
              className="flex flex-wrap gap-2"
            >
              <input
                name="creditAmount"
                type="number"
                step="0.01"
                min={0.01}
                defaultValue={row.creditAmount || lineValue || ""}
                placeholder={t("rma.creditAmount")}
                className="admin-input w-28"
                required
              />
              <button
                type="submit"
                disabled={pending}
                className="admin-btn admin-btn-primary admin-btn-sm"
              >
                {t("rma.issueCredit")}
              </button>
            </form>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const note = String(fd.get("replacementNote") || "");
                run(async () => {
                  await markRmaReplacement(row.id, true, note);
                  onClose();
                });
              }}
              className="space-y-2 border-t border-[var(--admin-border)] pt-3"
            >
              <p className="text-xs font-medium text-[var(--admin-muted)]">
                {t("rma.reshipHint")}
              </p>
              <input
                name="replacementNote"
                defaultValue={row.replacementNote || ""}
                placeholder={t("rma.replacementNotePlaceholder")}
                className="admin-input w-full"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                >
                  {t("rma.markReship")}
                </button>
                {row.replacementNeeded ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(async () => {
                        await markRmaReplacement(row.id, false);
                        onClose();
                      })
                    }
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                  >
                    {t("rma.clearReship")}
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
