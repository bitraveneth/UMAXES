"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BatteryCharging,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Grid3x3,
  Package,
  ShoppingBag,
  Sparkles,
  Usb,
  Wind,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";
import { DualStorePrice, StorePrice, useShowStorePrices } from "@/components/StorePrice";
import { useCatalogPrices } from "@/context/CatalogPricesContext";
import { flavors, product } from "@/lib/assets";
import { PACK_COPY, formatCases } from "@/lib/pack";

const PRODUCT_HREF = `/product/${flavors[0].id}`;

/** Five flavor photos for the shop card carousel — still one product. */
const SHOP_SLIDES = [
  flavors[0], // Peach Mango
  flavors[1], // Watermelon Ice
  flavors[4], // Miami Sunset
  flavors[5], // Cool Mint
  flavors[6], // Blue Razz Ice
] as const;

const SLIDE_MS = 4200;

const highlights = [
  { label: "~80,000 puffs", icon: Wind },
  { label: "1600mAh rechargeable", icon: BatteryCharging },
  { label: "MaxCore™ mesh coil", icon: Grid3x3 },
  { label: "USB Type-C", icon: Usb },
] as const;

function ShopFlavorCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const count = SHOP_SLIDES.length;

  const go = useCallback((next: number) => {
    setIndex(((next % count) + count) % count);
  }, [count]);

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => go(index + 1), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, go]);

  function onPointerDown(e: React.PointerEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    tracking.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!tracking.current) return;
    tracking.current = false;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? index + 1 : index - 1);
  }

  return (
    <div
      className="relative h-full min-h-[28rem] overflow-hidden bg-black sm:min-h-[34rem] lg:min-h-[40rem]"
      aria-roledescription="carousel"
      aria-label="HOOKAMAX photos"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        tracking.current = false;
      }}
    >
      {SHOP_SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? "z-[1] opacity-100" : "z-0 opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <Link
            href={PRODUCT_HREF}
            className="absolute inset-0"
            tabIndex={i === index ? 0 : -1}
          >
            <Image
              src={slide.image}
              alt={`${product.name} — ${slide.name}`}
              fill
              priority={i === 0}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center"
            />
          </Link>
        </div>
      ))}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-24 bg-gradient-to-t from-black/50 to-transparent"
      />

      <button
        type="button"
        aria-label="Previous photo"
        onClick={() => go(index - 1)}
        className="absolute top-1/2 left-3 z-[3] flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/90 text-black shadow-sm transition hover:bg-umx-orange hover:text-white sm:left-4"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.1} aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Next photo"
        onClick={() => go(index + 1)}
        className="absolute top-1/2 right-3 z-[3] flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/90 text-black shadow-sm transition hover:bg-umx-orange hover:text-white sm:right-4"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2.1} aria-hidden />
      </button>

      <div className="absolute inset-x-0 bottom-4 z-[3] flex justify-center gap-2 px-4">
        {SHOP_SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Show photo ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={`relative h-14 w-14 overflow-hidden ring-2 transition sm:h-16 sm:w-16 ${
              i === index
                ? "ring-umx-orange"
                : "ring-white/80 hover:ring-white"
            }`}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ComingSoonCard() {
  return (
    <article
      aria-label="Coming soon"
      className="overflow-hidden border border-black/8 bg-white"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="relative min-h-[22rem] overflow-hidden bg-black sm:min-h-[26rem] lg:min-h-[28rem]">
          <Image
            src={flavors[9].image}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="scale-110 object-cover object-center blur-xl"
            aria-hidden
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-white/35 backdrop-blur-[2px]"
          />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <span className="inline-flex items-center gap-2 bg-black px-5 py-3 font-display text-sm font-bold tracking-[0.18em] text-white uppercase">
              <Sparkles className="h-4 w-4 text-umx-orange" strokeWidth={2.2} aria-hidden />
              Coming soon
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
          <p className="font-display text-xs font-bold tracking-[0.2em] text-black/35 uppercase">
            Next drop
          </p>
          <h2 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-black/35">
            Coming soon
          </h2>
          <p className="mt-4 max-w-md font-body text-base leading-relaxed text-black/40 sm:text-lg">
            New UMAXES products will land here. This slot is ready for the next
            device.
          </p>
          <div className="mt-10 border-t border-black/8 pt-8">
            <span className="inline-flex min-h-14 min-w-[12rem] items-center justify-center border border-black/15 bg-black/[0.04] px-8 font-display text-base font-semibold text-black/35">
              Not available yet
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ShopAside({
  cases,
  total,
}: {
  cases: number;
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
              {cases > 0 && (
                <span className="bg-black px-2 py-0.5 font-display text-xs font-bold text-white">
                  {cases}
                </span>
              )}
            </div>
          </div>

          <div className="px-5 py-5">
            <p className="font-display text-[0.65rem] font-semibold tracking-[0.16em] text-black/40 uppercase">
              Subtotal
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-black">
              {showPrices ? <StorePrice amount={total} /> : "On request"}
            </p>
            <p className="mt-2 font-body text-sm text-black/55">
              {cases === 0
                ? "Open the product to add to your bag."
                : `${formatCases(cases)} ready to checkout.`}
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
  const { quantity, cases, total } = useCart();
  const showPrices = useShowStorePrices();
  const { unitPriceFor } = useCatalogPrices();
  const compactChrome = useCompactMobileStoreChrome();
  const unitPrice = unitPriceFor(flavors[0].id);

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
                {cases}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6 xl:px-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_260px] xl:gap-10">
          <div className="space-y-8">
          <article className="overflow-hidden border border-black/8 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <ShopFlavorCarousel />

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
                  MaxCore™ mesh coil.
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
                    <div className="mt-1">
                      <DualStorePrice
                        amount={unitPrice}
                        className="font-display text-4xl font-extrabold tracking-tight text-black"
                      />
                    </div>
                    <p className="mt-2 max-w-xs font-body text-sm text-black/50">
                      {PACK_COPY}
                    </p>
                    <p className="mt-2 max-w-xs font-body text-sm text-black/50">
                      {PACK_COPY}
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
          <ComingSoonCard />
          </div>

          <ShopAside cases={cases} total={total} />
        </div>
      </div>

      {quantity > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-black/8 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6 lg:bottom-0 xl:hidden">
          <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4">
            <div>
              <p className="font-display text-sm font-semibold text-black">
                {formatCases(cases)}
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
