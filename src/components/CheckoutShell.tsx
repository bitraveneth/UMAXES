"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import B2BCheckout from "@/components/B2BCheckout";
import { useCart } from "@/context/CartContext";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";

function CheckoutAuthGate() {
  const { quantity, total } = useCart();

  return (
    <div className="relative mx-auto max-w-md">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-umx-orange/15 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-black/8">
        <div className="bg-gradient-to-br from-umx-orange via-umx-orange to-umx-orange-deep px-6 py-8 text-center text-white sm:px-8 sm:py-10">
          <p className="font-display text-[0.7rem] font-semibold tracking-[0.2em] uppercase opacity-90">
            Checkout
          </p>
          <h1 className="mt-3 font-display text-[clamp(1.75rem,5vw,2.35rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
            Almost there
          </h1>
          <p className="mx-auto mt-3 max-w-xs font-body text-sm leading-relaxed text-white/85">
            Sign in or create an account to finish your order.
          </p>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          {quantity > 0 ? (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-umx-cream px-4 py-3.5">
              <div>
                <p className="font-display text-[0.65rem] font-semibold tracking-[0.14em] text-black/45 uppercase">
                  In your bag
                </p>
                <p className="mt-0.5 font-display text-sm font-semibold text-black">
                  {quantity} item{quantity === 1 ? "" : "s"}
                </p>
              </div>
              <p className="font-display text-lg font-bold text-black">
                ${total.toFixed(2)}
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            <Link
              href="/login?callbackUrl=/checkout"
              className="flex h-12 w-full items-center justify-center rounded-full bg-umx-orange font-display text-sm font-semibold !text-white transition hover:bg-umx-orange-deep"
            >
              Sign in
            </Link>
            <Link
              href="/register?callbackUrl=/checkout"
              className="flex h-12 w-full items-center justify-center rounded-full border border-black/12 bg-white font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange"
            >
              Create an account
            </Link>
          </div>

          <div className="my-6 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-black/10" />
            <span className="font-display text-[0.65rem] font-semibold tracking-[0.14em] text-black/35 uppercase">
              or
            </span>
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <Link
            href="/cart"
            className="flex items-center justify-center gap-2 font-display text-sm font-semibold text-black/55 transition hover:text-umx-orange"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutShell() {
  const compactChrome = useCompactMobileStoreChrome();
  const { status } = useSession();

  return (
    <>
      <Header />
      <main
        className={`flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-16 lg:pb-12 ${storeTopPadClass(compactChrome)}`}
      >
        {status === "loading" ? (
          <p className="py-20 text-center font-body text-black/55">
            Loading checkout…
          </p>
        ) : status === "unauthenticated" ? (
          <div className="mx-auto max-w-6xl py-6 sm:py-10">
            <CheckoutAuthGate />
          </div>
        ) : (
          <>
            <div className="mx-auto mb-8 max-w-6xl sm:mb-10">
              <h1 className="font-display text-3xl font-bold tracking-tight text-black">
                Checkout
              </h1>
            </div>
            <B2BCheckout />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
