import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { getDatabaseStats } from "@/lib/system-db";
import { getSiteSettings } from "@/lib/site-settings";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import SystemConsole from "@/components/admin/SystemConsole";

export const metadata = { title: "System · UMAXES Ops" };

const SYSTEM_ACTIONS = [
  "SYSTEM_BACKUP_EXPORT",
  "SYSTEM_BACKUP_IMPORT",
  "SYSTEM_DB_RESET",
  "SITE_ACCESS_UPDATED",
  "SYSTEM_CACHE_REVALIDATED",
] as const;

export default async function SystemPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (!canAccessPath(session.user.role, "/admin/system")) {
    redirect("/admin");
  }

  const [stats, siteSettings, recent] = await Promise.all([
    getDatabaseStats(),
    getSiteSettings(),
    prisma.auditLog.findMany({
      where: { action: { in: [...SYSTEM_ACTIONS] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        createdAt: true,
        meta: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="system.title"
        descriptionKey="system.description"
      />
      <SystemConsole
        stats={stats}
        siteSettings={siteSettings}
        envLabel={process.env.NODE_ENV === "production" ? "Production" : "Local"}
        recentActivity={recent.map((r) => ({
          id: r.id,
          action: r.action,
          createdAt: r.createdAt.toISOString(),
          meta: r.meta,
          userName: r.user?.name ?? null,
          userEmail: r.user?.email ?? null,
        }))}
      />
    </div>
  );
}
