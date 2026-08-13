import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminCard } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";

export const metadata = { title: "Reports · UMAXES Ops" };

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/reports")) {
    redirect("/admin");
  }

  const canSeeCreditAmounts =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  const [byStatus, byLevel, topSkus, creditExposure] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.company.groupBy({
      by: ["level"],
      where: { status: "APPROVED" },
      _count: { _all: true },
    }),
    prisma.orderItem.groupBy({
      by: ["sku", "name"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    canSeeCreditAmounts
      ? prisma.company.aggregate({
          where: { status: "APPROVED" },
          _sum: { creditUsed: true, creditLimit: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div>
      <AdminPageHeaderI18n
        titleKey="reports.title"
        descriptionKey="reports.description"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Orders by status">
          {byStatus.map((row) => (
            <Row
              key={row.status}
              label={row.status}
              value={`${row._count._all} · $${(row._sum.total || 0).toFixed(0)}`}
            />
          ))}
        </Panel>
        <Panel title="Companies by level">
          {byLevel.map((row) => (
            <Row key={row.level} label={row.level} value={String(row._count._all)} />
          ))}
        </Panel>
        <Panel title="Top SKUs by qty">
          {topSkus.map((row) => (
            <Row
              key={row.sku}
              label={`${row.sku} · ${row.name}`}
              value={String(row._sum.quantity || 0)}
            />
          ))}
        </Panel>
        <Panel title="Credit exposure">
          {canSeeCreditAmounts && creditExposure ? (
            <>
              <Row
                label="Used"
                value={`$${(creditExposure._sum.creditUsed || 0).toFixed(2)}`}
              />
              <Row
                label="Total limits"
                value={`$${(creditExposure._sum.creditLimit || 0).toFixed(2)}`}
              />
            </>
          ) : (
            <Row label="Status" value="Amounts visible to Admin only" />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AdminCard>
      <h2 className="admin-section-title">{title}</h2>
      <div className="mt-4 space-y-1">{children}</div>
    </AdminCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--admin-gray-100)] py-2 text-sm last:border-0">
      <span className="text-[var(--admin-gray-600)]">{label}</span>
      <span className="font-semibold text-[var(--admin-gray-800)]">{value}</span>
    </div>
  );
}
