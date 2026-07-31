"use client";

import { Fragment, useState } from "react";
import {
  recordCreditPayment,
  updateCompanyCredit,
} from "@/lib/admin-actions";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";

export type CreditCompanyRow = {
  id: string;
  name: string;
  level: string;
  creditUsed: number;
  creditLimit: number;
  paymentTermsDays: number;
};

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function utilTone(pct: number): "success" | "warning" | "error" | "neutral" {
  if (pct >= 100) return "error";
  if (pct >= 80) return "warning";
  if (pct <= 0) return "neutral";
  return "success";
}

function barColor(pct: number) {
  if (pct >= 100) return "bg-[var(--admin-error-500)]";
  if (pct >= 80) return "bg-amber-500";
  return "bg-[var(--admin-brand-500)]";
}

export default function CreditCompaniesPanel({
  companies,
  isAdmin,
}: {
  companies: CreditCompanyRow[];
  isAdmin: boolean;
}) {
  const { t, locale } = useAdminI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  const dayUnit = locale === "zh" ? "天" : "d";
  const daysWord = locale === "zh" ? "天" : "days";

  function statusLabel(pct: number, limit: number) {
    if (limit <= 0) return t("credit.noCredit");
    if (pct >= 100) return t("credit.atLimit");
    if (pct >= 80) return t("credit.nearLimitStatus");
    if (pct <= 0) return t("credit.clear");
    return t("credit.ok");
  }

  if (companies.length === 0) {
    return (
      <AdminCard>
        <p className="text-sm text-[var(--admin-muted)]">{t("credit.noCompanies")}</p>
      </AdminCard>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t("credit.company")}</th>
            <th>{t("credit.level")}</th>
            <th>{t("common.status")}</th>
            <th>{t("credit.usedLimit")}</th>
            <th>{t("credit.available")}</th>
            <th>{t("credit.terms")}</th>
            <th>{t("credit.utilization")}</th>
            <th className="text-right">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => {
            const available = c.creditLimit - c.creditUsed;
            const pct =
              c.creditLimit > 0
                ? Math.min(100, Math.round((c.creditUsed / c.creditLimit) * 100))
                : c.creditUsed > 0
                  ? 100
                  : 0;
            const open = editingId === c.id;

            return (
              <Fragment key={c.id}>
                <tr className={open ? "bg-[var(--admin-brand-50)]/40" : undefined}>
                  <td className="font-semibold text-[var(--admin-gray-800)]">{c.name}</td>
                  <td><AdminBadge tone="brand">{c.level}</AdminBadge></td>
                  <td>
                    <AdminBadge tone={utilTone(pct)}>
                      {statusLabel(pct, c.creditLimit)}
                    </AdminBadge>
                  </td>
                  <td className="tabular-nums">
                    {money(c.creditUsed)}
                    <span className="text-[var(--admin-muted)]"> / </span>
                    {money(c.creditLimit)}
                  </td>
                  <td className="tabular-nums">{money(available)}</td>
                  <td>{c.paymentTermsDays}{dayUnit}</td>
                  <td className="min-w-[8rem]">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                        <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs tabular-nums text-[var(--admin-muted)]">{pct}%</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(open ? null : c.id)}
                      className={`admin-btn admin-btn-sm ${open ? "admin-btn-primary" : "admin-btn-secondary"}`}
                    >
                      {open ? t("common.close") : t("common.edit")}
                    </button>
                  </td>
                </tr>
                {open ? (
                  <tr className="bg-[var(--admin-brand-50)]/25">
                    <td colSpan={8} className="!p-0 !align-top">
                      <div className="border-t border-[var(--admin-border)] bg-[var(--admin-card)]">
                        <div className="border-b border-[var(--admin-border)] px-5 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-[var(--admin-text)]">{c.name}</h3>
                                <AdminBadge tone="brand">{c.level}</AdminBadge>
                                <AdminBadge tone={utilTone(pct)}>
                                  {statusLabel(pct, c.creditLimit)} · {pct}%
                                </AdminBadge>
                              </div>
                              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                                {t("credit.available")} ·{" "}
                                <span className="font-medium text-[var(--admin-text)]">{money(available)}</span>
                                {" · "}
                                {t("credit.terms")} ·{" "}
                                <span className="font-medium text-[var(--admin-text)]">
                                  {c.paymentTermsDays} {daysWord}
                                </span>
                              </p>
                            </div>
                            <button type="button" onClick={() => setEditingId(null)} className="admin-btn admin-btn-secondary admin-btn-sm">
                              {t("common.close")}
                            </button>
                          </div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                            <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className={`grid gap-4 px-5 py-4 ${isAdmin ? "lg:grid-cols-2" : "grid-cols-1"}`}>
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
                                  <input name="creditLimit" type="number" step="0.01" min={0} defaultValue={c.creditLimit} required className="admin-input mt-1.5 w-full" />
                                </label>
                                <label className="block text-xs font-medium text-[var(--admin-muted)]">
                                  {t("credit.termsDays")}
                                  <input name="paymentTermsDays" type="number" step="1" min={0} defaultValue={c.paymentTermsDays} required className="admin-input mt-1.5 w-full" />
                                </label>
                                <label className="col-span-2 block text-xs font-medium text-[var(--admin-muted)]">
                                  {t("common.note")}
                                  <input name="note" placeholder={t("credit.reason")} className="admin-input mt-1.5 w-full" />
                                </label>
                              </div>
                              <div className="mt-3 flex justify-end">
                                <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">{t("credit.saveTerms")}</button>
                              </div>
                            </form>
                          ) : null}
                          <form
                            action={async (fd) => {
                              await recordCreditPayment(c.id, Number(fd.get("amount")), String(fd.get("note") || ""));
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
                                <input name="amount" type="number" step="0.01" min={0.01} placeholder="0.00" required className="admin-input mt-1.5 w-full" />
                              </label>
                              <label className="sm:col-span-2 block text-xs font-medium text-[var(--admin-muted)]">
                                {t("common.note")}
                                <input name="note" placeholder={t("credit.paymentNote")} className="admin-input mt-1.5 w-full" />
                              </label>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">{t("credit.applyPayment")}</button>
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
