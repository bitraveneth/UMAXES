"use client";

import {
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
} from "@/lib/admin-actions";
import { useAdminI18n } from "@/components/admin/AdminI18n";

export function MarkAllReadButton({ unread }: { unread: number }) {
  const { t } = useAdminI18n();
  return (
    <form action={markAllNotificationsRead}>
      <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
        {t("common.markAllRead")} ({unread})
      </button>
    </form>
  );
}

export function MarkReadButton({ id }: { id: string }) {
  const { t } = useAdminI18n();
  return (
    <form action={markNotificationRead.bind(null, id)}>
      <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
        {t("common.markRead")}
      </button>
    </form>
  );
}

export function MarkUnreadButton({ id }: { id: string }) {
  const { t } = useAdminI18n();
  return (
    <form action={markNotificationUnread.bind(null, id)}>
      <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
        {t("common.markUnread")}
      </button>
    </form>
  );
}
