"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Truck,
  UserRound,
} from "lucide-react";

type MePayload = {
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  jobTitle: string | null;
  companyName: string | null;
  companyLevel: string | null;
};

function levelLabel(level?: string | null) {
  switch (level) {
    case "DISTRO":
      return "Distributor";
    case "WHOLESALER":
      return "Wholesaler";
    case "SHOP":
      return "Retail";
    default:
      return "Buyer";
  }
}

function initials(name?: string | null, email?: string | null) {
  const base = (name || email || "U").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

const MENU_LINKS = [
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/documents", label: "Documents", icon: FileText },
  { href: "/account/tracking", label: "Tracking", icon: Truck },
] as const;

export default function BuyerAccountMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<MePayload | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user || session.user.role !== "CUSTOMER") return;
    let cancelled = false;
    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) setMe(data.user as MePayload);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session?.user || session.user.role !== "CUSTOMER") return null;

  const name = me?.name ?? session.user.name;
  const email = me?.email ?? session.user.email;
  const companyName = me?.companyName;
  const level = me?.companyLevel ?? session.user.companyLevel;
  const image = me?.image;
  const mark = initials(name || companyName, email);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white py-1 pr-2 pl-1 transition hover:border-umx-orange"
      >
        <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-umx-orange font-display text-xs font-bold text-white">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            mark
          )}
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 text-black transition sm:block ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-[60] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden border border-black/10 bg-umx-cream-bright shadow-[0_16px_40px_rgba(61,22,5,0.14)]"
        >
          <div className="border-b border-black/10 bg-umx-orange-wash/50 px-4 py-4">
            <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-umx-orange uppercase">
              {levelLabel(level)}
            </p>
            <p className="mt-1 truncate font-display text-base font-bold text-black">
              {companyName || name || "Your account"}
            </p>
            {email ? (
              <p className="mt-0.5 truncate font-body text-sm text-black">
                {email}
              </p>
            ) : null}
            {name && companyName ? (
              <p className="mt-2 truncate font-body text-xs text-black">
                {name}
                {me?.jobTitle ? ` · ${me.jobTitle}` : ""}
              </p>
            ) : null}
          </div>

          <nav className="flex flex-col p-2">
            {MENU_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 font-display text-sm font-semibold text-black transition hover:bg-umx-orange-wash/60 hover:text-umx-orange"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.85} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-black/10 p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 px-3 py-2.5 font-display text-sm font-semibold text-black transition hover:bg-umx-orange-wash/60 hover:text-umx-orange"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.85} />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
