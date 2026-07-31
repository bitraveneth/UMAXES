"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import B2BCheckout from "@/components/B2BCheckout";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";

export default function CheckoutShell() {
  const compactChrome = useCompactMobileStoreChrome();

  return (
    <>
      <Header />
      <main
        className={`flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-16 lg:pb-12 ${storeTopPadClass(compactChrome)}`}
      >
        <div className="mx-auto mb-10 max-w-6xl">
          <p className="font-display text-xs font-semibold tracking-[0.18em] text-umx-orange uppercase">
            Wholesale checkout
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Place order
          </h1>
          <p className="mt-2 max-w-2xl font-body text-black/65">
            Approved accounts only. Choose a saved address, payment method, and
            download your PI after submit.
          </p>
        </div>
        <B2BCheckout />
      </main>
      <Footer />
    </>
  );
}
