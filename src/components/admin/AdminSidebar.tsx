"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminSidebar } from "./AdminSidebarContext";
import { useAdminI18n } from "./AdminI18n";
import { adminNavIcons, ExternalLink, LogOut, Package } from "./icons";
import { logos } from "@/lib/assets";
import type { AdminNavItem } from "@/lib/rbac";

export function AdminSidebar({
  items,
  signOutAction,
}: {
  items: AdminNavItem[];
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const { isMobileOpen, isExpanded, closeMobile } = useAdminSidebar();
  const { t } = useAdminI18n();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/logistics") {
      if (pathname === "/admin/logistics" || pathname === "/admin/logistics/") {
        return true;
      }
      if (pathname.startsWith("/admin/logistics/shipments")) return false;
      if (pathname.startsWith("/admin/logistics/packing-lists")) return false;
      // Shipment desk detail: /admin/logistics/[id]
      return /^\/admin\/logistics\/[^/]+$/.test(pathname);
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const widthClass = isExpanded ? "lg:w-[290px]" : "lg:w-[90px]";
  const showLabels = isExpanded || isMobileOpen;

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label={t("common.close")}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={[
          "admin-sidebar fixed top-0 left-0 z-50 flex h-screen flex-col border-r transition-transform duration-300 ease-in-out",
          widthClass,
          "w-[290px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div
          className={`flex items-center gap-3 border-b border-[var(--admin-border)] px-4 py-5 ${
            isExpanded ? "justify-start" : "lg:justify-center lg:px-2"
          }`}
        >
          <Link
            href="/admin"
            onClick={closeMobile}
            className="flex min-w-0 items-center gap-3"
            aria-label={t("brand.home")}
          >
            {showLabels ? (
              <span className="relative h-8 w-[9.5rem] shrink-0">
                <Image
                  src={logos.orangeTransparent}
                  alt="UMAXES"
                  fill
                  className="admin-logo-light object-contain object-left"
                  sizes="152px"
                  priority
                />
                <Image
                  src={logos.creamTransparent}
                  alt="UMAXES"
                  fill
                  className="admin-logo-dark object-contain object-left"
                  sizes="152px"
                  priority
                />
              </span>
            ) : (
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--admin-brand-50)] ring-1 ring-[var(--admin-brand-100)]">
                <span className="relative h-6 w-6">
                  <Image
                    src={logos.markOrange}
                    alt="UMAXES"
                    fill
                    className="admin-logo-light object-contain"
                    sizes="24px"
                    priority
                  />
                  <Image
                    src={logos.markCream}
                    alt="UMAXES"
                    fill
                    className="admin-logo-dark object-contain"
                    sizes="24px"
                    priority
                  />
                </span>
              </span>
            )}
          </Link>
          {showLabels && (
            <span className="rounded-md bg-[var(--admin-brand-50)] px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-[var(--admin-brand-700)]">
              {t("brand.ops")}
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <p
            className={`mb-3 px-3 text-xs font-medium uppercase tracking-wider text-[var(--admin-muted)] ${
              !isExpanded ? "lg:text-center lg:px-0" : ""
            }`}
          >
            {showLabels ? t("brand.menu") : "···"}
          </p>
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = isActive(item.href);
              const Icon = adminNavIcons[item.href] || Package;
              const navKey = item.navKey || item.href;
              const label = t(`nav.${navKey}`) || item.label;
              return (
                <li key={`${item.href}:${navKey}`}>
                  <Link
                    href={item.href}
                    onClick={closeMobile}
                    title={label}
                    className={[
                      "admin-menu-item",
                      active ? "admin-menu-item-active" : "",
                      !isExpanded ? "lg:justify-center lg:px-2" : "",
                    ].join(" ")}
                  >
                    <Icon
                      className="h-5 w-5 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {showLabels && <span className="truncate">{label}</span>}
                  </Link>
                </li>
              );
            })}
            <li className="mt-1 border-t border-[var(--admin-border)] pt-2">
              <form action={signOutAction}>
                <button
                  type="submit"
                  title={t("nav.signOut")}
                  className={[
                    "admin-menu-item w-full",
                    !isExpanded ? "lg:justify-center lg:px-2" : "",
                  ].join(" ")}
                >
                  <LogOut
                    className="h-5 w-5 shrink-0"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  {showLabels && (
                    <span className="truncate">{t("nav.signOut")}</span>
                  )}
                </button>
              </form>
            </li>
          </ul>
        </nav>

        <div className="space-y-2 border-t border-[var(--admin-border)] p-4">
          <Link
            href="/"
            onClick={closeMobile}
            className={`admin-btn admin-btn-secondary w-full ${
              !isExpanded ? "lg:px-2" : ""
            }`}
            title={t("brand.site")}
          >
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {showLabels && <span>{t("brand.site")}</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
