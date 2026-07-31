import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { resolveNotificationHref } from "@/lib/notify";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminText } from "@/components/admin/AdminI18nBits";
import NotificationsInbox from "@/components/admin/NotificationsInbox";

export const metadata = { title: "Notifications · UMAXES Ops" };

const PAGE_SIZE = 200;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/notifications")
  ) {
    redirect("/admin");
  }

  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(params.page || "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [rows, total, unreadTotal] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({ where: { userId: session.user.id } }),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
  ]);

  const items = rows.map((n) => ({
    id: n.id,
    type: n.type,
    subject: n.subject,
    body: n.body,
    href: resolveNotificationHref(n),
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="notifications.title"
        descriptionKey="notifications.description"
      />

      <NotificationsInbox items={items} unreadTotal={unreadTotal} />

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--admin-muted)]">
          <AdminText
            id="notifications.pageHint"
            values={{ page, totalPages, total }}
          />
          <div className="flex gap-2">
            {page > 1 ? (
              <a
                href={`/admin/notifications?page=${page - 1}`}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <AdminText id="common.prev" />
              </a>
            ) : null}
            {page < totalPages ? (
              <a
                href={`/admin/notifications?page=${page + 1}`}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <AdminText id="common.next" />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <AdminText
        id="notifications.tip"
        as="p"
        className="text-xs text-[var(--admin-muted)]"
      />
    </div>
  );
}
