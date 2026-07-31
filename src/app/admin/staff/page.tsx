import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";
import { AdminBadge } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";

export const metadata = { title: "Staff · UMAXES Ops" };

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/staff")) {
    redirect("/admin");
  }

  const staff = await prisma.user.findMany({
    where: {
      role: { in: ["SUPER_ADMIN", "ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"] },
    },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  return (
    <div>
      <AdminPageHeaderI18n
        titleKey="staff.title"
        descriptionKey="staff.description"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ul className="admin-list">
          {staff.map((u) => (
            <li key={u.id} className="admin-list-item text-sm">
              <p className="font-semibold text-[var(--admin-gray-800)]">
                {u.email}
              </p>
              <p className="mt-1 admin-muted">{u.name || "—"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <AdminBadge tone="brand">{u.role}</AdminBadge>
                <AdminBadge
                  tone={u.status === "APPROVED" ? "success" : "warning"}
                >
                  {u.status}
                </AdminBadge>
              </div>
            </li>
          ))}
        </ul>

        <form
          action={async (fd) => {
            "use server";
            const { createStaffUser } = await import("@/lib/admin-actions");
            await createStaffUser({
              name: String(fd.get("name")),
              email: String(fd.get("email")),
              password: String(fd.get("password")),
              role: String(fd.get("role")) as UserRole,
            });
          }}
          className="admin-card admin-card-pad h-fit"
        >
          <h2 className="admin-section-title">Create staff</h2>
          <label className="admin-label mt-4">
            Name
            <input name="name" required className="admin-input mt-1 w-full" />
          </label>
          <label className="admin-label mt-3">
            Email
            <input
              name="email"
              type="email"
              required
              className="admin-input mt-1 w-full"
            />
          </label>
          <label className="admin-label mt-3">
            Password
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="admin-input mt-1 w-full"
            />
          </label>
          <label className="admin-label mt-3">
            Role
            <select name="role" className="admin-input mt-1 w-full">
              <option value="SALES">SALES</option>
              <option value="WAREHOUSE">WAREHOUSE</option>
              <option value="LOGISTICS">LOGISTICS</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <button type="submit" className="admin-btn admin-btn-primary mt-5 w-full">
            Create
          </button>
        </form>
      </div>
    </div>
  );
}
