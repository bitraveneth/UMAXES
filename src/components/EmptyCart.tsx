"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { flavors, product } from "@/lib/assets";

const SUGGESTED = flavors.slice(0, 4);

type EmptyCartProps = {
  /** Compact layout for the cart drawer */
  compact?: boolean;
  onShopClick?: () => void;
};

export function EmptyCart({ compact = false, onShopClick }: EmptyCartProps) {
  if (compact) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-2 text-center">
        <div className="relative mb-5 h-28 w-28">
          <div className="absolute inset-0 rotate-6 overflow-hidden rounded-2xl bg-umx-orange/15 ring-1 ring-black/5" />
          <div className="absolute inset-0 -rotate-3 overflow-hidden rounded-2xl">
            <Image
              src={SUGGESTED[0]?.image || product.deviceImage}
              alt=""
              fill
              className="object-cover"
              sizes="112px"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-3">
              <Image
                src={product.deviceImage}
                alt=""
                fill
                className="object-contain drop-shadow-md"
                sizes="88px"
              />
            </div>
          </div>
        </div>
        <p className="font-display text-lg font-semibold text-black">
          Your bag is empty
        </p>
        <p className="mt-2 max-w-[16rem] font-body text-sm leading-relaxed text-black/60">
          Add HOOKAMAX flavors from the shop — wholesale packs ready when you
          are.
        </p>
        <Link
          href="/shop"
          onClick={onShopClick}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-umx-orange px-6 py-3 font-display text-sm font-semibold !text-white transition hover:bg-umx-orange-deep"
        >
          Browse flavors
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-white">
      <div className="relative grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[220px] overflow-hidden bg-umx-cream sm:min-h-[280px] lg:min-h-full">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,91,4,0.18),transparent_55%),radial-gradient(ellipse_at_90%_80%,rgba(61,22,5,0.08),transparent_50%)]"
          />
          <div className="absolute inset-0 flex items-end justify-center gap-3 px-6 pb-8 pt-10 sm:gap-4 sm:px-10 lg:items-center lg:pb-10">
            {SUGGESTED.slice(0, 3).map((f, i) => (
              <div
                key={f.id}
                className={`relative aspect-[3/4] w-[28%] max-w-[9.5rem] overflow-hidden rounded-2xl shadow-[0_18px_40px_rgba(61,22,5,0.18)] ring-1 ring-black/10 ${
                  i === 1
                    ? "z-[1] -translate-y-3 sm:-translate-y-5"
                    : i === 0
                      ? "translate-y-2 -rotate-6"
                      : "translate-y-2 rotate-6"
                }`}
              >
                <Image
                  src={f.image}
                  alt={f.name}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                {i === 1 ? (
                  <div className="absolute inset-x-3 bottom-3 top-[18%]">
                    <Image
                      src={product.deviceImage}
                      alt=""
                      fill
                      className="object-contain drop-shadow-lg"
                      sizes="120px"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-umx-orange-wash px-3 py-1.5 font-display text-[0.65rem] font-semibold tracking-[0.14em] text-umx-orange uppercase">
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            Empty bag
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Nothing here yet
          </h2>
          <p className="mt-3 max-w-md font-body text-[0.98rem] leading-relaxed text-black/60">
            Browse the HOOKAMAX lineup, pick your flavors, and build a wholesale
            order. Your bag will show quantities and totals here.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-umx-orange px-7 py-3.5 font-display text-sm font-semibold !text-white transition hover:bg-umx-orange-deep"
            >
              Shop flavors
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </Link>
            <Link
              href="/account/favorites"
              className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-6 py-3.5 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange"
            >
              Saved flavors
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-black/8 bg-umx-cream/50 px-6 py-7 sm:px-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-[0.65rem] font-semibold tracking-[0.16em] text-black/40 uppercase">
              Start with these
            </p>
            <p className="mt-1 font-display text-base font-semibold text-black">
              Popular flavors
            </p>
          </div>
          <Link
            href="/shop"
            className="font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
          >
            View all
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SUGGESTED.map((f) => (
            <li key={f.id}>
              <Link
                href={`/product/${f.id}`}
                className="group flex gap-3 rounded-2xl border border-black/8 bg-white p-2.5 transition hover:border-umx-orange/50 hover:shadow-[0_10px_28px_rgba(61,22,5,0.08)]"
              >
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={f.image}
                    alt=""
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="64px"
                  />
                  <span className="absolute inset-0 bg-black/10" />
                  <span className="absolute inset-1.5">
                    <Image
                      src={product.deviceImage}
                      alt=""
                      fill
                      className="object-contain drop-shadow"
                      sizes="48px"
                    />
                  </span>
                </span>
                <span className="min-w-0 flex-1 py-0.5">
                  <span className="block truncate font-display text-sm font-semibold text-black group-hover:text-umx-orange">
                    {f.name}
                  </span>
                  <span className="mt-0.5 block truncate font-body text-xs text-black/50">
                    {f.tagline}
                  </span>
                  <span className="mt-1 block font-display text-sm font-bold text-black">
                    ${f.price}.00
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
