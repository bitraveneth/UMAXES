"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CircleDollarSign,
  ClipboardList,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  adjustRebateWalletAction,
  issueRebateMonthAction,
  saveRebatePolicy,
} from "@/lib/admin-actions";
import type { ChannelPolicy, RebateTier } from "@/lib/rebate";
import {
  AdminBadge,
  AdminStat,
  AdminTable,
} from "@/components/admin/ui";
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

function emptyTier(): RebateTier {
  return { minQty: 0, rateUsd: 0 };
}

function PolicyCard({
  policy,
  pending,
  onSave,
}: {
  policy: ChannelPolicy;
  pending: boolean;
  onSave: (policy: ChannelPolicy, fd: FormData, tiers: RebateTier[]) => void;
}) {
  const { t } = useAdminI18n();
  const [tiers, setTiers] = useState<RebateTier[]>(
    policy.tiers.length ? policy.tiers : [emptyTier()],
  );

  const preview = tiers
    .filter((row) => row.minQty > 0 && Number.isFinite(row.rateUsd))
    .sort((a, b) => a.minQty - b.minQty)
    .map(
      (row) =>
        `${row.minQty.toLocaleString()}+ pcs → ${money(row.rateUsd)}/pc`,
    )
    .join(" · ");

  return (
    <form
      action={(fd) => onSave(policy, fd, tiers)}
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
          placeholder={
            policy.level === "DISTRO" ? t("rebates.unitPricePending") : "8.90"
          }
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

      <div className="mt-5">
        <p className="admin-label">{t("rebates.tiers")}</p>
        <p className="mt-1 text-xs admin-muted">{t("rebates.tiersHint")}</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--admin-border)]">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-[var(--admin-gray-50)] px-3 py-2 text-xs font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
            <span>{t("rebates.tierPcs")}</span>
            <span>{t("rebates.tierRate")}</span>
            <span className="sr-only">{t("common.remove")}</span>
          </div>
          {tiers.map((row, index) => (
            <div
              key={`${policy.level}-tier-${index}`}
              className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-t border-[var(--admin-border)] px-3 py-2"
            >
              <input
                type="number"
                min={0}
                step={1}
                value={row.minQty || ""}
                onChange={(e) => {
                  const next = [...tiers];
                  next[index] = {
                    ...next[index],
                    minQty: Math.floor(Number(e.target.value) || 0),
                  };
                  setTiers(next);
                }}
                className="admin-input w-full"
                placeholder="5000"
                aria-label={t("rebates.tierPcs")}
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={row.rateUsd || ""}
                onChange={(e) => {
                  const next = [...tiers];
                  next[index] = {
                    ...next[index],
                    rateUsd: Number(e.target.value),
                  };
                  setTiers(next);
                }}
                className="admin-input w-full"
                placeholder="0.20"
                aria-label={t("rebates.tierRate")}
              />
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() =>
                  setTiers(
                    tiers.length === 1
                      ? [emptyTier()]
                      : tiers.filter((_, i) => i !== index),
                  )
                }
                aria-label={t("common.remove")}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.85} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm mt-3"
          onClick={() => setTiers([...tiers, emptyTier()])}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          {t("rebates.addTier")}
        </button>
        {preview ? (
          <p className="mt-3 text-sm text-[var(--admin-text)]">{preview}</p>
        ) : null}
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-[var(--admin-text)]">
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
  );
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
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pendingIssue = months.filter((m) => m.status === "DRAFT");
  const pendingIssueUsd = pendingIssue.reduce(
    (sum, m) => sum + Math.max(0, m.rebateAmount - m.issuedAmount),
    0,
  );
  const walletTotal = companies.reduce((sum, c) => sum + c.rebateBalanceUsd, 0);

  function monthLabel(yearMonth: string) {
    const [year, month] = yearMonth.split("-").map(Number);
    if (!year || !month) return yearMonth;
    return new Date(year, month - 1, 1).toLocaleString(
      locale === "zh" ? "zh-CN" : "en-US",
      { month: "short", year: "numeric" },
    );
  }

  function statusLabel(status: string) {
    if (status === "ISSUED") return t("rebates.statusIssued");
    if (status === "LOCKED") return t("rebates.statusLocked");
    return t("rebates.statusDraft");
  }

  function ledgerType(type: string) {
    if (type === "ISSUE") return t("rebates.typeIssue");
    if (type === "APPLY") return t("rebates.typeApply");
    if (type === "CLAWBACK") return t("rebates.typeClawback");
    if (type === "ADJUST") return t("rebates.typeAdjust");
    return type;
  }

  function savePolicy(
    policy: ChannelPolicy,
    fd: FormData,
    tiers: RebateTier[],
  ) {
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
          tiers: tiers.filter(
            (row) => row.minQty > 0 && Number.isFinite(row.rateUsd),
          ),
        });
        setMessage(t("rebates.saved"));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("rebates.saveFailed"));
      }
    });
  }

  return (
    <div className="space-y-10">
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--admin-muted)]">{message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStat
          label={t("rebates.statPending")}
          value={money(pendingIssueUsd)}
          icon={ClipboardList}
        />
        <AdminStat
          label={t("rebates.statWallets")}
          value={money(walletTotal)}
          icon={Wallet}
        />
        <AdminStat
          label={t("rebates.statActivity")}
          value={ledger.length}
          icon={CircleDollarSign}
        />
      </div>

      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
          {t("rebates.howTitle")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--admin-text)]">
          {t("rebates.howSteps")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--admin-muted)]">
          {t("rebates.howAdjustNote")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {policies.map((policy) => (
          <PolicyCard
            key={policy.id}
            policy={policy}
            pending={pending}
            onSave={savePolicy}
          />
        ))}
      </div>

      <section>
        <h2 className="admin-section-title">{t("rebates.monthsTitle")}</h2>
        <p className="mt-1 text-sm admin-muted">{t("rebates.monthsHint")}</p>
        {months.length === 0 ? (
          <p className="admin-card admin-card-pad mt-3 text-sm admin-muted">
            {t("rebates.monthsEmpty")}
          </p>
        ) : (
          <div className="mt-3">
            <AdminTable
              headers={[
                t("rebates.colCompany"),
                t("rebates.colMonth"),
                t("rebates.colPaidPcs"),
                t("rebates.colRate"),
                t("rebates.colRebate"),
                t("common.status"),
                t("common.actions"),
              ]}
            >
              {months.map((m) => (
                <tr key={m.id}>
                  <td>
                    <p className="font-semibold text-[var(--admin-text)]">
                      {m.companyName}
                    </p>
                    <p className="mt-0.5 text-xs admin-muted">{m.level}</p>
                  </td>
                  <td>{monthLabel(m.yearMonth)}</td>
                  <td className="tabular-nums">
                    {m.paidQty.toLocaleString()}
                  </td>
                  <td className="tabular-nums">{money(m.tierRate)}/pc</td>
                  <td>
                    <p className="font-semibold tabular-nums text-[var(--admin-text)]">
                      {money(m.rebateAmount)}
                    </p>
                    {m.issuedAmount > 0 ? (
                      <p className="mt-0.5 text-xs admin-muted">
                        {t("rebates.issuedSoFar")}: {money(m.issuedAmount)}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <AdminBadge
                      tone={
                        m.status === "ISSUED"
                          ? "success"
                          : m.status === "LOCKED"
                            ? "neutral"
                            : "warning"
                      }
                    >
                      {statusLabel(m.status)}
                    </AdminBadge>
                  </td>
                  <td>
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
                                e instanceof Error
                                  ? e.message
                                  : t("rebates.saveFailed"),
                              );
                            }
                          });
                        }}
                      >
                        {t("rebates.issue")}
                      </button>
                    ) : (
                      <span className="admin-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <div>
          <h2 className="admin-section-title">{t("rebates.walletsTitle")}</h2>
          <p className="mt-1 text-sm admin-muted">{t("rebates.walletsHint")}</p>
          {companies.length === 0 ? (
            <p className="admin-card admin-card-pad mt-3 text-sm admin-muted">
              {t("rebates.walletsEmpty")}
            </p>
          ) : (
            <div className="mt-3">
              <AdminTable
                headers={[
                  t("rebates.colCompany"),
                  t("rebates.colLevel"),
                  t("rebates.colBalance"),
                ]}
              >
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold text-[var(--admin-text)]">
                      {c.name}
                    </td>
                    <td>{c.level}</td>
                    <td className="font-semibold tabular-nums text-[var(--admin-text)]">
                      {money(c.rebateBalanceUsd)}
                    </td>
                  </tr>
                ))}
              </AdminTable>
            </div>
          )}
        </div>

        <form
          className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-card)] p-4 sm:p-5 h-fit"
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
                setError(
                  e instanceof Error ? e.message : t("rebates.saveFailed"),
                );
              }
            });
          }}
        >
          <h3 className="admin-section-title">{t("rebates.adjustTitle")}</h3>
          <p className="mt-1 text-sm admin-muted">{t("rebates.adjustHint")}</p>
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
              placeholder="+100 or −50"
            />
            <span className="mt-1 block text-xs admin-muted">
              {t("rebates.amountHint")}
            </span>
          </label>
          <label className="admin-label mt-3">
            {t("common.note")}
            <input
              name="note"
              required
              className="admin-input mt-1 w-full"
              placeholder="Why this correction?"
            />
          </label>
          <button
            type="submit"
            disabled={pending || companies.length === 0}
            className="admin-btn admin-btn-secondary mt-4 disabled:opacity-50"
          >
            {t("rebates.adjust")}
          </button>
        </form>
      </section>

      <section>
        <h2 className="admin-section-title">{t("rebates.ledgerTitle")}</h2>
        <p className="mt-1 text-sm admin-muted">{t("rebates.ledgerHint")}</p>
        {ledger.length === 0 ? (
          <p className="admin-card admin-card-pad mt-3 text-sm admin-muted">
            {t("common.noData")}
          </p>
        ) : (
          <div className="mt-3">
            <AdminTable
              headers={[
                t("rebates.colWhen"),
                t("rebates.colCompany"),
                t("rebates.colType"),
                t("common.amount"),
                t("common.note"),
              ]}
            >
              {ledger.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-[var(--admin-muted)]">
                    {new Date(row.createdAt).toLocaleString(
                      locale === "zh" ? "zh-CN" : "en-US",
                      { dateStyle: "medium", timeStyle: "short" },
                    )}
                  </td>
                  <td className="font-semibold text-[var(--admin-text)]">
                    {row.companyName}
                  </td>
                  <td>
                    <AdminBadge
                      tone={
                        row.type === "ISSUE"
                          ? "success"
                          : row.type === "CLAWBACK"
                            ? "warning"
                            : row.type === "APPLY"
                              ? "brand"
                              : "neutral"
                      }
                    >
                      {ledgerType(row.type)}
                    </AdminBadge>
                  </td>
                  <td
                    className={`font-semibold tabular-nums ${
                      row.amount < 0
                        ? "text-[var(--admin-error-700)]"
                        : "text-[var(--admin-text)]"
                    }`}
                  >
                    {money(row.amount)}
                  </td>
                  <td className="max-w-xs text-[var(--admin-muted)]">
                    {row.note || "—"}
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>
        )}
      </section>
    </div>
  );
}
