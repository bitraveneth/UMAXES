"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BatteryCharging,
  ChevronRight,
  CircleHelp,
  Grid3x3,
  Package,
  ShoppingBag,
  Usb,
  Wind,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";
import { StorePrice, useShowStorePrices } from "@/components/StorePrice";
import { flavors, product } from "@/lib/assets";

const PRODUCT_HREF = `/product/${flavors[0].id}`;

const highlights = [
  { label: "~80,000 puffs", icon: Wind },
  { label: "1600mAh rechargeable", icon: BatteryCharging },
  { label: "LIT Mesh coil", icon: Grid3x3 },
  { label: "USB Type-C", icon: Usb },
] as const;

function ShopAside({
  quantity,
  total,
}: {
  quantity: number;
  total: number;
}) {
  const showPrices = useShowStorePrices();
  return (
    <aside className="hidden space-y-4 xl:block">
      <div className="sticky top-28 space-y-4">
        <div className="overflow-hidden border border-black/8 bg-white">
          <div className="border-b border-black/8 bg-white px-5 py-4 text-black">
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 font-display text-sm font-bold tracking-[0.12em] uppercase">
                <ShoppingBag className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                Your bag
              </p>
              {quantity > 0 && (
                <span className="bg-black px-2 py-0.5 font-display text-xs font-bold text-white">
                  {quantity}
                </span>
              )}
            </div>
          </div>

          <div className="px-5 py-5">
            <p className="font-display text-[0.65rem] font-semibold tracking-[0.16em] text-black/40 uppercase">
              Subtotal
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-black">
              {showPrices ? `$${total.toFixed(2)}` : "On request"}
            </p>
            <p className="mt-2 font-body text-sm text-black/55">
              {quantity === 0
                ? "Open the product to add to your bag."
                : `${quantity} item${quantity === 1 ? "" : "s"} ready to checkout.`}
            </p>

            <Link
              href="/cart"
              className="mt-5 block w-full bg-black py-3.5 text-center font-display text-sm font-semibold !text-white transition hover:bg-umx-orange hover:!text-white"
            >
              View cart
            </Link>
          </div>
        </div>

        <div className="overflow-hidden border border-black/8 bg-white">
          <div className="border-b border-black/8 px-5 py-4">
            <p className="font-display text-sm font-bold tracking-[0.12em] text-black uppercase">
              Need help?
            </p>
            <p className="mt-1 font-body text-sm text-black/50">
              Support for adult customers 21+.
            </p>
          </div>

          <div className="divide-y divide-black/8">
            {(
              [
                {
                  href: "/faq",
                  title: "FAQ",
                  body: "Quick answers",
                  icon: CircleHelp,
                },
                {
                  href: "/contact",
                  title: "Order help",
                  body: "Shipping & support",
                  icon: Package,
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-black/[0.03]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-umx-orange/10 text-umx-orange transition group-hover:bg-umx-orange group-hover:text-white">
                    <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm font-bold text-black transition group-hover:text-umx-orange">
                      {item.title}
                    </span>
                    <span className="block font-body text-xs text-black/45">
                      {item.body}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-black/25 transition group-hover:translate-x-0.5 group-hover:text-umx-orange"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function ShopCatalog() {
  const { quantity, total } = useCart();
  const showPrices = useShowStorePrices();
  const compactChrome = useCompactMobileStoreChrome();

  return (
    <div
      className={`bg-white pb-[calc(8.5rem+env(safe-area-inset-bottom))] lg:pb-16 ${storeTopPadClass(compactChrome)}`}
    >
      <div className="border-b border-black/8 bg-white">
        <div className="mx-auto flex max-w-[1680px] items-end justify-between gap-4 px-4 py-8 sm:px-6 sm:py-12 lg:px-6 xl:px-8">
          <h1 className="font-display text-[clamp(2.25rem,8vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            <span className="text-umx-orange">UMAXES</span> Shop
          </h1>
          <Link
            href="/cart"
            className="mb-1 inline-flex h-12 items-center gap-2 border border-black/15 bg-white px-4 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2.1} aria-hidden />
            <span className="hidden sm:inline">Cart</span>
            {quantity > 0 && (
              <span className="bg-umx-orange px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                {quantity}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6 xl:px-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_260px] xl:gap-10">
          <article className="group overflow-hidden border border-black/8 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <Link
                href={PRODUCT_HREF}
                className="relative flex min-h-[28rem] items-center justify-center bg-[#f6f4ef] sm:min-h-[34rem] lg:min-h-[40rem]"
              >
                <Image
                  src={product.deviceImage}
                  alt={product.name}
                  width={720}
                  height={1280}
                  priority
                  className="h-[22rem] w-auto object-contain drop-shadow-[0_28px_48px_rgba(0,0,0,0.18)] transition duration-500 group-hover:scale-[1.03] sm:h-[28rem] lg:h-[34rem]"
                />
              </Link>

              <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
                <p className="font-display text-xs font-bold tracking-[0.2em] text-umx-orange uppercase">
                  {product.name} 80K
                </p>
                <Link href={PRODUCT_HREF}>
                  <h2 className="mt-3 font-display text-[clamp(2.75rem,6vw,4.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-black transition hover:text-umx-orange">
                    {product.name}
                  </h2>
                </Link>
                <p className="mt-4 max-w-md font-body text-base leading-relaxed text-black/60 sm:text-lg">
                  {product.tagline} Rated up to 80K puffs, rechargeable, with a
                  LIT Mesh coil.
                </p>

                <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {highlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.label}
                        className="inline-flex items-center gap-2.5 font-display text-sm font-semibold text-black/70"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-umx-orange/10 text-umx-orange">
                          <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                        </span>
                        {item.label}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-black/8 pt-8">
                  <div>
                    <p className="font-display text-[0.65rem] font-semibold tracking-[0.16em] text-black/40 uppercase">
                      Price
                    </p>
                    <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-black">
                      <StorePrice amount={product.price} />
                    </p>
                  </div>
                  <Link
                    href={PRODUCT_HREF}
                    className="inline-flex min-h-14 min-w-[12rem] items-center justify-center bg-black px-8 font-display text-base font-semibold !text-white transition hover:bg-umx-orange hover:!text-white"
                  >
                    View product
                  </Link>
                </div>
              </div>
            </div>
          </article>

          <ShopAside quantity={quantity} total={total} />
        </div>
      </div>

      {quantity > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-black/8 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6 lg:bottom-0 xl:hidden">
          <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4">
            <div>
              <p className="font-display text-sm font-semibold text-black">
                {quantity} {quantity === 1 ? "item" : "items"}
                {showPrices ? ` · $${total.toFixed(2)}` : ""}
              </p>
            </div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 bg-umx-orange px-5 py-3 font-display text-sm font-semibold !text-white"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={2.1} aria-hidden />
              View cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
