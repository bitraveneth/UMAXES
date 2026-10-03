import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { parseModuleAccess } from "@/lib/admin-modules";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import StaffPanel from "@/components/admin/StaffPanel";

export const metadata = { title: "Staff · UMAXES Ops" };

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ impersonate?: string }>;
}) {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/staff") ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")
  ) {
    redirect("/admin");
  }

  const sp = await searchParams;
  const impersonateError =
    sp.impersonate === "failed"
      ? "Could not open that staff account. Try Login as again."
      : sp.impersonate === "missing"
        ? "Login link was incomplete. Try Login as again."
        : null;

  const staff = await prisma.user.findMany({
    where: {
      role: { in: ["SUPER_ADMIN", "ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"] },
    },
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      lastLoginIp: true,
      lastLoginCountry: true,
      lastLoginDevice: true,
      moduleAccess: true,
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="staff.title"
        descriptionKey="staff.description"
      />
      <StaffPanel
        currentUserId={session.user.id}
        canManageModules={
          session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN"
        }
        canImpersonate={
          session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN"
        }
        initialError={impersonateError}
        actorRole={session.user.role}
        staff={staff.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          lastLoginIp: u.lastLoginIp,
          lastLoginCountry: u.lastLoginCountry,
          lastLoginDevice: u.lastLoginDevice,
          moduleAccess: parseModuleAccess(u.moduleAccess),
        }))}
      />
    </div>
  );
}
