"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCoupon } from "@/lib/admin-actions";
import { AdminBadge, AdminCard, AdminStat } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { useAppFeedback } from "@/components/ui/AppFeedback";
import {
  BadgePercent,
  Pencil,
  Plus,
  Tag,
  TicketPercent,
  X,
} from "lucide-react";

export type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  active: boolean;
};

const emptyForm = {
  code: "",
  type: "percent",
  value: "10",
  minOrder: "0",
  active: true,
};

function formatValue(type: string, value: number) {
  if (type === "percent") return `${value}%`;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function CouponsPanel({ coupons }: { coupons: CouponRow[] }) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast, ui } = useAppFeedback();

  const activeCount = coupons.filter((c) => c.active).length;
  const percentCount = coupons.filter((c) => c.type === "percent").length;

  function field<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function startEdit(row: CouponRow) {
    setForm({
      code: row.code,
      type: row.type === "fixed" ? "fixed" : "percent",
      value: String(row.value),
      minOrder: String(row.minOrder),
      active: row.active,
    });
    setEditing(true);
    setError(null);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditing(false);
    setError(null);
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveCoupon({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          minOrder: Number(form.minOrder),
          active: form.active,
        });
        showToast(t("coupons.saved"), "success");
        resetForm();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("coupons.saveFailed"));
      }
    });
  }

  return (
    <div className="space-y-6">
      {ui}
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStat
          label={t("coupons.statTotal")}
          value={coupons.length.toLocaleString()}
          icon={Tag}
        />
        <AdminStat
          label={t("coupons.statActive")}
          value={activeCount.toLocaleString()}
          icon={TicketPercent}
          trendUp={activeCount > 0}
        />
        <AdminStat
          label={t("coupons.statPercent")}
          value={percentCount.toLocaleString()}
          icon={BadgePercent}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <AdminCard padded={false}>
          <div className="border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="admin-section-title mb-0">{t("coupons.listed")}</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {t("coupons.listedHint", { count: coupons.length })}
            </p>
          </div>

          {coupons.length === 0 ? (
            <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
              {t("coupons.empty")}
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("coupons.colCode")}</th>
                    <th>{t("coupons.colType")}</th>
                    <th>{t("coupons.colValue")}</th>
                    <th>{t("coupons.colMin")}</th>
                    <th>{t("coupons.colStatus")}</th>
                    <th className="text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="inline-flex items-center rounded-lg bg-[var(--admin-brand-50)] px-2.5 py-1 font-mono text-sm font-bold tracking-wide text-[var(--admin-brand-700)]">
                          {c.code}
                        </span>
                      </td>
                      <td className="text-sm text-[var(--admin-muted)]">
                        {c.type === "percent"
                          ? t("coupons.typePercent")
                          : t("coupons.typeFixed")}
                      </td>
                      <td className="text-sm font-semibold tabular-nums">
                        {formatValue(c.type, c.value)}
                      </td>
                      <td className="text-sm tabular-nums text-[var(--admin-muted)]">
                        ${c.minOrder.toFixed(0)}
                      </td>
                      <td>
                        <AdminBadge tone={c.active ? "success" : "neutral"}>
                          {c.active
                            ? t("coupons.statusOn")
                            : t("coupons.statusOff")}
                        </AdminBadge>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => startEdit(c)}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                          {t("common.edit")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
                {editing ? (
                  <Pencil className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <Plus className="h-5 w-5" strokeWidth={1.75} />
                )}
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--admin-text)]">
                  {editing ? t("coupons.edit") : t("coupons.add")}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                  {t("coupons.codeHint")}
                </p>
              </div>
            </div>
            {editing ? (
              <button
                type="button"
                onClick={resetForm}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
                {t("common.cancel")}
              </button>
            ) : null}
          </div>

          <form onSubmit={onSave} className="space-y-3.5">
            <label className="admin-label text-xs">
              {t("coupons.code")}
              <input
                required
                value={form.code}
                onChange={(e) => field("code", e.target.value.toUpperCase())}
                className="admin-input mt-1.5 w-full font-mono tracking-wide uppercase"
                placeholder="UMAXES10"
                autoComplete="off"
              />
            </label>
            <label className="admin-label text-xs">
              {t("coupons.type")}
              <select
                value={form.type}
                onChange={(e) => field("type", e.target.value)}
                className="admin-input mt-1.5 w-full"
              >
                <option value="percent">{t("coupons.typePercent")}</option>
                <option value="fixed">{t("coupons.typeFixed")}</option>
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="admin-label text-xs">
                {t("coupons.value")}
                <input
                  name="value"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={form.value}
                  onChange={(e) => field("value", e.target.value)}
                  className="admin-input mt-1.5 w-full"
                />
              </label>
              <label className="admin-label text-xs">
                {t("coupons.minOrder")}
                <input
                  name="minOrder"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.minOrder}
                  onChange={(e) => field("minOrder", e.target.value)}
                  className="admin-input mt-1.5 w-full"
                />
              </label>
            </div>
            <label className="flex items-center gap-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-3.5 py-3 text-sm text-[var(--admin-text)]">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => field("active", e.target.checked)}
                className="rounded border-[var(--admin-border)]"
              />
              {t("coupons.active")}
            </label>
            {error ? (
              <p className="rounded-xl border border-[var(--admin-error-500)]/30 bg-[var(--admin-error-50)] px-4 py-3 text-sm text-[var(--admin-error-700)]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="admin-btn admin-btn-primary w-full"
            >
              {t("coupons.save")}
            </button>
          </form>
        </AdminCard>
      </div>
    </div>
  );
}
