import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminBadge, AdminCard, AdminTable } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import {
  ACTIVITY_FILTERS,
  actionsForCategory,
  activityLabel,
  activityTargetLabel,
  activityTone,
  formatActivityMeta,
  hrefForActivity,
  type ActivityCategory,
} from "@/lib/activity-log";
import { ArrowUpRight } from "lucide-react";

export const metadata = { title: "Activity · UMAXES Ops" };

const PAGE_SIZE = 50;

function formatWhen(d: Date) {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/activity")) {
    redirect("/admin");
  }

  const sp = await searchParams;
  const cat = (ACTIVITY_FILTERS.some((f) => f.id === sp.cat)
    ? sp.cat
    : "all") as ActivityCategory;
  const page = Math.max(1, Number(sp.page) || 1);
  const actions = actionsForCategory(cat);

  const canSeeCreditAmounts =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  const where = actions ? { action: { in: actions } } : {};

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = (page - 1) * PAGE_SIZE + logs.length;

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="activity.title"
        descriptionKey="activity.description"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_FILTERS.map((f) => {
            const active = cat === f.id;
            const href =
              f.id === "all"
                ? "/admin/activity"
                : `/admin/activity?cat=${f.id}`;
            return (
              <Link
                key={f.id}
                href={href}
                className={`admin-btn admin-btn-sm ${
                  active ? "admin-btn-primary" : "admin-btn-secondary"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <p className="text-xs text-[var(--admin-muted)]">
          {from}–{to} of {total}
        </p>
      </div>

      <AdminCard padded={false}>
        {logs.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[var(--admin-muted)]">
            No activity yet. Payments marked paid, shipments, and status changes
            show up here.
          </p>
        ) : (
          <AdminTable
            headers={[
              "When",
              "Action",
              "Target",
              "Details",
              "Edited by",
              "",
            ]}
          >
            {logs.map((log) => {
              const detail = formatActivityMeta(log.action, log.meta, {
                canSeeCreditAmounts,
              });
              const target = activityTargetLabel(
                log.entity,
                log.entityId,
                log.meta,
              );
              const href = hrefForActivity(
                log.entity,
                log.entityId,
                log.action,
              );
              const who = log.user?.name || log.user?.email || "System";

              return (
                <tr key={log.id}>
                  <td className="whitespace-nowrap text-xs text-[var(--admin-muted)]">
                    {formatWhen(log.createdAt)}
                  </td>
                  <td>
                    <AdminBadge tone={activityTone(log.action)}>
                      {activityLabel(log.action)}
                    </AdminBadge>
                  </td>
                  <td className="max-w-[11rem]">
                    <p className="truncate font-semibold text-[var(--admin-text)]">
                      {target}
                    </p>
                    {log.entity ? (
                      <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">
                        {log.entity}
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-sm">
                    <p className="line-clamp-2 text-sm text-[var(--admin-gray-700)]">
                      {detail || "—"}
                    </p>
                  </td>
                  <td className="whitespace-nowrap">
                    <p className="text-sm font-medium text-[var(--admin-text)]">
                      {who}
                    </p>
                    {log.user?.role ? (
                      <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">
                        {log.user.role.replace(/_/g, " ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="text-right">
                    {href ? (
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-brand-500)] hover:underline"
                      >
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                      </Link>
                    ) : (
                      <span className="text-xs text-[var(--admin-muted)]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </AdminTable>
        )}

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] px-5 py-3">
            <p className="text-xs text-[var(--admin-muted)]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={`/admin/activity?cat=${cat}&page=${page - 1}`}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Previous
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link
                  href={`/admin/activity?cat=${cat}&page=${page + 1}`}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </AdminCard>
    </div>
  );
}
