import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { approveCustomer, rejectCustomer } from "@/lib/admin-actions";
import { AdminBadge } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";

export const metadata = { title: "Approvals · UMAXES Ops" };

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/approvals")) {
    redirect("/admin");
  }

  const pendingUsers = await prisma.user.findMany({
    where: { status: "PENDING", role: "CUSTOMER" },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AdminPageHeaderI18n
        titleKey="approvals.title"
        descriptionKey="approvals.description"
      />

      <ul className="admin-list">
        {pendingUsers.length === 0 && (
          <li className="admin-list-item text-sm admin-muted">No pending accounts.</li>
        )}
        {pendingUsers.map((user) => (
          <li
            key={user.id}
            className="admin-list-item flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--admin-gray-800)]">
                {user.name || "Unnamed"} · {user.company?.name}
              </p>
              <p className="mt-1 text-sm admin-muted">
                {user.email || "—"} {user.phone ? `· ${user.phone}` : ""}
              </p>
              <div className="mt-2">
                <AdminBadge tone="warning">PENDING</AdminBadge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={approveCustomer.bind(null, user.id, "SHOP")}>
                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
                  Shop
                </button>
              </form>
              <form action={approveCustomer.bind(null, user.id, "WHOLESALER")}>
                <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
                  Wholesaler
                </button>
              </form>
              <form action={approveCustomer.bind(null, user.id, "DISTRO")}>
                <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
                  Distro
                </button>
              </form>
              <form action={rejectCustomer.bind(null, user.id)}>
                <button type="submit" className="admin-btn admin-btn-danger admin-btn-sm">
                  Reject
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
