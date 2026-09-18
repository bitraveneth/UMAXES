"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adjustRebateWalletAction,
  issueRebateMonthAction,
  saveRebatePolicy,
} from "@/lib/admin-actions";
import type { ChannelPolicy, RebateTier } from "@/lib/rebate";
import { AdminBadge } from "@/components/admin/ui";
import { useAdminI18n } from "./AdminI18n";

type MonthRow = {
  id: string;
  companyId: string;
  companyName: string;
  level: string;
  yearMonth: string;
  paidQty: number;
  tierRate: number;
  rebateAmount: number;
  issuedAmount: number;
  status: string;
};

type CompanyRow = {
  id: string;
  name: string;
  level: string;
  rebateBalanceUsd: number;
};

type LedgerRow = {
  id: string;
  companyName: string;
  type: string;
  amount: number;
  note: string | null;
  createdAt: string;
};

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function tiersToText(tiers: RebateTier[]) {
  if (!tiers.length) return "";
  return tiers.map((t) => `${t.minQty}:${t.rateUsd}`).join("\n");
}

function parseTiers(text: string): RebateTier[] {
  return text
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [minQty, rateUsd] = line.split(/[:|=]/);
      return {
        minQty: Math.floor(Number(minQty) || 0),
        rateUsd: Number(rateUsd),
      };
    })
    .filter((t) => t.minQty > 0 && Number.isFinite(t.rateUsd));
}

