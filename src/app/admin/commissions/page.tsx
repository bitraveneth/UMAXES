import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { assignSalesRep } from "@/lib/admin-actions";
import { AdminTable } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";

export const metadata = { title: "Commissions · UMAXES Ops" };

export default async function CommissionsPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/commissions")) {
    redirect("/admin");
  }

  const [salesReps, companies, paidOrders] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["SALES", "ADMIN"] }, status: "APPROVED" },
      orderBy: { email: "asc" },
    }),
    prisma.company.findMany({
      where: { status: "APPROVED" },
      include: { salesRep: true },
      orderBy: { name: "asc" },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ["CONFIRMED", "SENT_TO_SUPPLIER", "PICKING", "SHIPPED", "COMPLETED"] },
      },
      include: { company: { include: { salesRep: true } } },
    }),
  ]);

  const byRep = new Map<
    string,
    { email: string; sales: number; commission: number; orders: number }
  >();

  for (const order of paidOrders) {
    const rep = order.company.salesRep;
    if (!rep) continue;
    const rate = order.company.commissionRate || 0;
    const commission = (order.total * rate) / 100;
    const cur = byRep.get(rep.id) || {
      email: rep.email || rep.name || rep.id,
      sales: 0,
      commission: 0,
      orders: 0,
    };
    cur.sales += order.total;
    cur.commission += commission;
    cur.orders += 1;
    byRep.set(rep.id, cur);
  }

  return (
    <div className="space-y-10">
      <AdminPageHeaderI18n
        titleKey="commissions.title"
        descriptionKey="commissions.description"
      />

      <AdminTable headers={["Rep", "Orders", "Sales", "Commission"]}>
        {[...byRep.values()].map((row) => (
          <tr key={row.email}>
            <td className="font-semibold text-[var(--admin-gray-800)]">{row.email}</td>
            <td>{row.orders}</td>
            <td>${row.sales.toFixed(2)}</td>
            <td>${row.commission.toFixed(2)}</td>
          </tr>
        ))}
        {byRep.size === 0 && (
          <tr>
            <td colSpan={4} className="admin-muted">
              Assign sales reps below to start tracking.
            </td>
          </tr>
        )}
      </AdminTable>

      <section>
        <h2 className="admin-section-title mb-4">Assign sales rep</h2>
        <ul className="space-y-3">
          {companies.map((c) => (
            <li
              key={c.id}
              className="admin-card admin-card-pad flex flex-wrap items-center justify-between gap-3"
            >
              <div className="text-sm">
                <p className="font-semibold text-[var(--admin-gray-800)]">{c.name}</p>
                <p className="admin-muted">
                  {c.level} · rate {c.commissionRate}% · current{" "}
                  {c.salesRep?.email || "unassigned"}
                </p>
              </div>
              <form
                action={async (fd) => {
                  "use server";
                  await assignSalesRep(
                    c.id,
                    String(fd.get("salesRepId") || ""),
                    Number(fd.get("commissionRate")),
                  );
                }}
                className="flex flex-wrap gap-2"
              >
                <select
                  name="salesRepId"
                  defaultValue={c.salesRepId || ""}
                  className="admin-input"
                >
                  <option value="">Unassigned</option>
                  {salesReps.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.email || r.name}
                    </option>
                  ))}
                </select>
                <input
                  name="commissionRate"
                  type="number"
                  step="0.1"
                  min={0}
                  defaultValue={c.commissionRate}
                  className="admin-input w-20"
                />
                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
                  Save
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
