"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomerOnBehalf,
  addCompanyShipTo,
  removeCompanyShipTo,
  setCompanyShipToDefault,
} from "@/lib/admin-actions";
import type { CustomerLevel, UserStatus } from "@/generated/prisma/enums";
import { creditDefaultsByLevel } from "@/lib/customer-segments";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { Building2, MapPin, Plus, UserRound } from "lucide-react";

export type CustomerDirectoryRow = {
  id: string;
  name: string;
  level: CustomerLevel;
  status: UserStatus;
  taxId: string | null;
  creditEnabled: boolean;
  /** Present only for ADMIN / SUPER_ADMIN */
  creditLimit?: number;
  creditUsed?: number;
  paymentTermsDays?: number;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  addressCount: number;
  salesRepName: string | null;
  contacts: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    status: UserStatus;
    companyRole: string | null;
  }[];
  addresses: {
    id: string;
    label: string | null;
    line1: string;
    line2: string | null;
    city: string;
    region: string | null;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }[];
};

type FilterKey = "all" | "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function statusTone(status: string) {
  if (status === "APPROVED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "error" as const;
}

export default function CustomersDirectory({
  level,
  rows,
  canSeeCreditAmounts = false,
}: {
  level: CustomerLevel;
  rows: CustomerDirectoryRow[];
  /** ADMIN / SUPER_ADMIN only — never buyers or sales UI */
  canSeeCreditAmounts?: boolean;
}) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  const defaults = creditDefaultsByLevel[level];
  const isRetail = level === "SHOP";

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

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

  const filters: { key: FilterKey; labelKey: string }[] = [
    { key: "all", labelKey: "customers.filterAll" },
    { key: "APPROVED", labelKey: "customers.filterApproved" },
    { key: "PENDING", labelKey: "customers.filterPending" },
    { key: "REJECTED", labelKey: "customers.filterRejected" },
  ];

  function submitRegister(fd: FormData) {
    setFormError(null);
    setFormOk(null);
    const addressLine1 = String(fd.get("line1") || "").trim();
    const address =
      addressLine1
        ? {
            line1: addressLine1,
            line2: String(fd.get("line2") || "").trim() || undefined,
            city: String(fd.get("city") || "").trim(),
            region: String(fd.get("region") || "").trim() || undefined,
            postalCode: String(fd.get("postalCode") || "").trim(),
            country: String(fd.get("country") || "").trim(),
            label: String(fd.get("addressLabel") || "").trim() || undefined,
          }
        : undefined;

    startTransition(async () => {
      try {
        await createCustomerOnBehalf({
          level,
          companyName: String(fd.get("companyName") || ""),
          taxId: String(fd.get("taxId") || ""),
          contactName: String(fd.get("contactName") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          password: String(fd.get("password") || ""),
          creditLimit: Number(fd.get("creditLimit") || defaults.creditLimit),
          paymentTermsDays: Number(
            fd.get("paymentTermsDays") || defaults.paymentTermsDays,
          ),
          status: (String(fd.get("status") || "APPROVED") as
            | "APPROVED"
            | "PENDING"),
          address:
            address &&
            address.city &&
            address.postalCode &&
            address.country
              ? address
              : undefined,
        });
        setFormOk(t("customers.registerSuccess"));
        router.refresh();
      } catch (e) {
        setFormError(
          e instanceof Error ? e.message : t("customers.registerError"),
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const count =
            f.key === "all"
              ? rows.length
              : rows.filter((r) => r.status === f.key).length;
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
          <h2 className="admin-section-title mb-0">{t("customers.directory")}</h2>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t("customers.directoryHint", {
              count: filtered.length,
              total: rows.length,
            })}
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
            {rows.length === 0 ? t("customers.empty") : t("customers.emptyFilter")}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("customers.company")}</th>
                  <th>{t("customers.contacts")}</th>
                  {!isRetail ? <th>{t("customers.credit")}</th> : null}
                  <th>{t("customers.orders")}</th>
                  <th>{t("common.status")}</th>
                  <th className="text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const open = openId === row.id;
                  const primary = row.contacts[0];
                  return (
                    <Fragment key={row.id}>
                      <tr
                        className={
                          open ? "bg-[var(--admin-brand-50)]/40" : undefined
                        }
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
                              <Building2 className="h-4 w-4" strokeWidth={1.75} />
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--admin-text)]">
                                {row.name}
                              </p>
                              <p className="text-xs text-[var(--admin-muted)]">
                                {row.taxId
                                  ? `${t("customers.taxId")}: ${row.taxId}`
                                  : formatDate(row.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-sm">
                          <p className="font-medium">
                            {primary?.name || "—"}
                          </p>
                          <p className="text-xs text-[var(--admin-muted)]">
                            {[primary?.email, primary?.phone]
                              .filter(Boolean)
                              .join(" · ") || t("customers.noContact")}
                          </p>
                        </td>
                        {!isRetail ? (
                          <td className="text-sm tabular-nums">
                            {canSeeCreditAmounts ? (
                              <>
                                {money(row.creditUsed ?? 0)} /{" "}
                                {money(row.creditLimit ?? 0)}
                                <span className="block text-xs text-[var(--admin-muted)]">
                                  {(row.paymentTermsDays ?? 0)}d
                                </span>
                              </>
                            ) : row.creditEnabled ? (
                              "Credit on"
                            ) : (
                              "Credit off"
                            )}
                          </td>
                        ) : null}
                        <td className="tabular-nums">{row.orderCount}</td>
                        <td>
                          <AdminBadge tone={statusTone(row.status)}>
                            {t(`customers.status${row.status}`) || row.status}
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
                          <td
                            colSpan={isRetail ? 5 : 6}
                            className="!p-0 !align-top"
                          >
                            <CustomerExpand
                              row={row}
                              isRetail={isRetail}
                              canSeeCreditAmounts={canSeeCreditAmounts}
                              formatDate={formatDate}
                              onClose={() => setOpenId(null)}
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

      <AdminCard>
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
            <UserRound className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--admin-text)]">
              {t("customers.registerTitle")}
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {t("customers.registerHint")}
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitRegister(new FormData(e.currentTarget));
            e.currentTarget.reset();
          }}
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.company")}
              <input
                name="companyName"
                required
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.taxId")}
              <input name="taxId" className="admin-input mt-1.5 w-full" />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.accountStatus")}
              <select
                name="status"
                defaultValue="APPROVED"
                className="admin-input mt-1.5 w-full"
              >
                <option value="APPROVED">{t("customers.statusAPPROVED")}</option>
                <option value="PENDING">{t("customers.statusPENDING")}</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.contactName")}
              <input
                name="contactName"
                required
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.email")}
              <input
                name="email"
                type="email"
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.phone")}
              <input name="phone" className="admin-input mt-1.5 w-full" />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.tempPassword")}
              <input
                name="password"
                type="text"
                required
                minLength={6}
                className="admin-input mt-1.5 w-full"
                placeholder={t("customers.tempPasswordHint")}
              />
            </label>
            {!isRetail && canSeeCreditAmounts ? (
              <>
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("customers.creditLimit")}
                  <input
                    name="creditLimit"
                    type="number"
                    min={0}
                    step={100}
                    defaultValue={defaults.creditLimit}
                    className="admin-input mt-1.5 w-full"
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("customers.terms")}
                  <input
                    name="paymentTermsDays"
                    type="number"
                    min={0}
                    defaultValue={defaults.paymentTermsDays}
                    className="admin-input mt-1.5 w-full"
                  />
                </label>
              </>
            ) : null}
          </div>

          <div className="rounded-xl border border-[var(--admin-border)] p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
              <MapPin className="h-3.5 w-3.5" />
              {t("customers.shipAddress")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-xs font-medium text-[var(--admin-muted)] sm:col-span-2">
                {t("customers.line1")}
                <input name="line1" className="admin-input mt-1.5 w-full" />
              </label>
              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                {t("customers.line2")}
                <input name="line2" className="admin-input mt-1.5 w-full" />
              </label>
              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                {t("customers.city")}
                <input name="city" className="admin-input mt-1.5 w-full" />
              </label>
              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                {t("customers.region")}
                <input name="region" className="admin-input mt-1.5 w-full" />
              </label>
              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                {t("customers.postalCode")}
                <input name="postalCode" className="admin-input mt-1.5 w-full" />
              </label>
              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                {t("customers.country")}
                <input
                  name="country"
                  defaultValue="US"
                  className="admin-input mt-1.5 w-full"
                />
              </label>
            </div>
          </div>

          {formError ? (
            <p className="text-sm text-[var(--admin-error-500)]">{formError}</p>
          ) : null}
          {formOk ? (
            <p className="text-sm text-[var(--admin-success-500,#16a34a)]">
              {formOk}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="admin-btn admin-btn-primary"
            >
              {t("customers.registerSubmit")}
            </button>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}

function CustomerExpand({
  row,
  isRetail,
  canSeeCreditAmounts,
  formatDate,
  onClose,
}: {
  row: CustomerDirectoryRow;
  isRetail: boolean;
  canSeeCreditAmounts: boolean;
  formatDate: (iso: string) => string;
  onClose: () => void;
}) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);
  const atLimit = row.addresses.length >= 10;

  function refresh() {
    router.refresh();
  }

  function addShipTo(fd: FormData) {
    setAddrError(null);
    startTransition(async () => {
      try {
        await addCompanyShipTo({
          companyId: row.id,
          label: String(fd.get("label") || ""),
          line1: String(fd.get("line1") || ""),
          line2: String(fd.get("line2") || ""),
          city: String(fd.get("city") || ""),
          region: String(fd.get("region") || ""),
          postalCode: String(fd.get("postalCode") || ""),
          country: String(fd.get("country") || "US"),
          isDefault: fd.get("isDefault") === "on",
        });
        setShowAdd(false);
        refresh();
      } catch (e) {
        setAddrError(
          e instanceof Error ? e.message : t("customers.addressError"),
        );
      }
    });
  }

  return (
    <div className="border-t border-[var(--admin-border)] bg-[var(--admin-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--admin-text)]">
            {row.name}
          </h3>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t(`customers.level${row.level}`)} · {formatDate(row.createdAt)}
            {row.salesRepName
              ? ` · ${t("customers.salesRep")}: ${row.salesRepName}`
              : ""}
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

      <div className="grid gap-4 px-5 py-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
            {t("customers.accountInfo")}
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--admin-muted)]">{t("customers.taxId")}</dt>
              <dd className="font-medium">{row.taxId || "—"}</dd>
            </div>
            {!isRetail ? (
              <>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--admin-muted)]">
                    {t("customers.credit")}
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {canSeeCreditAmounts
                      ? `${money(row.creditUsed ?? 0)} / ${money(row.creditLimit ?? 0)}`
                      : row.creditEnabled
                        ? "On"
                        : "Off"}
                  </dd>
                </div>
                {canSeeCreditAmounts ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--admin-muted)]">
                      {t("customers.terms")}
                    </dt>
                    <dd className="font-medium">
                      {row.paymentTermsDays ?? 0}d
                    </dd>
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--admin-muted)]">{t("customers.orders")}</dt>
              <dd className="font-medium">{row.orderCount}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
            {t("customers.contacts")}
          </p>
          {row.contacts.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">
              {t("customers.noContact")}
            </p>
          ) : (
            <ul className="space-y-3">
              {row.contacts.map((c) => (
                <li key={c.id} className="text-sm">
                  <p className="font-medium text-[var(--admin-text)]">
                    {c.name || "—"}
                    {c.companyRole ? (
                      <span className="ml-2 text-xs text-[var(--admin-muted)]">
                        {c.companyRole}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[var(--admin-muted)]">
                    {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("customers.addresses")}{" "}
              <span className="font-normal normal-case tracking-normal">
                ({row.addresses.length}/10)
              </span>
            </p>
            <button
              type="button"
              disabled={atLimit || pending}
              onClick={() => {
                setAddrError(null);
                setShowAdd((v) => !v);
              }}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              {showAdd ? t("common.close") : t("customers.addShipTo")}
            </button>
          </div>

          {row.addresses.length === 0 && !showAdd ? (
            <p className="text-sm text-[var(--admin-muted)]">
              {t("customers.noAddress")}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {row.addresses.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {a.label || t("customers.address")}
                        {a.isDefault ? (
                          <span className="ml-2 text-[10px] font-bold tracking-wide text-[var(--admin-brand-500)] uppercase">
                            {t("customers.default")}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-[var(--admin-muted)]">
                        {[a.line1, a.line2].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-[var(--admin-muted)]">
                        {[a.city, a.region, a.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-[var(--admin-muted)]">{a.country}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {!a.isDefault ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await setCompanyShipToDefault(row.id, a.id);
                              refresh();
                            })
                          }
                          className="admin-btn admin-btn-secondary admin-btn-sm !px-2 !text-xs"
                        >
                          {t("customers.setDefault")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await removeCompanyShipTo(row.id, a.id);
                            refresh();
                          })
                        }
                        className="admin-btn admin-btn-secondary admin-btn-sm !px-2 !text-xs"
                      >
                        {t("common.remove")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showAdd ? (
            <form
              className="mt-4 space-y-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-card)] p-4"
              onSubmit={(e) => {
                e.preventDefault();
                addShipTo(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <p className="text-sm font-medium text-[var(--admin-text)]">
                {t("customers.addShipToTitle")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("customers.addressLabel")}
                  <input
                    name="label"
                    placeholder={t("customers.addressLabelHint")}
                    className="admin-input mt-1.5 w-full"
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--admin-muted)] sm:col-span-2">
                  {t("customers.line1")}
                  <input
                    name="line1"
                    required
                    className="admin-input mt-1.5 w-full"
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("customers.line2")}
                  <input name="line2" className="admin-input mt-1.5 w-full" />
                </label>
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("customers.city")}
                  <input
                    name="city"
                    required
                    className="admin-input mt-1.5 w-full"
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("customers.region")}
                  <input name="region" className="admin-input mt-1.5 w-full" />
                </label>
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("customers.postalCode")}
                  <input
                    name="postalCode"
                    required
                    className="admin-input mt-1.5 w-full"
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("customers.country")}
                  <input
                    name="country"
                    required
                    defaultValue="US"
                    className="admin-input mt-1.5 w-full"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
                <input
                  type="checkbox"
                  name="isDefault"
                  className="rounded border-[var(--admin-border)]"
                />
                {t("customers.makeDefault")}
              </label>
              {addrError ? (
                <p className="text-sm text-[var(--admin-error-500)]">
                  {addrError}
                </p>
              ) : null}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={pending}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                >
                  {t("customers.saveShipTo")}
                </button>
              </div>
            </form>
          ) : null}

          {atLimit ? (
            <p className="mt-3 text-xs text-[var(--admin-muted)]">
              {t("customers.addressLimit")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
