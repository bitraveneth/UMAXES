"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import BuyerAccountMenu from "@/components/BuyerAccountMenu";
import GoogleTranslate from "@/components/GoogleTranslate";
import LanguagePicker from "@/components/LanguagePicker";
import { useCart } from "@/context/CartContext";
import { useCompactMobileStoreChrome } from "@/hooks/useStoreChrome";
import { logos } from "@/lib/assets";

/** Public site nav — keep lean */
const primaryNav = [
  { href: "/", label: "Home", match: "home" as const },
  { href: "/shop", label: "Products", match: "shop" as const },
  { href: "/maxcore", label: "MAXCORE", match: "maxcore" as const },
  {
    href: "/support/verify",
    label: "Verify product",
    match: "verify" as const,
  },
  { href: "/#news", label: "Info center", match: "news" as const },
  { href: "/login", label: "Wholesale", match: "wholesale" as const },
] as const;

const supportLinks = [
  { href: "/support", label: "Support hub" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact us" },
] as const;

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6l-1-3H2" />
      <circle cx="9" cy="20" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Shared nav type — one size for every menu item */
const NAV_TYPE =
  "font-display text-[15px] font-semibold leading-none tracking-[0.08em] uppercase";

const navLinkBase = `inline-flex h-10 items-center whitespace-nowrap rounded-full px-3.5 ${NAV_TYPE} transition duration-200`;

function navLinkClass(active: boolean) {
  return `${navLinkBase} ${
    active
      ? "text-black"
      : "text-black/55 hover:bg-black/[0.06] hover:text-black"
  }`;
}

function isNavActive(
  match: (typeof primaryNav)[number]["match"],
  pathname: string,
  activeSection: string,
) {
  switch (match) {
    case "home":
      return pathname === "/" && activeSection !== "news";
    case "shop":
      return pathname === "/shop" || pathname.startsWith("/product");
    case "maxcore":
      return pathname.startsWith("/maxcore");
    case "verify":
      return pathname.startsWith("/support/verify");
    case "news":
      return (
        pathname.startsWith("/blog") ||
        (pathname === "/" && activeSection === "news")
      );
    case "wholesale":
      return (
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/account")
      );
    default:
      return false;
  }
}

function SupportDropdown({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const supportActive =
    pathname.startsWith("/support") ||
    pathname === "/faq" ||
    pathname === "/contact";

  return (
    <div className="group relative">
      <Link
        href="/support"
        className={navLinkClass(
          supportActive && !pathname.startsWith("/support/verify"),
        )}
        aria-haspopup="menu"
      >
        Support
      </Link>

      <div
        role="menu"
        className="invisible absolute top-full left-1/2 z-50 w-52 -translate-x-1/2 pt-2 opacity-0 transition duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_rgba(61,22,5,0.14)] ring-1 ring-black/8">
          {supportLinks.map((item) => {
            const active =
              item.href === "/support"
                ? pathname === "/support"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => onNavigate?.()}
                className={`block px-4 py-3 font-display text-[13px] font-semibold tracking-[0.04em] transition hover:bg-umx-cream hover:text-black ${
                  active ? "bg-umx-cream text-black" : "text-black/85"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LanguageDropdown() {
  return (
    <div className="group relative">
      <button
        type="button"
        className={`${navLinkClass(false)} gap-1.5`}
        aria-haspopup="menu"
        aria-label="Language"
      >
        Language
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className="h-2.5 w-2.5 shrink-0 opacity-55"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>
      <div
        role="menu"
        className="invisible absolute top-full right-0 z-50 w-[17.5rem] pt-2 opacity-0 transition duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <div className="rounded-2xl bg-white p-3 shadow-[0_16px_40px_rgba(61,22,5,0.14)] ring-1 ring-black/8">
          <LanguagePicker mountWidget={false} />
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isXl, setIsXl] = useState(false);
  const { quantity } = useCart();
  const { data: session } = useSession();
  const hideMobileHeader = useCompactMobileStoreChrome();
  const accountHref =
    session?.user?.role &&
    ["SUPER_ADMIN", "ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"].includes(
      session.user.role,
    )
      ? "/admin"
      : session?.user?.status === "PENDING"
        ? "/account/pending"
        : "/account";

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => setIsXl(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const el = document.getElementById("news");
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        } else if (pathname === "/") {
          setActiveSection("");
        }
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!hideMobileHeader) return;
    setOpen(false);
    setSupportOpen(false);
    setLangOpen(false);
  }, [hideMobileHeader]);

  function closeMenu() {
    setOpen(false);
    setSupportOpen(false);
    setLangOpen(false);
  }

  const pinNav = pathname !== "/";

  return (
    <>
      <div
        id="site-menu"
        className={`${pinNav ? "fixed inset-x-0 top-0" : "sticky top-0"} z-50 ${
          hideMobileHeader ? "hidden lg:block" : ""
        }`}
      >
        <header
          className={`pt-5 sm:pt-7 transition-[background,box-shadow,backdrop-filter,padding] duration-300 ${
            scrolled || open
              ? "border-b border-umx-cream-deep/70 bg-umx-cream/90 shadow-[0_8px_30px_rgba(61,22,5,0.06)] backdrop-blur-xl"
              : "border-b border-transparent bg-umx-cream/80 backdrop-blur-md"
          }`}
        >
          <div
            className={`mx-auto flex w-full max-w-[1680px] items-center gap-4 transition-[height] duration-300 sm:gap-6 lg:gap-8 ${
              scrolled
                ? "h-16 px-2.5 sm:h-[4.5rem] sm:px-4 md:px-5"
                : "h-[4.75rem] px-2.5 sm:h-20 sm:px-4 md:px-5"
            }`}
          >
            <Link
              href="/"
              className="relative z-50 block h-10 w-44 shrink-0 sm:h-11 sm:w-52 lg:h-12 lg:w-56"
              onClick={closeMenu}
            >
              <Image
                src={logos.orangeTransparent}
                alt="UMAXES"
                fill
                className="object-contain object-left brightness-0"
                sizes="192px"
                quality={70}
                priority
              />
            </Link>

            <nav
              className="ml-2 hidden min-w-0 flex-1 items-center justify-center gap-x-1 xl:flex"
              aria-label="Primary"
            >
              {primaryNav.map((item) => {
                const active = isNavActive(item.match, pathname, activeSection);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={navLinkClass(active)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <SupportDropdown pathname={pathname} />
              {/* Language always last in the navbar */}
              {isXl ? (
                <div className="order-last">
                  <LanguageDropdown />
                </div>
              ) : null}
            </nav>

            <div className="relative z-50 ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
              <Link
                href="/cart"
                aria-label={
                  quantity > 0 ? `Cart, ${quantity} items` : "Cart"
                }
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-full text-black ring-1 ring-black/15 transition duration-200 hover:bg-black hover:text-white hover:ring-black"
                onClick={closeMenu}
              >
                <CartIcon className="h-[1.15rem] w-[1.15rem]" />
                {quantity > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-umx-orange px-1 font-display text-[0.65rem] font-bold text-white">
                    {quantity > 99 ? "99+" : quantity}
                  </span>
                )}
              </Link>

              {session?.user ? (
                session.user.role === "CUSTOMER" ? (
                  <BuyerAccountMenu />
                ) : (
                  <Link
                    href={accountHref}
                    className={`hidden h-9 items-center rounded-full border border-black/15 px-4 text-black/85 transition hover:border-black hover:bg-black hover:text-white sm:inline-flex ${NAV_TYPE}`}
                  >
                    Account
                  </Link>
                )
              ) : (
                <Link
                  href="/login"
                  className={`hidden h-9 items-center rounded-full border border-black/15 px-4 text-black/85 transition hover:border-black hover:bg-black hover:text-white sm:inline-flex ${NAV_TYPE}`}
                >
                  Sign in
                </Link>
              )}

              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-black ring-1 ring-black/15 transition duration-200 hover:bg-black hover:text-white hover:ring-black xl:hidden"
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((v) => !v)}
              >
                <span className="relative block h-3.5 w-5">
                  <span
                    className={`absolute left-0 block h-0.5 w-5 origin-center rounded-full bg-current transition duration-300 ${
                      open ? "top-[6px] rotate-45" : "top-0"
                    }`}
                  />
                  <span
                    className={`absolute top-[6px] left-0 block h-0.5 w-5 rounded-full bg-current transition duration-300 ${
                      open ? "scale-x-0 opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute left-0 block h-0.5 w-5 origin-center rounded-full bg-current transition duration-300 ${
                      open ? "top-[6px] -rotate-45" : "top-3"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>
        </header>
      </div>

      {!hideMobileHeader ? (
        <div
          id="mobile-nav"
          className={`fixed inset-0 z-40 xl:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!open}
        >
          <div
            className={`absolute inset-0 bg-umx-orange-ink/40 transition-opacity duration-300 ${
              open ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMenu}
          />
          <div
            className={`absolute inset-x-0 top-0 origin-top bg-umx-cream px-4 pb-8 pt-32 shadow-[0_20px_60px_rgba(61,22,5,0.12)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 ${
              open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
            }`}
          >
            <nav
              className="mx-auto flex max-w-[1200px] flex-col gap-1"
              aria-label="Mobile"
            >
              {primaryNav.map((item, i) => {
                const active = isNavActive(item.match, pathname, activeSection);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-black/85 transition hover:bg-black/[0.06] hover:text-black ${NAV_TYPE} !text-base !tracking-[0.06em]`}
                    style={{
                      transitionDelay: open ? `${80 + i * 30}ms` : "0ms",
                    }}
                  >
                    {item.label}
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-umx-orange" : "bg-umx-cream-deep"
                      }`}
                    />
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => setSupportOpen((v) => !v)}
                className={`mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-black/85 ${NAV_TYPE} !text-base !tracking-[0.06em]`}
                aria-expanded={supportOpen}
              >
                Support
              </button>

              {supportOpen && (
                <div className="mb-1 ml-3 border-l-2 border-umx-orange/30 pl-2">
                  {supportLinks.map((item) => {
                    const active =
                      item.href === "/support"
                        ? pathname === "/support"
                        : pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={`block rounded-xl px-4 py-3 font-display text-[15px] font-semibold tracking-[0.04em] transition hover:bg-black/[0.06] hover:text-black ${
                          active ? "text-black" : "text-black/70"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className={`mt-1 flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-black/85 ${NAV_TYPE} !text-base !tracking-[0.06em]`}
                aria-expanded={langOpen}
              >
                Language
              </button>

              {langOpen && !isXl && (
                <div className="mb-1 ml-3 rounded-2xl border border-umx-cream-deep bg-white p-3">
                  <LanguagePicker
                    mountWidget={false}
                    onPicked={closeMenu}
                  />
                </div>
              )}

              <Link
                href={session?.user ? accountHref : "/login"}
                onClick={closeMenu}
                className={`mt-4 rounded-full border border-black/15 px-5 py-4 text-center text-black transition hover:border-black hover:bg-black hover:text-white ${NAV_TYPE} !text-base !tracking-[0.06em]`}
              >
                {session?.user ? "Account" : "Sign in"}
              </Link>
            </nav>
          </div>
        </div>
      ) : null}

      {/* Single Google Translate host — custom LanguagePicker drives it */}
      <div className="umx-lang-picker__widget" aria-hidden>
        <GoogleTranslate />
      </div>
    </>
  );
}
