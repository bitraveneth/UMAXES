import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminStat } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminText } from "@/components/admin/AdminI18nBits";

export const metadata = { title: "Credit aging · UMAXES Ops" };

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export default async function AgingPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/aging")) {
    redirect("/admin");
  }

  const canSeeAmounts =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  const now = new Date();
  const openCharges = await prisma.creditLedger.findMany({
    where: { type: "charge", amount: { gt: 0 } },
    include: { company: true, order: true },
    orderBy: { dueDate: "asc" },
  });

  const buckets = {
    current: [] as typeof openCharges,
    d1_30: [] as typeof openCharges,
    d31_60: [] as typeof openCharges,
    d60: [] as typeof openCharges,
  };

  for (const row of openCharges) {
    if (!row.dueDate) {
      buckets.current.push(row);
      continue;
    }
    const overdue = daysBetween(row.dueDate, now);
    if (overdue <= 0) buckets.current.push(row);
    else if (overdue <= 30) buckets.d1_30.push(row);
    else if (overdue <= 60) buckets.d31_60.push(row);
    else buckets.d60.push(row);
  }

  function sum(rows: typeof openCharges) {
    return rows.reduce((s, r) => s + r.amount, 0);
  }

  return (
    <div>
      <AdminPageHeaderI18n
        titleKey="aging.title"
        descriptionKey="aging.description"
      />

      {!canSeeAmounts ? (
        <p className="mb-4 text-sm text-[var(--admin-muted)]">
          Credit dollar amounts are visible to Admin / Super Admin only.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["aging.current", buckets.current],
            ["aging.d1_30", buckets.d1_30],
            ["aging.d31_60", buckets.d31_60],
            ["aging.d60", buckets.d60],
          ] as const
        ).map(([labelKey, rows]) => (
          <AdminStat
            key={labelKey}
            label={
              <>
                <AdminText id={labelKey} />
                {" · "}
                <AdminText id="aging.entries" values={{ count: rows.length }} />
              </>
            }
            value={
              canSeeAmounts ? `$${sum(rows).toFixed(0)}` : String(rows.length)
            }
          />
        ))}
      </div>

      <ul className="admin-list mt-8">
        {[
          ...buckets.d60,
          ...buckets.d31_60,
          ...buckets.d1_30,
          ...buckets.current,
        ].map((row) => (
          <li
            key={row.id}
            className="admin-list-item flex flex-wrap justify-between gap-3 text-sm"
          >
            <span>
              {row.company.name} · {row.order?.orderNumber || "—"} · due{" "}
              {row.dueDate?.toISOString().slice(0, 10) || "n/a"}
            </span>
            {canSeeAmounts ? (
              <span className="font-semibold text-[var(--admin-gray-800)]">
                {money(row.amount)}
              </span>
            ) : (
              <span className="text-xs font-medium text-[var(--admin-muted)]">
                Amount confidential
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
