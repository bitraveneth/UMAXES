"use client";

import { useSession } from "next-auth/react";

/**
 * Mobile store chrome for logged-in buyers (retail / wholesaler / distributor).
 * Hides the fixed site header below `lg` — bottom nav covers Shop / Cart / Account.
 * Staff keep the normal header if they visit the storefront.
 */
export function useCompactMobileStoreChrome() {
  const { data: session, status } = useSession();
  if (status !== "authenticated" || !session?.user) return false;
  return session.user.role === "CUSTOMER";
}

/** Page top padding under the fixed store header. */
export function storeTopPadClass(compact: boolean) {
  return compact
    ? "pt-3 sm:pt-4 lg:pt-[9rem]"
    : "pt-[7.75rem] sm:pt-[9rem]";
}

/** Sticky offset for bars that sit under the fixed store header. */
export function storeStickyTopClass(compact: boolean) {
  return compact ? "top-0 lg:top-[9rem]" : "top-[7.75rem] sm:top-[9rem]";
}
