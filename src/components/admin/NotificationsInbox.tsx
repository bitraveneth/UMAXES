"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  openNotification,
} from "@/lib/admin-actions";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { Bell, CheckCheck, Circle, ExternalLink } from "lucide-react";

export type NotificationInboxItem = {
  id: string;
  type: string;
  subject: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

type FilterKey = "all" | "unread" | "read";

const TYPE_KEY: Record<string, string> = {
  order: "notifications.typeOrder",
  credit: "notifications.typeCredit",
  shipment: "notifications.typeShipment",
  account: "notifications.typeAccount",
  general: "notifications.typeGeneral",
};

const FILTERS: { key: FilterKey; labelKey: string }[] = [
  { key: "all", labelKey: "notifications.filterAll" },
  { key: "unread", labelKey: "notifications.filterUnread" },
  { key: "read", labelKey: "notifications.filterRead" },
];

export default function NotificationsInbox({
  items,
  unreadTotal,
}: {
  items: NotificationInboxItem[];
  unreadTotal: number;
}) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !n.readAt);
    if (filter === "read") return items.filter((n) => !!n.readAt);
    return items;
  }, [items, filter]);

  function formatWhen(iso: string) {
    try {
      return new Date(iso).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function openItem(id: string) {
    startTransition(async () => {
      await openNotification(id);
      router.refresh();
    });
  }

  function setRead(id: string, read: boolean) {
    startTransition(async () => {
      if (read) await markNotificationRead(id);
      else await markNotificationUnread(id);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? items.length
                : f.key === "unread"
                  ? items.filter((n) => !n.readAt).length
                  : items.filter((n) => !!n.readAt).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`admin-btn admin-btn-sm ${
                  active ? "admin-btn-primary" : "admin-btn-secondary"
                }`}
              >
                {t(f.labelKey)}
                <span
                  className={`ml-1.5 tabular-nums ${
                    active ? "opacity-90" : "text-[var(--admin-muted)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {unreadTotal > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={markAll}
            className="admin-btn admin-btn-secondary admin-btn-sm"
          >
            <CheckCheck className="h-4 w-4" strokeWidth={1.75} />
            {t("common.markAllRead")} ({unreadTotal})
          </button>
        ) : null}
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <div>
            <h2 className="admin-section-title mb-0">{t("notifications.inbox")}</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {t("notifications.inboxHint", {
                count: filtered.length,
                total: items.length,
              })}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <Bell className="h-8 w-8 text-[var(--admin-muted)]" strokeWidth={1.5} />
            <p className="text-sm text-[var(--admin-muted)]">
              {items.length === 0
                ? t("notifications.empty")
                : t("notifications.emptyFilter")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {filtered.map((n) => {
              const unread = !n.readAt;
              return (
                <li
                  key={n.id}
                  className={`flex flex-wrap items-start gap-3 px-5 py-4 transition-colors ${
                    unread
                      ? "bg-[var(--admin-brand-50)]/50"
                      : "bg-[var(--admin-card)]"
                  } ${pending ? "opacity-80" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => openItem(n.id)}
                    className="min-w-0 flex-1 text-left"
                    title={t("notifications.openRelated")}
                  >
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      {unread ? (
                        <span
                          className="inline-flex h-2 w-2 rounded-full bg-[var(--admin-brand-500)]"
                          aria-hidden
                        />
                      ) : (
                        <span
                          className="inline-flex h-2 w-2 rounded-full bg-[var(--admin-border)]"
                          aria-hidden
                        />
                      )}
                      <AdminBadge tone={unread ? "brand" : "neutral"}>
                        {t(TYPE_KEY[n.type] || "notifications.typeGeneral")}
                      </AdminBadge>
                      <time className="text-xs text-[var(--admin-muted)]">
                        {formatWhen(n.createdAt)}
                      </time>
                      {unread ? (
                        <span className="text-[10px] font-bold tracking-wide text-[var(--admin-brand-500)] uppercase">
                          {t("common.new")}
                        </span>
                      ) : null}
                    </div>
                    <p className="font-semibold text-[var(--admin-text)]">
                      {n.subject}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--admin-muted)]">
                      {n.body}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--admin-brand-500)]">
                      {t("notifications.openRelated")}
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </p>
                  </button>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {unread ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setRead(n.id, true)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {t("common.markRead")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setRead(n.id, false)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        <Circle className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {t("common.markUnread")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
