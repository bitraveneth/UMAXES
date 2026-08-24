import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import UsersPanel from "@/components/admin/UsersPanel";

export const metadata = { title: "Users · UMAXES Ops" };

export default async function UsersPage() {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/users") ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")
  ) {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: [{ createdAt: "desc" }],
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
      lastLoginUserAgent: true,
      company: { select: { name: true, level: true } },
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="users.title"
        descriptionKey="users.description"
      />
      <UsersPanel
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          status: u.status,
          companyName: u.company?.name ?? null,
          companyLevel: u.company?.level ?? null,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          lastLoginIp: u.lastLoginIp,
          lastLoginCountry: u.lastLoginCountry,
          lastLoginDevice: u.lastLoginDevice,
          lastLoginUserAgent: u.lastLoginUserAgent,
        }))}
      />
    </div>
  );
}
