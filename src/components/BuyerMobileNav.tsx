"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Store, UserRound } from "lucide-react";
import { useCart } from "@/context/CartContext";

const HIDDEN = [
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/unauthorized",
] as const;

function isHidden(pathname: string) {
  return HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function BuyerMobileNav() {
  const pathname = usePathname() || "/";
  const { quantity, open, setOpen } = useCart();

  if (isHidden(pathname)) return null;

  const shopActive =
    pathname === "/shop" ||
    pathname.startsWith("/shop/") ||
    pathname.startsWith("/product");
  const accountActive = pathname.startsWith("/account");
  const cartActive = open || pathname.startsWith("/checkout");

  const itemClass = (active: boolean) =>
    `relative flex flex-col items-center justify-center gap-0.5 font-display text-[10px] font-semibold tracking-wide transition ${
      active ? "text-umx-orange" : "text-black/55 active:text-umx-orange-ink"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-umx-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto grid h-14 max-w-lg grid-cols-3">
        <Link href="/shop" className={itemClass(shopActive)} aria-current={shopActive ? "page" : undefined}>
          <Store className="h-5 w-5" strokeWidth={activeStroke(shopActive)} aria-hidden />
          Shop
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={itemClass(cartActive)}
          aria-label={quantity ? `Cart, ${quantity} items` : "Cart"}
        >
          <span className="relative">
            <ShoppingBag className="h-5 w-5" strokeWidth={activeStroke(cartActive)} aria-hidden />
            {quantity > 0 ? (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-umx-orange px-1 text-[9px] font-bold text-white">
                {quantity > 99 ? "99+" : quantity}
              </span>
            ) : null}
          </span>
          Cart
        </button>

        <Link
          href="/account"
          className={itemClass(accountActive)}
          aria-current={accountActive ? "page" : undefined}
        >
          <UserRound className="h-5 w-5" strokeWidth={activeStroke(accountActive)} aria-hidden />
          Account
        </Link>
      </div>
    </nav>
  );
}

function activeStroke(active: boolean) {
  return active ? 2.25 : 1.85;
}
