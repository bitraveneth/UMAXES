"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveCustomer, rejectCustomer } from "@/lib/admin-actions";
import type { CustomerLevel } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard, AdminStat } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { useAppFeedback } from "@/components/ui/AppFeedback";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Store,
  UserRound,
  XCircle,
} from "lucide-react";

export type ApprovalRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  companyName: string | null;
  companyLevel: CustomerLevel | null;
  taxId: string | null;
  addressSummary: string | null;
};

const LEVELS: {
  value: CustomerLevel;
  labelKey: string;
  tone: "primary" | "secondary";
}[] = [
  { value: "SHOP", labelKey: "approvals.approveShop", tone: "primary" },
  {
    value: "WHOLESALER",
    labelKey: "approvals.approveWholesaler",
    tone: "secondary",
  },
  { value: "DISTRO", labelKey: "approvals.approveDistro", tone: "secondary" },
];

function levelHint(level: CustomerLevel | null, t: (k: string) => string) {
  if (level === "DISTRO") return t("customers.levelDISTRO");
  if (level === "WHOLESALER") return t("customers.levelWHOLESALER");
  if (level === "SHOP") return t("customers.levelSHOP");
  return t("approvals.levelUnknown");
}

export default function ApprovalsPanel({ rows }: { rows: ApprovalRow[] }) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { confirm, showToast, ui } = useAppFeedback();

  const byLevel = useMemo(() => {
    const counts = { SHOP: 0, WHOLESALER: 0, DISTRO: 0, OTHER: 0 };
    for (const row of rows) {
      if (row.companyLevel === "SHOP") counts.SHOP += 1;
      else if (row.companyLevel === "WHOLESALER") counts.WHOLESALER += 1;
      else if (row.companyLevel === "DISTRO") counts.DISTRO += 1;
      else counts.OTHER += 1;
    }
    return counts;
  }, [rows]);

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

  function runApprove(userId: string, level: CustomerLevel) {
    setPendingId(userId);
    startTransition(async () => {
      try {
        await approveCustomer(userId, level);
        showToast(t("approvals.approved"), "success");
        router.refresh();
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : t("approvals.actionFailed"),
          "danger",
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  async function runReject(userId: string, companyName: string | null) {
    const ok = await confirm({
      title: t("approvals.rejectTitle"),
      message: t("approvals.rejectConfirm", {
        name: companyName || t("approvals.thisApplicant"),
      }),
      confirmLabel: t("approvals.reject"),
      tone: "danger",
    });
    if (!ok) return;
    setPendingId(userId);
    startTransition(async () => {
      try {
        await rejectCustomer(userId);
        showToast(t("approvals.rejected"), "danger");
        router.refresh();
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : t("approvals.actionFailed"),
          "danger",
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {ui}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          label={t("approvals.statPending")}
          value={rows.length}
          icon={Clock3}
        />
        <AdminStat
          label={t("approvals.statShop")}
          value={byLevel.SHOP}
          icon={Store}
        />
        <AdminStat
          label={t("approvals.statWholesaler")}
          value={byLevel.WHOLESALER}
          icon={Building2}
        />
        <AdminStat
          label={t("approvals.statDistro")}
          value={byLevel.DISTRO}
          icon={Building2}
        />
      </div>

      <AdminCard padded={false}>
        <div className="border-b border-[var(--admin-border)] px-5 py-4">
          <h2 className="admin-section-title mb-0">{t("approvals.queue")}</h2>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t("approvals.queueHint", { count: rows.length })}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--admin-success-50)] text-[var(--admin-success-700)]">
              <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <p className="mt-4 text-base font-semibold text-[var(--admin-text)]">
              {t("approvals.emptyTitle")}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--admin-muted)]">
              {t("approvals.empty")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {rows.map((row) => {
              const busy = pending && pendingId === row.id;
              return (
                <li key={row.id} className="px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--admin-warning-50)] text-[var(--admin-warning-700)]">
                        <UserRound className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-[var(--admin-text)]">
                            {row.companyName || t("approvals.noCompany")}
                          </p>
                          <AdminBadge tone="warning">
                            {t("approvals.pending")}
                          </AdminBadge>
                          <AdminBadge tone="brand">
                            {levelHint(row.companyLevel, t)}
                          </AdminBadge>
                        </div>
                        <p className="mt-1 text-sm font-medium text-[var(--admin-text)]">
                          {row.name || t("approvals.unnamed")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--admin-muted)]">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                            {row.email || "—"}
                          </span>
                          {row.phone ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone
                                className="h-3.5 w-3.5"
                                strokeWidth={1.75}
                              />
                              {row.phone}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs text-[var(--admin-muted)]">
                          {t("approvals.appliedAt", {
                            date: formatDate(row.createdAt),
                          })}
                          {row.taxId
                            ? ` · ${t("customers.taxId")}: ${row.taxId}`
                            : ""}
                          {row.addressSummary
                            ? ` · ${row.addressSummary}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
                        {t("approvals.approveAs")}
                      </p>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        {LEVELS.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            disabled={busy || pending}
                            onClick={() => runApprove(row.id, level.value)}
                            className={`admin-btn admin-btn-sm ${
                              level.tone === "primary"
                                ? "admin-btn-primary"
                                : "admin-btn-secondary"
                            }`}
                          >
                            <CheckCircle2
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                            />
                            {t(level.labelKey)}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={busy || pending}
                          onClick={() => runReject(row.id, row.companyName)}
                          className="admin-btn admin-btn-danger admin-btn-sm"
                        >
                          <XCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                          {t("approvals.reject")}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