export default function RebateManager({
  policies,
  months,
  companies,
  ledger,
}: {
  policies: ChannelPolicy[];
  months: MonthRow[];
  companies: CompanyRow[];
  ledger: LedgerRow[];
}) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function savePolicy(policy: ChannelPolicy, fd: FormData) {
    setError(null);
    setMessage(null);
    const unitRaw = String(fd.get("unitPrice") || "").trim();
    startTransition(async () => {
      try {
        await saveRebatePolicy({
          level: policy.level as "WHOLESALER" | "DISTRO",
          active: fd.get("active") === "on",
          unitPrice: unitRaw ? Number(unitRaw) : null,
          pcsPerCase: Number(fd.get("pcsPerCase") || 95),
          testStationsPerCase: Number(fd.get("testStationsPerCase") || 1),
          firstOrderCases: Number(fd.get("firstOrderCases") || 5),
          firstOrderUnpaidPcs: Number(fd.get("firstOrderUnpaidPcs") || 20),
          timezone: policy.timezone || "America/Los_Angeles",
          tiers: parseTiers(String(fd.get("tiers") || "")),
        });
        setMessage(t("rebates.saved"));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("rebates.saveFailed"));
      }
    });
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-[var(--admin-muted)]">{message}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {policies.map((policy) => (
          <form
            key={policy.level}
            action={(fd) => savePolicy(policy, fd)}
            className="admin-card admin-card-pad"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="admin-section-title">
                {policy.level === "WHOLESALER"
                  ? t("rebates.wholesaler")
                  : t("rebates.distributor")}
              </h2>
              <AdminBadge tone={policy.active ? "success" : "neutral"}>
                {policy.active ? t("common.active") : t("common.inactive")}
              </AdminBadge>
            </div>
            <p className="mt-1 text-sm admin-muted">{t("rebates.sopHint")}</p>

            <label className="admin-label mt-4">
              {t("rebates.unitPrice")}
              <input
                name="unitPrice"
                type="number"
                step="0.01"
                defaultValue={policy.unitPrice ?? ""}
                className="admin-input mt-1 w-full"
                placeholder={policy.level === "DISTRO" ? t("rebates.unitPricePending") : "8.90"}
              />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="admin-label">
                {t("rebates.pcsPerCase")}
                <input
                  name="pcsPerCase"
                  type="number"
                  defaultValue={policy.pcsPerCase}
                  className="admin-input mt-1 w-full"
                />
              </label>
              <label className="admin-label">
                {t("rebates.testPerCase")}
                <input
                  name="testStationsPerCase"
                  type="number"
                  defaultValue={policy.testStationsPerCase}
                  className="admin-input mt-1 w-full"
                />
              </label>
              <label className="admin-label">
                {t("rebates.firstOrderCases")}
                <input
                  name="firstOrderCases"
                  type="number"
                  defaultValue={policy.firstOrderCases}
                  className="admin-input mt-1 w-full"
                />
              </label>
              <label className="admin-label">
                {t("rebates.firstOrderUnpaid")}
                <input
                  name="firstOrderUnpaidPcs"
                  type="number"
                  defaultValue={policy.firstOrderUnpaidPcs}
                  className="admin-input mt-1 w-full"
                />
              </label>
            </div>
            <label className="admin-label mt-3">
              {t("rebates.tiers")}
              <textarea
                name="tiers"
                rows={4}
                defaultValue={tiersToText(policy.tiers)}
                className="admin-input mt-1 w-full font-mono text-sm"
                placeholder="5000:0.2"
              />
            </label>
            <p className="mt-1 text-xs admin-muted">{t("rebates.tiersHint")}</p>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input name="active" type="checkbox" defaultChecked={policy.active} />
              {t("rebates.active")}
            </label>
            <button
              type="submit"
              disabled={pending}
              className="admin-btn admin-btn-primary mt-4 disabled:opacity-50"
            >
              {t("common.save")}
            </button>
          </form>
        ))}
      </div>

      <section>
        <h2 className="admin-section-title">{t("rebates.monthsTitle")}</h2>
        <p className="mt-1 text-sm admin-muted">{t("rebates.monthsHint")}</p>
        <ul className="admin-list mt-3">
          {months.length === 0 ? (
            <li className="admin-list-item text-sm admin-muted">{t("rebates.monthsEmpty")}</li>
          ) : (
            months.map((m) => (
              <li key={m.id} className="admin-list-item text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--admin-text)]">
                      {m.companyName} · {m.yearMonth}
                    </p>
                    <p className="mt-1 admin-muted">
                      {m.level} · {m.paidQty.toLocaleString()} pcs · {money(m.tierRate)}/pc ·{" "}
                      {money(m.rebateAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminBadge
                      tone={
                        m.status === "ISSUED"
                          ? "success"
                          : m.status === "LOCKED"
                            ? "neutral"
                            : "warning"
                      }
                    >
                      {m.status}
                    </AdminBadge>
                    {m.status !== "LOCKED" ? (
                      <button
                        type="button"
                        disabled={pending}
                        className="admin-btn admin-btn-secondary admin-btn-sm disabled:opacity-50"
                        onClick={() => {
                          startTransition(async () => {
                            try {
                              await issueRebateMonthAction(m.id);
                              router.refresh();
                            } catch (e) {
                              setError(
                                e instanceof Error ? e.message : t("rebates.saveFailed"),
                              );
                            }
                          });
                        }}
                      >
                        {t("rebates.issue")}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="admin-section-title">{t("rebates.walletsTitle")}</h2>
          <ul className="admin-list mt-3">
            {companies.map((c) => (
              <li key={c.id} className="admin-list-item text-sm">
                <p className="font-semibold text-[var(--admin-text)]">{c.name}</p>
                <p className="mt-1 admin-muted">
                  {c.level} · {money(c.rebateBalanceUsd)}
                </p>
              </li>
            ))}
          </ul>
          <form
            className="admin-card admin-card-pad mt-4"
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                try {
                  await adjustRebateWalletAction(
                    String(fd.get("companyId")),
                    Number(fd.get("amount")),
                    String(fd.get("note") || ""),
                  );
                  router.refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : t("rebates.saveFailed"));
                }
              });
            }}
          >
            <h3 className="admin-section-title">{t("rebates.adjustTitle")}</h3>
            <label className="admin-label mt-3">
              {t("rebates.company")}
              <select name="companyId" className="admin-input mt-1 w-full" required>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-label mt-3">
              {t("rebates.amount")}
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                className="admin-input mt-1 w-full"
              />
            </label>
            <label className="admin-label mt-3">
              {t("common.note")}
              <input name="note" required className="admin-input mt-1 w-full" />
            </label>
            <button
              type="submit"
              disabled={pending || companies.length === 0}
              className="admin-btn admin-btn-secondary mt-4 disabled:opacity-50"
            >
              {t("rebates.adjust")}
            </button>
          </form>
        </div>
        <div>
          <h2 className="admin-section-title">{t("rebates.ledgerTitle")}</h2>
          <ul className="admin-list mt-3">
            {ledger.length === 0 ? (
              <li className="admin-list-item text-sm admin-muted">{t("common.noData")}</li>
            ) : (
              ledger.map((row) => (
                <li key={row.id} className="admin-list-item text-sm">
                  <p className="font-semibold text-[var(--admin-text)]">
                    {row.companyName} · {row.type} · {money(row.amount)}
                  </p>
                  <p className="mt-1 admin-muted">
                    {row.note || "—"} · {new Date(row.createdAt).toLocaleString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
