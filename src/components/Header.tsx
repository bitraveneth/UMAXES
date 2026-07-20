"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import LegalTicker from "@/components/LegalTicker";
import { useCart } from "@/context/CartContext";
import { logos } from "@/lib/assets";

const sectionNav = [
  { href: "/#products", label: "Products", id: "products" },
  { href: "/#news", label: "News", id: "news" },
  { href: "/#features", label: "Why UMAXES", id: "features" },
] as const;

const supportLinks = [
  { href: "/support", label: "Support hub" },
  { href: "/faq", label: "FAQ" },
  { href: "/support/verify", label: "Product verify" },
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

function navLinkClass(active: boolean) {
  return `rounded-full px-3 py-2 font-display text-[0.7rem] font-semibold tracking-[0.06em] uppercase transition-colors duration-200 xl:px-3.5 ${
    active ? "text-umx-orange" : "text-black hover:text-umx-orange"
  }`;
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
        className={navLinkClass(supportActive)}
        aria-haspopup="menu"
      >
        Support
      </Link>

      {/* Invisible bridge so hover doesn't drop when moving to menu */}
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
                className={`block px-4 py-3 font-display text-sm font-semibold transition hover:bg-umx-cream hover:text-umx-orange ${
                  active ? "bg-umx-cream text-umx-orange" : "text-black"
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

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { quantity, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elements = sectionNav
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0.1, 0.35, 0.6] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setSupportOpen(false);
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        <LegalTicker />
        <header
          className={`transition-[background,box-shadow,backdrop-filter] duration-300 ${
            scrolled || open
              ? "border-b border-umx-cream-deep/70 bg-umx-cream/90 shadow-[0_8px_30px_rgba(61,22,5,0.06)] backdrop-blur-xl"
              : "border-b border-transparent bg-umx-cream/80 backdrop-blur-md"
          }`}
        >
          <div
            className={`mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 transition-[height] duration-300 sm:px-6 ${
              scrolled ? "h-14" : "h-16 sm:h-[4.25rem]"
            }`}
          >
            <Link
              href="/"
              className="relative z-50 block h-7 w-[7.5rem] shrink-0 sm:h-8 sm:w-40"
              onClick={closeMenu}
            >
              <Image
                src={logos.orangeTransparent}
                alt="UMAXES"
                fill
                className="object-contain object-left"
                sizes="160px"
                priority
              />
            </Link>

            <nav
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
              aria-label="Primary"
            >
              {sectionNav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(
                    pathname === "/" && activeSection === item.id
                  )}
                >
                  {item.label}
                </a>
              ))}
              <span aria-hidden className="mx-1.5 h-4 w-px bg-black/15" />
              <SupportDropdown pathname={pathname} />
            </nav>

            <div className="relative z-50 flex items-center gap-2 sm:gap-3">
              <a
                href="/#products"
                className="hidden rounded-full border border-black bg-transparent px-5 py-2.5 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:bg-umx-orange hover:!text-white sm:inline-flex"
              >
                Shop now
              </a>

              <button
                type="button"
                aria-label={
                  quantity > 0 ? `Open cart, ${quantity} items` : "Open cart"
                }
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-black ring-1 ring-black/15 transition duration-200 hover:text-umx-orange hover:ring-umx-orange"
                onClick={() => {
                  closeMenu();
                  setCartOpen(true);
                }}
              >
                <CartIcon className="h-[1.15rem] w-[1.15rem]" />
                {quantity > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-umx-orange px-1 font-display text-[0.65rem] font-bold text-white">
                    {quantity > 99 ? "99+" : quantity}
                  </span>
                )}
              </button>

              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-black ring-1 ring-black/15 transition duration-200 hover:text-umx-orange hover:ring-umx-orange lg:hidden"
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

      <div
        id="mobile-nav"
        className={`fixed inset-0 z-40 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
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
            {sectionNav.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 font-display text-lg font-semibold tracking-[0.04em] text-black uppercase transition hover:text-umx-orange"
                style={{
                  transitionDelay: open ? `${80 + i * 30}ms` : "0ms",
                }}
              >
                {item.label}
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    pathname === "/" && activeSection === item.id
                      ? "bg-umx-orange"
                      : "bg-umx-cream-deep"
                  }`}
                />
              </a>
            ))}

            <button
              type="button"
              onClick={() => setSupportOpen((v) => !v)}
              className="mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3.5 font-display text-lg font-semibold tracking-[0.04em] text-black uppercase"
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
                      className={`block rounded-xl px-4 py-3 font-display text-base font-semibold transition hover:text-umx-orange ${
                        active ? "text-umx-orange" : "text-black/75"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}

            <a
              href="/#products"
              onClick={closeMenu}
              className="mt-4 rounded-full border border-black px-5 py-4 text-center font-display text-base font-semibold text-black transition hover:border-umx-orange hover:bg-umx-orange hover:!text-white"
            >
              Shop now
            </a>
          </nav>
        </div>
      </div>

      <CartDrawer />
    </>
  );
}
