"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { flavors, product, type Flavor } from "@/lib/assets";

export default function ProductDetail({ flavor }: { flavor: Flavor }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(flavor.id, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
        <div className="px-4 pb-20 pt-[8.5rem] sm:px-6 sm:pb-28 sm:pt-[9rem]">
      <div className="mx-auto max-w-[1200px]">
        <nav className="mb-8 font-display text-xs tracking-wide text-black/50 sm:mb-10">
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
              ${flavor.price}
              <span className="text-base font-medium text-black/40">.00</span>
            </p>
            <p className="mt-4 max-w-md font-body text-base leading-relaxed text-black/70 sm:text-lg">
              {flavor.description}
            </p>

            <div className="mt-8">
              <p className="font-display text-xs font-semibold tracking-[0.12em] text-black/50 uppercase">
                Choose flavor
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5 sm:gap-3">
                {flavors.map((f) => {
                  const active = f.id === flavor.id;
                  return (
                    <Link
                      key={f.id}
                      href={`/product/${f.id}`}
                      scroll={false}
                      className={`group/thumb relative aspect-square overflow-hidden rounded-xl transition duration-300 ${
                        active
                          ? "ring-2 ring-umx-orange ring-offset-2 ring-offset-umx-cream"
                          : "ring-1 ring-black/10 hover:ring-umx-orange/60"
                      }`}
                      aria-label={f.name}
                      aria-current={active ? "page" : undefined}
                    >
                      <Image
                        src={f.image}
                        alt={f.name}
                        fill
                        className="object-cover transition duration-500 group-hover/thumb:scale-105"
                        sizes="120px"
                      />
                      {active && (
                        <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center font-display text-[0.55rem] font-semibold tracking-wide text-white uppercase">
                          Selected
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-black/15 bg-umx-cream-bright">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="flex h-12 w-11 items-center justify-center font-display text-lg text-black transition hover:text-umx-orange"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="min-w-10 text-center font-display text-sm font-semibold text-black">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className="flex h-12 w-11 items-center justify-center font-display text-lg text-black transition hover:text-umx-orange"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className={`inline-flex min-w-[11rem] flex-1 items-center justify-center gap-2 rounded-full px-7 py-3.5 font-display text-sm font-semibold tracking-wide transition duration-300 sm:flex-none sm:text-base ${
                  added
                    ? "bg-umx-orange text-white"
                    : "bg-black text-umx-cream hover:bg-umx-orange hover:text-white"
                }`}
              >
                {added ? "Added to cart" : "Add to cart"}
                <span aria-hidden>{added ? "✓" : "→"}</span>
              </button>
            </div>

            <a
              href="#key-features"
              className="mt-6 inline-flex font-display text-sm font-semibold text-black/55 transition hover:text-umx-orange"
            >
              View key features ↓
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
