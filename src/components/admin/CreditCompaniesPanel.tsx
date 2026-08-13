"use client";

import { Fragment, useState } from "react";
import {
  recordCreditPayment,
  updateCompanyCredit,
} from "@/lib/admin-actions";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";

export type CreditStatus = "none" | "clear" | "ok" | "near" | "at";

export type CreditCompanyRow = {
  id: string;
  name: string;
  level: string;
  creditEnabled: boolean;
  status: CreditStatus;
  /** ADMIN / SUPER_ADMIN only */
  creditUsed?: number;
  creditLimit?: number;
  paymentTermsDays?: number;
};

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function statusTone(
  status: CreditStatus,
): "success" | "warning" | "error" | "neutral" {
  if (status === "at") return "error";
  if (status === "near") return "warning";
  if (status === "none" || status === "clear") return "neutral";
  return "success";
}

export default function CreditCompaniesPanel({
  companies,
  isAdmin,
}: {
  companies: CreditCompanyRow[];
  isAdmin: boolean;
}) {
  const { t } = useAdminI18n();
  const [editingId, setEditingId] = useState<string | null>(null);

  function statusLabel(status: CreditStatus) {
    if (status === "none") return t("credit.noCredit");
    if (status === "at") return t("credit.atLimit");
    if (status === "near") return t("credit.nearLimitStatus");
    if (status === "clear") return t("credit.clear");
    return t("credit.ok");
  }

  if (companies.length === 0) {
    return (
      <AdminCard>
        <p className="text-sm text-[var(--admin-muted)]">
          {t("credit.noCompanies")}
        </p>
      </AdminCard>
    );
  }

  const colSpan = isAdmin ? 5 : 4;

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t("credit.company")}</th>
            <th>{t("credit.level")}</th>
            {isAdmin ? <th>{t("credit.usedLimit")}</th> : null}
            <th>{t("common.status")}</th>
            <th className="text-right">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => {
            const open = editingId === c.id;

            return (
              <Fragment key={c.id}>
                <tr
                  className={
                    open ? "bg-[var(--admin-brand-50)]/40" : undefined
                  }
                >
                  <td className="font-semibold text-[var(--admin-gray-800)]">
                    {c.name}
                  </td>
                  <td>
                    <AdminBadge tone="brand">{c.level}</AdminBadge>
                  </td>
                  {isAdmin ? (
                    <td className="tabular-nums">
                      {money(c.creditUsed ?? 0)} / {money(c.creditLimit ?? 0)}
                      <span className="block text-xs text-[var(--admin-muted)]">
                        {(c.paymentTermsDays ?? 0)}d
                      </span>
                    </td>
                  ) : null}
                  <td>
                    <AdminBadge tone={statusTone(c.status)}>
                      {statusLabel(c.status)}
                    </AdminBadge>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(open ? null : c.id)}
                      className={`admin-btn admin-btn-sm ${
                        open ? "admin-btn-primary" : "admin-btn-secondary"
                      }`}
                    >
                      {open ? t("common.close") : t("common.edit")}
                    </button>
                  </td>
                </tr>
                {open ? (
                  <tr className="bg-[var(--admin-brand-50)]/25">
                    <td colSpan={colSpan} className="!p-0 !align-top">
                      <div className="border-t border-[var(--admin-border)] bg-[var(--admin-card)]">
                        <div className="border-b border-[var(--admin-border)] px-5 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-[var(--admin-text)]">
                                  {c.name}
                                </h3>
                                <AdminBadge tone="brand">{c.level}</AdminBadge>
                                <AdminBadge tone={statusTone(c.status)}>
                                  {statusLabel(c.status)}
                                </AdminBadge>
                              </div>
                              {isAdmin ? (
                                <p className="mt-1 text-sm tabular-nums text-[var(--admin-muted)]">
                                  {money(c.creditUsed ?? 0)} used of{" "}
                                  {money(c.creditLimit ?? 0)} ·{" "}
                                  {(c.paymentTermsDays ?? 0)}d terms
                                </p>
                              ) : (
                                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                                  Credit amounts are visible to Admin / Super
                                  Admin only.
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                            >
                              {t("common.close")}
                            </button>
                          </div>
                        </div>
                        <div
                          className={`grid gap-4 px-5 py-4 ${
                            isAdmin ? "lg:grid-cols-2" : "grid-cols-1"
                          }`}
                        >
                          {isAdmin ? (
                            <form
                              action={async (fd) => {
                                await updateCompanyCredit(
                                  c.id,
                                  Number(fd.get("creditLimit")),
                                  Number(fd.get("paymentTermsDays")),
                                  String(fd.get("note") || ""),
                                );
                                setEditingId(null);
                              }}
                              className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4"
                            >
                              <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
                                {t("credit.editCredit")}
                              </p>
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                                  {t("credit.limitUsd")}
                                  <input
                                    name="creditLimit"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    defaultValue={c.creditLimit ?? 0}
                                    required
                                    className="admin-input mt-1.5 w-full"
                                  />
                                </label>
                                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                                  {t("credit.termsDays")}
                                  <input
                                    name="paymentTermsDays"
                                    type="number"
                                    step="1"
                                    min={0}
                                    defaultValue={c.paymentTermsDays ?? 0}
                                    required
                                    className="admin-input mt-1.5 w-full"
                                  />
                                </label>
                                <label className="col-span-2 block text-xs font-medium text-[var(--admin-muted)]">
                                  {t("common.note")}
                                  <input
                                    name="note"
                                    placeholder={t("credit.reason")}
                                    className="admin-input mt-1.5 w-full"
                                  />
                                </label>
                              </div>
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="submit"
                                  className="admin-btn admin-btn-secondary admin-btn-sm"
                                >
                                  {t("credit.saveTerms")}
                                </button>
                              </div>
                            </form>
                          ) : null}
                          <form
                            action={async (fd) => {
                              await recordCreditPayment(
                                c.id,
                                Number(fd.get("amount")),
                                String(fd.get("note") || ""),
                              );
                              setEditingId(null);
                            }}
                            className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4"
                          >
                            <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
                              {t("credit.recordPayment")}
                            </p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                                {t("common.amount")} ($)
                                <input
                                  name="amount"
                                  type="number"
                                  step="0.01"
                                  min={0.01}
                                  placeholder="0.00"
                                  required
                                  className="admin-input mt-1.5 w-full"
                                />
                              </label>
                              <label className="sm:col-span-2 block text-xs font-medium text-[var(--admin-muted)]">
                                {t("common.note")}
                                <input
                                  name="note"
                                  placeholder={t("credit.paymentNote")}
                                  className="admin-input mt-1.5 w-full"
                                />
                              </label>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                type="submit"
                                className="admin-btn admin-btn-primary admin-btn-sm"
                              >
                                {t("credit.applyPayment")}
                              </button>
                            </div>
                          </form>
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
  );
}
