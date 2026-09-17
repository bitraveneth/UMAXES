"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { QtyStepper } from "@/components/QtyStepper";
import { StorePrice, useShowStorePrices } from "@/components/StorePrice";
import { useCart } from "@/context/CartContext";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";
import { flavors, product, type Flavor, type FlavorId } from "@/lib/assets";

const DRAFT_KEY = "umaxes-product-draft-qty";

function emptyQty(): Record<FlavorId, number> {
  return Object.fromEntries(flavors.map((f) => [f.id, 0])) as Record<
    FlavorId,
    number
  >;
}

function loadDraft(): Record<FlavorId, number> {
  const base = emptyQty();
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const f of flavors) {
      const n = Number(parsed[f.id]);
      if (Number.isFinite(n) && n > 0) base[f.id] = Math.floor(n);
    }
  } catch {
    /* ignore */
  }
  return base;
}

export default function ProductDetail({ flavor }: { flavor: Flavor }) {
  const router = useRouter();
  const { addMany } = useCart();
  const showPrices = useShowStorePrices();
  const [qty, setQty] = useState<Record<FlavorId, number>>(emptyQty);
  const [added, setAdded] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const compactChrome = useCompactMobileStoreChrome();

  useEffect(() => {
    setQty(loadDraft());
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(qty));
    } catch {
      /* ignore */
    }
  }, [qty, draftReady]);

  const lines = useMemo(
    () =>
      flavors
        .filter((f) => (qty[f.id] ?? 0) > 0)
        .map((f) => ({ flavorId: f.id, quantity: qty[f.id] })),
    [qty],
  );

  const totalQty = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );
  const totalAmount = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const item = flavors.find((f) => f.id === l.flavorId);
        return sum + (item?.price ?? 0) * l.quantity;
      }, 0),
    [lines],
  );

  function setFlavorQty(id: FlavorId, next: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(next)) }));
  }

  function handleAdd() {
    if (!lines.length) return;
    addMany(lines);
    setAdded(true);
    setQty(emptyQty());
    window.setTimeout(() => setAdded(false), 1200);
  }

  function handleBuy() {
    if (!lines.length) return;
    flushSync(() => {
      addMany(lines);
      setQty(emptyQty());
    });
    router.push("/checkout");
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

            <div className="mt-6">
              <p className="font-display text-sm font-bold tracking-[0.08em] text-black uppercase">
                Coupons
              </p>
              <Link
                href="/faq#coupons"
                className="mt-2 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
              >
                View coupon offers
                <span aria-hidden>→</span>
              </Link>
              <p className="mt-1.5 font-body text-xs leading-relaxed text-black/50">
                Larger order quantities can qualify for a coupon.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_36px_rgba(61,22,5,0.08)] ring-1 ring-black/8">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-black/8 px-4 py-3 sm:px-5">
                <p className="font-display text-[0.68rem] font-semibold tracking-[0.14em] text-black/45 uppercase">
                  Flavor
                </p>
                <p className="w-[4.75rem] text-right font-display text-[0.68rem] font-semibold tracking-[0.14em] text-black/45 uppercase sm:w-24">
                  Unit price
                </p>
                <p className="w-[8.5rem] text-center font-display text-[0.68rem] font-semibold tracking-[0.14em] text-black/45 uppercase sm:w-40">
                  Quantity
                </p>
              </div>

              <ul>
                {flavors.map((f) => {
                  const active = f.id === flavor.id;
                  return (
                    <li
                      key={f.id}
                      className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-black/6 px-4 py-2.5 last:border-b-0 sm:px-5 ${
                        active ? "bg-umx-cream/70" : "bg-white"
                      }`}
                    >
                      <Link
                        href={`/product/${f.id}`}
                        scroll={false}
                        aria-current={active ? "page" : undefined}
                        className={`min-w-0 truncate font-display text-[13px] font-semibold tracking-[0.02em] transition ${
                          active
                            ? "text-black"
                            : "text-black/70 hover:text-umx-orange"
                        }`}
                      >
                        {f.name}
                      </Link>
                      <p className="w-[4.75rem] text-right font-display text-sm font-semibold text-black sm:w-24">
                        <StorePrice amount={f.price} />
                      </p>
                      <div className="flex w-[8.5rem] justify-end sm:w-40">
                        <QtyStepper
                          value={qty[f.id] ?? 0}
                          onChange={(next) => setFlavorQty(f.id, next)}
                          min={0}
                          allowRemove
                          size="sm"
                          ariaLabel={`${f.name} quantity`}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-col gap-4 border-t border-black/8 bg-umx-cream/40 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                <div>
                  <p className="font-display text-xs font-semibold tracking-[0.12em] text-black/45 uppercase">
                    Total quantity
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-black">
                    {totalQty}
                  </p>
                  <p className="mt-3 font-display text-xs font-semibold tracking-[0.12em] text-black/45 uppercase">
                    Total amount
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-black">
                    {showPrices ? (
                      <StorePrice amount={totalAmount} />
                    ) : (
                      "On request"
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:min-w-[12.5rem]">
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!totalQty}
                    className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 font-display text-sm font-semibold tracking-wide !text-white transition duration-300 sm:text-base ${
                      !totalQty
                        ? "cursor-not-allowed bg-black/25"
                        : added
                          ? "bg-umx-orange"
                          : "bg-black hover:bg-umx-orange"
                    }`}
                  >
                    {added ? "Added to cart" : "Add to cart"}
                    <span aria-hidden className="!text-white">
                      {added ? "✓" : "→"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={!totalQty}
                    className={`inline-flex h-12 items-center justify-center rounded-full px-7 font-display text-sm font-semibold tracking-wide transition duration-300 sm:text-base ${
                      !totalQty
                        ? "cursor-not-allowed border border-black/15 text-black/30"
                        : "border border-black bg-white text-black hover:border-umx-orange hover:text-umx-orange"
                    }`}
                  >
                    Buy it
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
