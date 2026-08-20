"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Boxes,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  RotateCcw,
  Store,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import {
  storeStickyTopClass,
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";
import { BuyerLanguagePicker, useBuyerI18n } from "@/components/account/BuyerI18n";

export type AccountNavUser = {
  name?: string | null;
  email?: string | null;
  companyLevel?: string | null;
  companyName?: string | null;
  image?: string | null;
};

const NAV_PRIMARY = [
  {
    href: "/account",
    labelKey: "nav.overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/account/orders",
    labelKey: "nav.orders",
    icon: Package,
    exact: false,
  },
  {
    href: "/account/documents",
    labelKey: "nav.documents",
    icon: FileText,
    exact: false,
  },
  {
    href: "/account/tracking",
    labelKey: "nav.tracking",
    icon: Truck,
    exact: false,
  },
  {
    href: "/account/favorites",
    labelKey: "nav.wishlist",
    icon: Heart,
    exact: false,
  },
  { href: "/shop", labelKey: "nav.shop", icon: Store, exact: false },
] as const;

const NAV_SECONDARY = [
  {
    href: "/account/profile",
    labelKey: "nav.profile",
    icon: UserRound,
    exact: false,
  },
  {
    href: "/account/addresses",
    labelKey: "nav.addresses",
    icon: MapPin,
    exact: false,
  },
  {
    href: "/account/returns",
    labelKey: "nav.returns",
    icon: RotateCcw,
    exact: false,
  },
  {
    href: "/account/assets",
    labelKey: "nav.mediaKit",
    icon: Boxes,
    exact: false,
  },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group/nav flex items-center gap-3 px-3 py-2.5 font-display text-sm font-semibold transition duration-200 ${
        active
          ? "bg-umx-orange text-white"
          : "text-black hover:translate-x-0.5 hover:bg-umx-orange hover:text-white"
      }`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 transition duration-200 ${
          active
            ? "text-white"
            : "text-black group-hover/nav:scale-110 group-hover/nav:text-white"
        }`}
        strokeWidth={active ? 2.1 : 1.85}
      />
      {label}
    </Link>
  );
}

export default function AccountShell({
  user,
  signOutAction,
  children,
}: {
  user: AccountNavUser;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const compactChrome = useCompactMobileStoreChrome();
  const { t } = useBuyerI18n();

  function pageTitle(path: string) {
    if (path === "/account") return t("nav.overview");
    const all = [...NAV_PRIMARY, ...NAV_SECONDARY];
    const hit = all.find(
      (item) =>
        item.href !== "/shop" &&
        (path === item.href || path.startsWith(`${item.href}/`)),
    );
    return hit ? t(hit.labelKey) : t("nav.account");
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex flex-1 flex-col">
        <nav className="flex flex-col gap-0.5 px-3 py-4">
          <p className="mb-2 px-3 font-display text-[10px] font-semibold tracking-[0.16em] text-black uppercase">
            {t("nav.menu")}
          </p>
          {NAV_PRIMARY.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              active={isActive(pathname, item.href, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <nav className="mt-2 flex flex-col gap-0.5 border-t border-black/8 px-3 py-4">
          <p className="mb-2 px-3 font-display text-[10px] font-semibold tracking-[0.16em] text-black uppercase">
            {t("nav.account")}
          </p>
          {NAV_SECONDARY.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              active={isActive(pathname, item.href, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className="mt-auto space-y-3 border-t border-black/8 px-0 py-4">
          <BuyerLanguagePicker />
          <div className="px-3">
            <form action={signOutAction}>
              <button
                type="submit"
                className="group/out flex w-full items-center gap-3 px-3 py-2.5 font-display text-sm font-semibold text-black transition duration-200 hover:translate-x-0.5 hover:bg-umx-orange hover:text-white"
              >
                <LogOut
                  className="h-4 w-4 transition duration-200 group-hover/out:scale-110 group-hover/out:text-white"
                  strokeWidth={1.85}
                />
                {t("nav.signOut")}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const stickyTop = storeStickyTopClass(compactChrome);

  return (
    <div
      className={`umx-account-theme flex flex-1 flex-col bg-umx-cream pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0 ${storeTopPadClass(compactChrome)}`}
    >
      <div
        className={`sticky z-20 flex items-center justify-between border-b border-black/10 bg-umx-cream-bright px-4 py-3 sm:px-6 lg:hidden ${stickyTop}`}
      >
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-black">
            {pageTitle(pathname)}
          </p>
          <p className="truncate font-body text-xs text-black">
            {t("nav.portal")}
          </p>
        </div>
        <button
          type="button"
          aria-label={t("nav.menu")}
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center border border-black/15 bg-white text-black"
        >
          <Menu className="h-5 w-5" strokeWidth={1.85} />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute top-0 left-0 flex h-full w-[min(18.5rem,88vw)] flex-col border-r border-black/10 bg-umx-cream-bright shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-4">
              <p className="font-display text-sm font-bold text-black">
                {t("nav.menu")}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center border border-black/15 text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-black/10 px-4 py-4 transition hover:bg-umx-orange-wash/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-umx-orange font-display text-xs font-bold text-white">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (user.name || user.companyName || "U").slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-bold text-black">
                  {user.name || user.companyName || t("nav.profile")}
                </span>
                <span className="block truncate font-body text-xs text-black">
                  {t("nav.viewProfile")}
                </span>
              </span>
            </Link>
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="relative mx-auto flex w-full max-w-[90rem] flex-1">
        <aside
          className={`sticky hidden h-[calc(100vh-9rem)] w-[14.5rem] shrink-0 flex-col border-r border-black/10 bg-umx-cream-bright lg:flex xl:w-[15.5rem] ${stickyTop}`}
        >
          <div className="border-b border-black/10 px-5 py-4">
            <p className="font-display text-[10px] font-semibold tracking-[0.16em] text-umx-orange uppercase">
              {t("nav.portal")}
            </p>
          </div>
          <NavLinks />
        </aside>

        <main className="min-w-0 flex-1">
          <div className="w-full px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
