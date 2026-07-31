"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  ExternalLink,
  Pencil,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { useAdminSidebar } from "./AdminSidebarContext";
import { AdminLanguagePicker, useAdminI18n } from "./AdminI18n";

export function AdminHeader({
  email,
  name,
  role,
  unreadCount = 0,
  signOutAction,
}: {
  email: string;
  name?: string | null;
  role: string;
  unreadCount?: number;
  signOutAction: () => Promise<void>;
}) {
  const { isMobileOpen, theme, toggleMobile, toggleExpanded, toggleTheme } =
    useAdminSidebar();
  const { t } = useAdminI18n();
  const roleLabel = t(`role.${role}`) || role;
  const displayName = (name && name.trim()) || email;
  const initial = (displayName || role).slice(0, 1).toUpperCase();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <header className="admin-header sticky top-0 z-30 flex w-full border-b">
      <div className="flex grow items-center justify-between gap-4 px-3 py-3.5 sm:px-4 md:px-5 xl:px-6">
        <div className="flex flex-1 items-center gap-3">
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                toggleExpanded();
              } else {
                toggleMobile();
              }
            }}
            className="admin-icon-btn !rounded-lg"
          >
            {isMobileOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>

          <div className="relative hidden max-w-md flex-1 md:block">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]"
              strokeWidth={1.75}
            />
            <input
              type="search"
              placeholder={t("header.search")}
              className="admin-input w-full py-2.5 pl-10 pr-16"
              disabled
              title={t("header.search")}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-[var(--admin-border)] bg-[var(--admin-hover)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--admin-muted)]">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            title={t("header.visitSite")}
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">{t("header.visitSite")}</span>
          </Link>

          <AdminLanguagePicker />

          <button
            type="button"
            className="admin-icon-btn"
            aria-label={
              theme === "dark" ? t("header.themeLight") : t("header.themeDark")
            }
            title={
              theme === "dark" ? t("header.themeLight") : t("header.themeDark")
            }
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>

          <Link
            href="/admin/notifications"
            className="admin-icon-btn relative"
            aria-label={
              unreadCount > 0
                ? t("header.notificationsUnread", { count: unreadCount })
                : t("header.notifications")
            }
            title={t("header.notifications")}
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
            {unreadCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--admin-error-500)] px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 rounded-full p-0.5 ring-1 ring-[var(--admin-brand-100)] transition hover:ring-[var(--admin-brand-500)]"
              title={displayName}
            >
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--admin-brand-50)]">
                <span className="text-sm font-bold text-[var(--admin-brand-500)]">
                  {initial}
                </span>
              </span>
              <ChevronDown
                className={`hidden h-4 w-4 text-[var(--admin-muted)] sm:block ${
                  open ? "rotate-180" : ""
                }`}
                strokeWidth={1.75}
              />
            </button>

            {open ? (
              <div
                role="menu"
                className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-lg"
              >
                <div className="border-b border-[var(--admin-border)] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--admin-brand-50)] text-sm font-bold text-[var(--admin-brand-500)] ring-1 ring-[var(--admin-brand-100)]">
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                        {displayName}
                      </p>
                      <span className="mt-1 inline-flex rounded-md bg-[var(--admin-brand-50)] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--admin-brand-700)]">
                        {roleLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-2.5 py-2">
                    <p className="min-w-0 flex-1 truncate text-xs text-[var(--admin-muted)]">
                      {email}
                    </p>
                    <button
                      type="button"
                      onClick={copyEmail}
                      className="admin-icon-btn !h-7 !w-7 shrink-0"
                      title={t("header.copyEmail")}
                      aria-label={t("header.copyEmail")}
                    >
                      {copied ? (
                        <Check
                          className="h-3.5 w-3.5 text-emerald-500"
                          strokeWidth={2}
                        />
                      ) : (
                        <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2">
                  <Link
                    href="/admin/profile"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)]"
                  >
                    <Pencil className="h-4 w-4 text-[var(--admin-muted)]" />
                    {t("header.editProfile")}
                  </Link>
                  <Link
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)] sm:hidden"
                  >
                    <ExternalLink className="h-4 w-4 text-[var(--admin-muted)]" />
                    {t("header.visitSite")}
                  </Link>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)]"
                    >
                      <LogOut className="h-4 w-4 text-[var(--admin-muted)]" />
                      {t("header.signOut")}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
