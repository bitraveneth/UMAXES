"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCompanyShipTo, removeCompanyShipTo, setCompanyShipToDefault, updateCompanyDirectoryProfile, updateCompanyShipTo } from "@/lib/admin-actions";
import type { CustomerLevel, UserStatus } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { Building2, Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAppFeedback } from "@/components/ui/AppFeedback";

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
    recipientName: string | null;
    phone: string | null;
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
  canRegister = false,
}: {
  level: CustomerLevel;
  rows: CustomerDirectoryRow[];
  /** ADMIN / SUPER_ADMIN only — never buyers or sales UI */
  canSeeCreditAmounts?: boolean;
  /** ADMIN / SUPER_ADMIN — link to the single Add user page */
  canRegister?: boolean;
}) {
  const { t, locale } = useAdminI18n();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openId, setOpenId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {canRegister ? (
        <div className="flex justify-end">
          <Link
            href={`/admin/users/new?level=${level}`}
            className="admin-btn admin-btn-secondary admin-btn-sm"
          >
            <UserPlus className="h-4 w-4" strokeWidth={1.75} />
            {t("users.addUser")}
          </Link>
        </div>
      ) : null}

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
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrError, setAddrError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { confirm, showToast, ui } = useAppFeedback();
  const atLimit = row.addresses.length >= 10;
  const primary =
    row.contacts.find((c) => c.companyRole === "OWNER") || row.contacts[0] || null;

  function refresh() {
    router.refresh();
  }

  function saveProfile(fd: FormData) {
    setProfileError(null);
    startTransition(async () => {
      try {
        await updateCompanyDirectoryProfile({
          companyId: row.id,
          name: String(fd.get("companyName") || ""),
          taxId: String(fd.get("taxId") || ""),
          status: String(fd.get("status") || row.status),
          creditLimit: canSeeCreditAmounts && !isRetail
            ? Number(fd.get("creditLimit") || 0)
            : undefined,
          paymentTermsDays: canSeeCreditAmounts && !isRetail
            ? Number(fd.get("paymentTermsDays") || 0)
            : undefined,
          contactId: primary?.id,
          contactName: String(fd.get("contactName") || ""),
          contactEmail: String(fd.get("contactEmail") || ""),
          contactPhone: String(fd.get("contactPhone") || ""),
        });
        showToast(t("customers.profileSaved"), "success");
        refresh();
      } catch (e) {
        setProfileError(
          e instanceof Error ? e.message : t("customers.profileError"),
        );
      }
    });
  }

  function addShipTo(fd: FormData) {
    setAddrError(null);
    startTransition(async () => {
      try {
        await addCompanyShipTo({
          companyId: row.id,
          label: String(fd.get("label") || ""),
          recipientName: String(fd.get("recipientName") || ""),
          phone: String(fd.get("phone") || ""),
          line1: String(fd.get("line1") || ""),
          line2: String(fd.get("line2") || ""),
          city: String(fd.get("city") || ""),
          region: String(fd.get("region") || ""),
          postalCode: String(fd.get("postalCode") || ""),
          country: String(fd.get("country") || "US"),
          isDefault: fd.get("isDefault") === "on",
        });
        setShowAdd(false);
        showToast("Address saved successfully", "success");
        refresh();
      } catch (e) {
        setAddrError(
          e instanceof Error ? e.message : t("customers.addressError"),
        );
      }
    });
  }

  function saveShipTo(addressId: string, fd: FormData) {
    setAddrError(null);
    startTransition(async () => {
      try {
        await updateCompanyShipTo({
          companyId: row.id,
          addressId,
          label: String(fd.get("label") || ""),
          recipientName: String(fd.get("recipientName") || ""),
          phone: String(fd.get("phone") || ""),
          line1: String(fd.get("line1") || ""),
          line2: String(fd.get("line2") || ""),
          city: String(fd.get("city") || ""),
          region: String(fd.get("region") || ""),
          postalCode: String(fd.get("postalCode") || ""),
          country: String(fd.get("country") || "US"),
          isDefault: fd.get("isDefault") === "on",
        });
        setEditingAddressId(null);
        showToast(t("customers.profileSaved"), "success");
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
      {ui}
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

      <div className="grid gap-4 px-5 py-4">
        <form
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile(new FormData(e.currentTarget));
          }}
        >
          <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
            {t("customers.accountInfo")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-xs font-medium text-[var(--admin-muted)] sm:col-span-2 lg:col-span-1">
              {t("customers.companyName")}
              <input
                name="companyName"
                required
                defaultValue={row.name}
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.taxId")}
              <input
                name="taxId"
                defaultValue={row.taxId || ""}
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.accountStatus")}
              <select
                name="status"
                defaultValue={row.status}
                className="admin-input mt-1.5 w-full"
              >
                <option value="APPROVED">{t("customers.statusAPPROVED")}</option>
                <option value="PENDING">{t("customers.statusPENDING")}</option>
                <option value="REJECTED">{t("customers.statusREJECTED")}</option>
                <option value="DISABLED">{t("customers.statusDISABLED")}</option>
              </select>
            </label>
            {!isRetail && canSeeCreditAmounts ? (
              <>
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("customers.creditLimit")}
                  <input
                    name="creditLimit"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={row.creditLimit ?? 0}
                    className="admin-input mt-1.5 w-full"
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                  {t("customers.terms")}
                  <input
                    name="paymentTermsDays"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={row.paymentTermsDays ?? 0}
                    className="admin-input mt-1.5 w-full"
                  />
                </label>
              </>
            ) : null}
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.contactName")}
              <input
                name="contactName"
                defaultValue={primary?.name || ""}
                className="admin-input mt-1.5 w-full"
                disabled={!primary}
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.email")}
              <input
                name="contactEmail"
                type="email"
                defaultValue={primary?.email || ""}
                className="admin-input mt-1.5 w-full"
                disabled={!primary}
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.phoneNumber")}
              <input
                name="contactPhone"
                type="tel"
                defaultValue={primary?.phone || ""}
                className="admin-input mt-1.5 w-full"
                disabled={!primary}
              />
            </label>
          </div>
          {!primary ? (
            <p className="mt-3 text-sm text-[var(--admin-muted)]">
              {t("customers.noContact")}
            </p>
          ) : null}
          {profileError ? (
            <p className="mt-3 text-sm text-[var(--admin-error-500)]">
              {profileError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--admin-muted)]">
              {t("customers.orders")}: {row.orderCount}
            </p>
            <button
              type="submit"
              disabled={pending}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              {t("customers.saveProfile")}
            </button>
          </div>
        </form>

        {row.contacts.length > 1 ? (
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("customers.contacts")}
            </p>
            <ul className="space-y-2 text-sm">
              {row.contacts.map((c) => (
                <li key={c.id} className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-[var(--admin-text)]">
                    {c.name || "—"}
                    {c.companyRole ? (
                      <span className="ml-2 text-xs text-[var(--admin-muted)]">
                        {c.companyRole}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[var(--admin-muted)]">
                    {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
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
                setEditingAddressId(null);
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
                  {editingAddressId === a.id ? (
                    <ShipToFields
                      defaults={a}
                      pending={pending}
                      error={addrError}
                      submitLabel={t("customers.saveAddress")}
                      onCancel={() => setEditingAddressId(null)}
                      onSubmit={(fd) => saveShipTo(a.id, fd)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {a.recipientName || a.label || t("customers.address")}
                          {a.isDefault ? (
                            <span className="ml-2 text-[10px] font-bold tracking-wide text-[var(--admin-brand-500)] uppercase">
                              {t("customers.default")}
                            </span>
                          ) : null}
                        </p>
                        {a.phone ? (
                          <p className="mt-1 text-[var(--admin-muted)]">{a.phone}</p>
                        ) : null}
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
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            setAddrError(null);
                            setShowAdd(false);
                            setEditingAddressId(a.id);
                          }}
                          className="admin-btn admin-btn-secondary admin-btn-sm !px-2 !text-xs"
                        >
                          {t("customers.editAddress")}
                        </button>
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
                          onClick={async () => {
                            const ok = await confirm({
                              title: t("common.remove"),
                              message: "Delete this shipping address?",
                              confirmLabel: t("common.remove"),
                              tone: "danger",
                            });
                            if (!ok) return;
                            startTransition(async () => {
                              await removeCompanyShipTo(row.id, a.id);
                              showToast("Address deleted", "danger");
                              refresh();
                            });
                          }}
                          className="admin-btn admin-btn-secondary admin-btn-sm !px-2 !text-xs"
                        >
                          {t("common.remove")}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {showAdd ? (
            <div className="mt-4">
              <ShipToFields
                pending={pending}
                error={addrError}
                title={t("customers.addShipToTitle")}
                submitLabel={t("customers.saveShipTo")}
                onCancel={() => setShowAdd(false)}
                onSubmit={addShipTo}
              />
            </div>
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

function ShipToFields({
  defaults,
  pending,
  error,
  title,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  defaults?: CustomerDirectoryRow["addresses"][number];
  pending: boolean;
  error: string | null;
  title?: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (fd: FormData) => void;
}) {
  const { t } = useAdminI18n();
  return (
    <form
      className="space-y-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-card)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
    >
      {title ? (
        <p className="text-sm font-medium text-[var(--admin-text)]">{title}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-xs font-medium text-[var(--admin-muted)]">
          {t("customers.addressLabel")}
          <input
            name="label"
            defaultValue={defaults?.label || ""}
            placeholder={t("customers.addressLabelHint")}
            className="admin-input mt-1.5 w-full"
          />
        </label>
        <label className="block text-xs font-medium text-[var(--admin-muted)]">
          {t("customers.fullName")}
          <input
            name="recipientName"
            required
            defaultValue={defaults?.recipientName || ""}
            autoComplete="shipping name"
            className="admin-input mt-1.5 w-full"
          />
        </label>
        <label className="block text-xs font-medium text-[var(--admin-muted)]">
          {t("customers.phoneNumber")}
          <input
            name="phone"
            required
            type="tel"
            defaultValue={defaults?.phone || ""}
            autoComplete="shipping tel"
            className="admin-input mt-1.5 w-full"
          />
        </label>
        <label className="block text-xs font-medium text-[var(--admin-muted)] sm:col-span-2">
          {t("customers.line1")}
          <input
            name="line1"
            required
            defaultValue={defaults?.line1 || ""}
            className="admin-input mt-1.5 w-full"
          />
        </label>
        <label className="block text-xs font-medium text-[var(--admin-muted)]">
          {t("customers.line2")}
          <input
            name="line2"
            defaultValue={defaults?.line2 || ""}
            className="admin-input mt-1.5 w-full"
          />
        </label>
        <label className="block text-xs font-medium text-[var(--admin-muted)]">
          {t("customers.city")}
          <input
            name="city"
            required
            defaultValue={defaults?.city || ""}
            className="admin-input mt-1.5 w-full"
          />
        </label>
        <label className="block text-xs font-medium text-[var(--admin-muted)]">
          {t("customers.region")}
          <input
            name="region"
            defaultValue={defaults?.region || ""}
            className="admin-input mt-1.5 w-full"
          />
        </label>
        <label className="block text-xs font-medium text-[var(--admin-muted)]">
          {t("customers.postalCode")}
          <input
            name="postalCode"
            required
            defaultValue={defaults?.postalCode || ""}
            className="admin-input mt-1.5 w-full"
          />
        </label>
        <label className="block text-xs font-medium text-[var(--admin-muted)]">
          {t("customers.country")}
          <input
            name="country"
            required
            defaultValue={defaults?.country || "US"}
            className="admin-input mt-1.5 w-full"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={defaults?.isDefault}
          className="rounded border-[var(--admin-border)]"
        />
        {t("customers.makeDefault")}
      </label>
      {error ? (
        <p className="text-sm text-[var(--admin-error-500)]">{error}</p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="admin-btn admin-btn-secondary admin-btn-sm"
        >
          {t("common.close")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
