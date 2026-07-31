import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";

export const metadata = { title: "Audit · UMAXES Ops" };

export default async function AuditPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/audit")) {
    redirect("/admin");
  }

  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <AdminPageHeaderI18n
        titleKey="audit.title"
        descriptionKey="audit.description"
      />
      <ul className="admin-list">
        {logs.map((log) => (
          <li key={log.id} className="admin-list-item text-sm">
            <p className="font-semibold text-[var(--admin-gray-800)]">
              {log.action}
              {log.entity ? ` · ${log.entity}` : ""}
              {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}
            </p>
            <p className="mt-1 admin-muted">
              {log.createdAt.toISOString().replace("T", " ").slice(0, 19)} ·{" "}
              {log.user?.email || log.user?.name || "system"}
            </p>
            {log.meta && (
              <p className="mt-1 break-all text-xs text-[var(--admin-gray-400)]">
                {log.meta}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
