"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  activateBankAccount,
  deleteBankAccount,
  saveBankAccount,
} from "@/lib/admin-actions";
import { AdminBadge, AdminCard, AdminStat } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { Landmark, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useAppFeedback } from "@/components/ui/AppFeedback";

export type BankAccountRow = {
  id: string;
  label: string;
  companyName: string;
  accountNumber: string;
  bankName: string;
  bankAddress: string;
  swiftCode: string;
  currency: string;
  notes: string | null;
  isActive: boolean;
};

const emptyForm = {
  id: "",
  label: "",
  companyName: "UMAXES LIMITED",
  accountNumber: "",
  bankName: "",
  bankAddress: "",
  swiftCode: "",
  currency: "USD",
  notes: "",
  isActive: false,
};

export function BankAccountsPanel({ accounts }: { accounts: BankAccountRow[] }) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { confirm, showToast, ui } = useAppFeedback();
  const editing = Boolean(form.id);
  const active = accounts.find((a) => a.isActive);

  function field<K extends keyof typeof emptyForm>(key: K, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setMessage(null);
  }

  function startEdit(row: BankAccountRow) {
    setForm({
      id: row.id,
      label: row.label,
      companyName: row.companyName,
      accountNumber: row.accountNumber,
      bankName: row.bankName,
      bankAddress: row.bankAddress,
      swiftCode: row.swiftCode,
      currency: row.currency,
      notes: row.notes || "",
      isActive: row.isActive,
    });
    setError(null);
    setMessage(null);
  }

  function resetForm() {
    setForm(emptyForm);
    setError(null);
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveBankAccount({
          id: form.id || undefined,
          label: form.label,
          companyName: form.companyName,
          accountNumber: form.accountNumber,
          bankName: form.bankName,
          bankAddress: form.bankAddress,
          swiftCode: form.swiftCode,
          currency: form.currency,
          notes: form.notes,
          isActive: form.isActive,
        });
        setMessage(t("payments.saved"));
        showToast(t("payments.saved"), "success");
        resetForm();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("payments.saveFailed"));
      }
    });
  }

  function onActivate(id: string) {
    startTransition(async () => {
      try {
        await activateBankAccount(id);
        setMessage(t("payments.activated"));
        showToast(t("payments.activated"), "success");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("payments.saveFailed"));
      }
    });
  }

  async function onDelete(row: BankAccountRow) {
    const ok = await confirm({
      title: t("common.remove"),
      message: t("payments.deleteConfirm", { label: row.label }),
      confirmLabel: t("common.remove"),
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteBankAccount(row.id);
        if (form.id === row.id) resetForm();
        setMessage(t("payments.deleted"));
        showToast(t("payments.deleted"), "danger");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("payments.saveFailed"));
      }
    });
  }

  return (
    <div className="space-y-6">
      {ui}
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStat
          label={t("payments.statAccounts")}
          value={accounts.length.toLocaleString()}
          icon={Landmark}
        />
        <AdminStat
          label={t("payments.statActive")}
          value={accounts.filter((a) => a.isActive).length.toLocaleString()}
          icon={Star}
          trendUp={Boolean(active)}
        />
        <AdminStat
          label={t("payments.statBank")}
          value={active?.currency || "USD"}
          icon={Landmark}
        />
      </div>

      {active ? (
        <AdminCard>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
                <Star className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
                  {t("payments.onInvoice")}
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--admin-text)]">
                  {active.label}
                </p>
                <p className="mt-1 text-sm text-[var(--admin-text)]">
                  {active.companyName} · {active.accountNumber}
                </p>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  {active.bankName}
                  {active.swiftCode ? ` · SWIFT ${active.swiftCode}` : ""}
                  {` · ${active.currency}`}
                </p>
              </div>
            </div>
            <AdminBadge tone="success">{t("payments.onInvoice")}</AdminBadge>
          </div>
        </AdminCard>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-[var(--admin-error-500)]/30 bg-[var(--admin-error-50)] px-4 py-3 text-sm text-[var(--admin-error-700)]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-[var(--admin-success-500)]/30 bg-[var(--admin-success-50)] px-4 py-3 text-sm text-[var(--admin-success-700)]">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <AdminCard padded={false}>
          <div className="border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="admin-section-title mb-0">{t("payments.listed")}</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {t("payments.listedHint")}
            </p>
          </div>
          {accounts.length === 0 ? (
            <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
              {t("payments.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--admin-border)]">
              {accounts.map((row) => (
                <li
                  key={row.id}
                  className={`px-5 py-4 ${
                    row.isActive
                      ? "bg-[var(--admin-brand-50)]/45"
                      : "bg-transparent"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[var(--admin-text)]">
                          {row.label}
                        </p>
                        {row.isActive ? (
                          <AdminBadge tone="success">
                            {t("payments.onInvoice")}
                          </AdminBadge>
                        ) : (
                          <AdminBadge>{t("common.inactive")}</AdminBadge>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-[var(--admin-text)]">
                        {row.companyName}
                      </p>
                      <p className="mt-0.5 font-mono text-sm tracking-wide text-[var(--admin-muted)]">
                        {row.accountNumber}
                      </p>
                      <p className="mt-1 text-sm text-[var(--admin-muted)]">
                        {row.bankName}
                        {row.swiftCode ? ` · SWIFT ${row.swiftCode}` : ""}
                        {row.currency ? ` · ${row.currency}` : ""}
                      </p>
                      {row.bankAddress ? (
                        <p className="mt-1 text-sm text-[var(--admin-muted)]">
                          {row.bankAddress}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!row.isActive ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onActivate(row.id)}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                        >
                          <Star className="h-3.5 w-3.5" strokeWidth={1.75} />
                          {t("payments.useOnInvoice")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => startEdit(row)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onDelete(row)}
                        className="admin-btn admin-btn-danger admin-btn-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {t("common.remove")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
              <h2 className="text-base font-semibold text-[var(--admin-text)]">
                {editing ? t("payments.edit") : t("payments.add")}
              </h2>
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
          <form onSubmit={onSave} className="grid gap-3 sm:grid-cols-2">
            <label className="admin-label text-xs">
              {t("payments.label")}
              <input
                required
                value={form.label}
                onChange={(e) => field("label", e.target.value)}
                className="admin-input mt-1.5 w-full"
                placeholder="Dah Sing Bank"
              />
            </label>
            <label className="admin-label text-xs">
              {t("payments.company")}
              <input
                required
                value={form.companyName}
                onChange={(e) => field("companyName", e.target.value)}
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="admin-label text-xs">
              {t("payments.accountNumber")}
              <input
                required
                value={form.accountNumber}
                onChange={(e) => field("accountNumber", e.target.value)}
                className="admin-input mt-1.5 w-full font-mono"
              />
            </label>
            <label className="admin-label text-xs">
              {t("payments.bankName")}
              <input
                required
                value={form.bankName}
                onChange={(e) => field("bankName", e.target.value)}
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="admin-label text-xs sm:col-span-2">
              {t("payments.bankAddress")}
              <input
                value={form.bankAddress}
                onChange={(e) => field("bankAddress", e.target.value)}
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="admin-label text-xs">
              {t("payments.swift")}
              <input
                value={form.swiftCode}
                onChange={(e) => field("swiftCode", e.target.value)}
                className="admin-input mt-1.5 w-full font-mono uppercase"
              />
            </label>
            <label className="admin-label text-xs">
              {t("payments.currency")}
              <input
                value={form.currency}
                onChange={(e) => field("currency", e.target.value)}
                className="admin-input mt-1.5 w-full uppercase"
              />
            </label>
            <label className="admin-label text-xs sm:col-span-2">
              {t("payments.notes")}
              <input
                value={form.notes}
                onChange={(e) => field("notes", e.target.value)}
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="flex items-center gap-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-3.5 py-3 text-sm text-[var(--admin-text)] sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => field("isActive", e.target.checked)}
                className="rounded border-[var(--admin-border)]"
              />
              {t("payments.setActive")}
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="admin-btn admin-btn-primary"
              >
                {editing ? t("common.save") : t("payments.create")}
              </button>
            </div>
          </form>
        </AdminCard>
      </div>
    </div>
  );
}
