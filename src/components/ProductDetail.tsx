"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StorePrice } from "@/components/StorePrice";
import { QtyStepper } from "@/components/QtyStepper";
import { useCart } from "@/context/CartContext";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";
import { flavors, product, PUFF_OPTIONS, type Flavor } from "@/lib/assets";

export default function ProductDetail({ flavor }: { flavor: Flavor }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const compactChrome = useCompactMobileStoreChrome();

  function handleAdd() {
    add(flavor.id, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div
      className={`px-4 pb-20 sm:px-6 sm:pb-28 ${storeTopPadClass(compactChrome)}`}
    >
      <div className="mx-auto max-w-[1200px]">
        <nav className="mb-8 font-display text-xs tracking-wide text-black/55 sm:mb-10">
          <Link href="/" className="transition hover:text-umx-orange">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="transition hover:text-umx-orange">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-black">{flavor.name}</span>
        </nav>

        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div
            className="relative aspect-square overflow-hidden rounded-[1.75rem] bg-umx-cream-warm shadow-[0_20px_50px_rgba(61,22,5,0.1)] ring-1 ring-black/5"
            style={{ backgroundColor: `${flavor.accent}18` }}
          >
            <Image
              src={flavor.image}
              alt={flavor.name}
              fill
              priority
              className="object-cover"
              quality={70}
              sizes="(max-width: 1024px) 100vw, 600px"
            />
          </div>

          <div>
            <p className="font-display text-xs font-semibold tracking-[0.16em] text-umx-orange uppercase">
              {product.name}
            </p>
            <h1 className="mt-2 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-black">
              {flavor.name}
            </h1>
            <p className="mt-3 font-display text-2xl font-semibold text-black">
              <StorePrice amount={flavor.price} suffix=".00" />
            </p>
            <p className="mt-4 max-w-md font-body text-base leading-relaxed text-black/70 sm:text-lg">
              {flavor.description}
            </p>

            {/* Product feature — display only, not a chooser */}
            <div className="mt-6">
              <p className="font-display text-sm font-bold tracking-[0.08em] text-black uppercase">
                Variants
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PUFF_OPTIONS.map((option) => (
                  <span
                    key={option}
                    className="inline-flex items-center rounded-full bg-white px-3.5 py-2 font-display text-[13px] font-semibold tracking-[0.04em] text-black ring-1 ring-black/12"
                  >
                    {option}
                    <span className="ml-1.5 font-body text-xs font-medium text-black/45">
                      puffs
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="font-display text-sm font-bold tracking-[0.08em] text-black uppercase">
                HOOKAMAX flavors
              </p>
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="list"
                aria-label="Flavors"
              >
                {flavors.map((f) => {
                  const active = f.id === flavor.id;
                  return (
                    <Link
                      key={f.id}
                      href={`/product/${f.id}`}
                      scroll={false}
                      role="listitem"
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex items-center rounded-full px-3.5 py-2 font-display text-[13px] font-semibold tracking-[0.02em] transition duration-200 ${
                        active
                          ? "bg-umx-orange text-white shadow-[0_6px_16px_rgba(255,91,4,0.28)]"
                          : "bg-white text-black ring-1 ring-black/12 hover:text-umx-orange hover:ring-umx-orange/55"
                      }`}
                    >
                      {f.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-7">
              <p className="font-display text-sm font-bold tracking-[0.08em] text-black uppercase">
                Quantity
              </p>
              <div className="mt-3 flex flex-wrap items-stretch gap-3">
                <QtyStepper
                  value={qty}
                  onChange={setQty}
                  ariaLabel="Quantity"
                />

                <button
                  type="button"
                  onClick={handleAdd}
                  className={`inline-flex h-12 min-w-[11rem] flex-1 items-center justify-center gap-2 rounded-full px-7 font-display text-sm font-semibold tracking-wide !text-white transition duration-300 sm:flex-none sm:text-base ${
                    added ? "bg-umx-orange" : "bg-black hover:bg-umx-orange"
                  }`}
                >
                  {added ? "Added to cart" : "Add to cart"}
                  <span aria-hidden className="!text-white">
                    {added ? "✓" : "→"}
                  </span>
                </button>
              </div>
              <p className="mt-2 font-body text-xs text-black/45">
                Type any amount — e.g. 100
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
