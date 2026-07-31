import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import {
  AdminBadge,
  AdminCard,
  AdminStat,
  AdminTable,
} from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminLinkBtn, AdminText } from "@/components/admin/AdminI18nBits";
import CreditCompaniesPanel from "@/components/admin/CreditCompaniesPanel";
import {
  AlertTriangle,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Wallet,
} from "lucide-react";

export const metadata = { title: "Credit · UMAXES Ops" };

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function ledgerTone(type: string): "brand" | "success" | "warning" | "neutral" {
  if (type === "payment" || type === "rma_credit") return "success";
  if (type === "charge") return "warning";
  return "neutral";
}

function changeLabelKey(action: string) {
  if (action === "CREDIT_TERMS_UPDATED") return "credit.termsUpdated";
  if (action === "CREDIT_PAYMENT") return "credit.paymentRecorded";
  return action;
}

function changeTone(action: string): "brand" | "success" | "warning" | "neutral" {
  if (action === "CREDIT_PAYMENT") return "success";
  if (action === "CREDIT_TERMS_UPDATED") return "brand";
  return "neutral";
}

export default async function CreditPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/credit")) {
    redirect("/admin");
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  const [companies, ledger, recentChanges] = await Promise.all([
    prisma.company.findMany({
      where: { status: "APPROVED" },
      orderBy: { creditUsed: "desc" },
    }),
    prisma.creditLedger.findMany({
      include: { company: true, order: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.auditLog.findMany({
      where: {
        action: { in: ["CREDIT_TERMS_UPDATED", "CREDIT_PAYMENT"] },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const companyIdsFromChanges = [
    ...new Set(
      recentChanges
        .map((r) => r.entityId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const changeCompanies =
    companyIdsFromChanges.length > 0
      ? await prisma.company.findMany({
          where: { id: { in: companyIdsFromChanges } },
          select: { id: true, name: true },
        })
      : [];

  const companyById = new Map([
    ...companies.map((c) => [c.id, c.name] as const),
    ...changeCompanies.map((c) => [c.id, c.name] as const),
  ]);

  const totalLimit = companies.reduce((s, c) => s + c.creditLimit, 0);
  const totalUsed = companies.reduce((s, c) => s + c.creditUsed, 0);
  const totalAvailable = Math.max(0, totalLimit - totalUsed);
  const nearLimit = companies.filter((c) => {
    if (c.creditLimit <= 0) return false;
    return c.creditUsed / c.creditLimit >= 0.8;
  }).length;

  return (
    <div className="space-y-8">
      <AdminPageHeaderI18n
        titleKey="credit.title"
        descriptionKey={
          isAdmin ? "credit.descriptionAdmin" : "credit.descriptionSales"
        }
        actions={
          <AdminLinkBtn
            href="/admin/aging"
            labelKey="credit.agingReport"
            icon={<Clock3 className="h-4 w-4" strokeWidth={1.75} />}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          label={<AdminText id="credit.exposure" />}
          value={money(totalUsed)}
          icon={CreditCard}
        />
        <AdminStat
          label={<AdminText id="credit.totalLimit" />}
          value={money(totalLimit)}
          icon={CircleDollarSign}
        />
        <AdminStat
          label={<AdminText id="credit.available" />}
          value={money(totalAvailable)}
          icon={Wallet}
        />
        <AdminStat
          label={<AdminText id="credit.nearLimit" />}
          value={String(nearLimit)}
          icon={AlertTriangle}
          trend={
            nearLimit > 0 ? (
              <AdminText id="credit.companiesNear" values={{ count: nearLimit }} />
            ) : (
              <AdminText id="credit.allHealthy" />
            )
          }
          trendUp={nearLimit === 0}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <AdminText id="credit.currentStatus" as="h2" className="admin-section-title mb-0" />
          <AdminText
            id="credit.approvedHint"
            values={{ count: companies.length }}
            as="p"
            className="text-xs text-[var(--admin-muted)]"
          />
        </div>

        <CreditCompaniesPanel
          isAdmin={isAdmin}
          companies={companies.map((c) => ({
            id: c.id,
            name: c.name,
            level: c.level,
            creditUsed: c.creditUsed,
            creditLimit: c.creditLimit,
            paymentTermsDays: c.paymentTermsDays,
          }))}
        />
      </section>

      <section>
        <AdminText id="credit.recentChanges" as="h2" className="admin-section-title mb-4" />
        {recentChanges.length === 0 ? (
          <AdminCard>
            <AdminText id="credit.noChanges" as="p" className="text-sm text-[var(--admin-muted)]" />
          </AdminCard>
        ) : (
          <AdminTable
            headers={[
              <AdminText key="when" id="credit.when" />,
              <AdminText key="change" id="credit.change" />,
              <AdminText key="company" id="credit.company" />,
              <AdminText key="details" id="credit.details" />,
              <AdminText key="by" id="credit.by" />,
            ]}
          >
            {recentChanges.map((row) => {
              let meta: Record<string, unknown> = {};
              try {
                meta = row.meta ? JSON.parse(row.meta) : {};
              } catch {
                meta = {};
              }

              const companyName =
                (row.entityId && companyById.get(row.entityId)) ||
                row.entityId ||
                "—";

              let details = "—";
              if (row.action === "CREDIT_PAYMENT") {
                const amount = Number(meta.amount ?? 0);
                const note = typeof meta.note === "string" ? meta.note : "";
                details = `${money(amount)}${note ? ` · ${note}` : ""}`;
              } else if (row.action === "CREDIT_TERMS_UPDATED") {
                const before = meta.before as
                  | { creditLimit?: number; paymentTermsDays?: number }
                  | undefined;
                const after = meta.after as
                  | { creditLimit?: number; paymentTermsDays?: number }
                  | undefined;
                const note = typeof meta.note === "string" ? meta.note : "";
                details = `Limit ${money(Number(before?.creditLimit ?? 0))} → ${money(Number(after?.creditLimit ?? 0))} · ${Number(before?.paymentTermsDays ?? 0)}d → ${Number(after?.paymentTermsDays ?? 0)}d${note ? ` · ${note}` : ""}`;
              }

              return (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-xs text-[var(--admin-muted)]">
                    {row.createdAt.toLocaleString()}
                  </td>
                  <td>
                    <AdminBadge tone={changeTone(row.action)}>
                      {row.action === "CREDIT_TERMS_UPDATED" ||
                      row.action === "CREDIT_PAYMENT" ? (
                        <AdminText id={changeLabelKey(row.action)} />
                      ) : (
                        row.action
                      )}
                    </AdminBadge>
                  </td>
                  <td className="font-semibold text-[var(--admin-gray-800)]">
                    {companyName}
                  </td>
                  <td className="max-w-md text-sm text-[var(--admin-muted)]">
                    {details}
                  </td>
                  <td className="text-sm text-[var(--admin-muted)]">
                    {row.user?.name || row.user?.email || "—"}
                  </td>
                </tr>
              );
            })}
          </AdminTable>
        )}
      </section>

      <section>
        <AdminText id="credit.recentLedger" as="h2" className="admin-section-title mb-4" />
        {ledger.length === 0 ? (
          <AdminCard>
            <AdminText id="credit.noLedger" as="p" className="text-sm text-[var(--admin-muted)]" />
          </AdminCard>
        ) : (
          <AdminCard padded={false}>
            <ul className="divide-y divide-[var(--admin-border)]">
              {ledger.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--admin-text)]">
                        {row.company.name}
                      </span>
                      <AdminBadge tone={ledgerTone(row.type)}>
                        {row.type}
                      </AdminBadge>
                      {row.order ? (
                        <span className="text-xs text-[var(--admin-muted)]">
                          {row.order.orderNumber}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">
                      {row.createdAt.toLocaleString()}
                      {row.note ? ` · ${row.note}` : ""}
                      {row.dueDate
                        ? ` · due ${row.dueDate.toISOString().slice(0, 10)}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-semibold tabular-nums ${
                      row.amount < 0
                        ? "text-emerald-600"
                        : "text-[var(--admin-text)]"
                    }`}
                  >
                    {row.amount >= 0 ? "+" : ""}
                    {money(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </AdminCard>
        )}
      </section>
    </div>
  );
}
