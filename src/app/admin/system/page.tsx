import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { getDatabaseStats } from "@/lib/system-db";
import { getSiteSettings } from "@/lib/site-settings";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import SiteAccessPanel from "@/components/admin/SiteAccessPanel";
import SystemToolsPanel from "@/components/admin/SystemToolsPanel";

export const metadata = { title: "System · UMAXES Ops" };

export default async function SystemPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (!canAccessPath(session.user.role, "/admin/system")) {
    redirect("/admin");
  }

  const [stats, siteSettings] = await Promise.all([
    getDatabaseStats(),
    getSiteSettings(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="system.title"
        descriptionKey="system.description"
      />
      <SiteAccessPanel initial={siteSettings} />
      <SystemToolsPanel stats={stats} />
    </div>
  );
}
