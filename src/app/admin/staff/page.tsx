import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import StaffPanel from "@/components/admin/StaffPanel";

export const metadata = { title: "Staff · UMAXES Ops" };

export default async function StaffPage() {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/staff") ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")
  ) {
    redirect("/admin");
  }

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
        staff={staff.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
