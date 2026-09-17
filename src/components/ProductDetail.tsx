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

const DRAFT_KEY = "umaxes-product-order-lines";

type OrderLine = {
  key: string;
  flavorId: FlavorId;
  quantity: number;
};

function isFlavorId(id: string): id is FlavorId {
  return flavors.some((f) => f.id === id);
}

function newKey() {
  return `line-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultLine(flavorId: FlavorId): OrderLine {
  return { key: newKey(), flavorId, quantity: 1 };
}

function loadLines(fallback: FlavorId): OrderLine[] {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return [defaultLine(fallback)];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [defaultLine(fallback)];
    }
    const lines: OrderLine[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      if (!isFlavorId(String(row.flavorId))) continue;
      const quantity = Math.max(1, Math.floor(Number(row.quantity) || 1));
      lines.push({
        key: String(row.key || newKey()),
        flavorId: row.flavorId as FlavorId,
        quantity,
      });
    }
    return lines.length ? lines : [defaultLine(fallback)];
  } catch {
    return [defaultLine(fallback)];
  }
}

export default function ProductDetail({ flavor }: { flavor: Flavor }) {
  const router = useRouter();
  const { addMany } = useCart();
  const showPrices = useShowStorePrices();
  const [lines, setLines] = useState<OrderLine[]>([defaultLine(flavor.id)]);
  const [draftReady, setDraftReady] = useState(false);
  const [added, setAdded] = useState(false);
  const compactChrome = useCompactMobileStoreChrome();

  useEffect(() => {
    setLines(loadLines(flavor.id));
    setDraftReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, draftReady]);

  const usedFlavorIds = useMemo(
    () => new Set(lines.map((l) => l.flavorId)),
    [lines],
  );

  const availableExtra = flavors.find((f) => !usedFlavorIds.has(f.id));

  const totalQty = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const item = flavors.find((f) => f.id === l.flavorId);
        return sum + (item?.price ?? 0) * l.quantity;
      }, 0),
    [lines],
  );

  function updateLine(key: string, patch: Partial<OrderLine>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function changeFlavor(line: OrderLine, nextId: FlavorId) {
    updateLine(line.key, { flavorId: nextId });
    if (line.key === lines[0]?.key) {
      router.replace(`/product/${nextId}`, { scroll: false });
    }
  }

  function addFlavorRow() {
    if (!availableExtra) return;
    setLines((prev) => [...prev, defaultLine(availableExtra.id)]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  function cartLines() {
    const merged = new Map<FlavorId, number>();
    for (const line of lines) {
      merged.set(line.flavorId, (merged.get(line.flavorId) ?? 0) + line.quantity);
    }
    return [...merged.entries()].map(([flavorId, quantity]) => ({
      flavorId,
      quantity,
    }));
  }

  function handleAdd() {
    const next = cartLines();
    if (!next.length) return;
    addMany(next);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  function handleBuy() {
    const next = cartLines();
    if (!next.length) return;
    flushSync(() => {
      addMany(next);
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
          <div>
            <p className="font-display text-xs font-semibold tracking-[0.16em] text-umx-orange uppercase">
              {product.name}
            </p>
            <h1 className="mt-2 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-black">
              {flavor.name}
            </h1>

            <div
              className="relative mt-6 aspect-square overflow-hidden rounded-[1.75rem] bg-umx-cream-warm shadow-[0_20px_50px_rgba(61,22,5,0.1)] ring-1 ring-black/5"
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

            <div className="mt-5 flex flex-wrap items-start gap-4">
              <span className="relative inline-flex shrink-0 items-center bg-umx-orange py-2 pr-5 pl-6 font-display text-lg font-bold tracking-tight text-white [clip-path:polygon(12px_0,100%_0,100%_100%,12px_100%,0_50%)]">
                <span
                  aria-hidden
                  className="absolute top-1/2 left-2.5 h-2 w-2 -translate-y-1/2 rounded-full bg-white"
                />
                <StorePrice amount={flavor.price} suffix=".00" />
              </span>
              <p className="min-w-0 max-w-md flex-1 font-body text-base leading-relaxed text-black/70 sm:text-lg">
                {flavor.description}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_36px_rgba(61,22,5,0.08)] ring-1 ring-black/8">
            <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-black/8 px-5 py-3 sm:grid">
              <p className="font-display text-[0.68rem] font-semibold tracking-[0.14em] text-black/45 uppercase">
                Flavor
              </p>
              <p className="w-24 text-right font-display text-[0.68rem] font-semibold tracking-[0.14em] text-black/45 uppercase">
                Unit price
              </p>
              <p className="w-40 text-center font-display text-[0.68rem] font-semibold tracking-[0.14em] text-black/45 uppercase">
                Quantity
              </p>
            </div>

            <ul>
              {lines.map((line) => {
                const item = flavors.find((f) => f.id === line.flavorId) ?? flavor;
                const options = flavors.filter(
                  (f) => f.id === line.flavorId || !usedFlavorIds.has(f.id),
                );
                return (
                  <li
                    key={line.key}
                    className="border-b border-black/6 px-4 py-4 last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3 sm:px-5 sm:py-3.5"
                  >
                    <label className="block">
                      <span className="mb-1.5 block font-display text-[0.68rem] font-semibold tracking-[0.14em] text-black/45 uppercase sm:sr-only">
                        Flavor
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          value={line.flavorId}
                          onChange={(e) =>
                            changeFlavor(line, e.target.value as FlavorId)
                          }
                          aria-label="Flavor"
                          className="min-w-0 flex-1 rounded-full border border-black/15 bg-white px-3.5 py-2.5 font-display text-sm font-semibold text-black outline-none focus:border-black"
                        >
                          {options.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                        {lines.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="font-display text-xs font-semibold text-black/45 transition hover:text-black"
                            aria-label={`Remove ${item.name}`}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </label>
                    <p className="mt-3 flex items-center justify-between sm:mt-0 sm:block sm:w-24 sm:text-right">
                      <span className="font-display text-[0.68rem] font-semibold tracking-[0.14em] text-black/45 uppercase sm:hidden">
                        Unit price
                      </span>
                      <span className="font-display text-sm font-semibold text-black">
                        <StorePrice amount={item.price} />
                      </span>
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 sm:mt-0 sm:w-40 sm:justify-end">
                      <span className="font-display text-[0.68rem] font-semibold tracking-[0.14em] text-black/45 uppercase sm:hidden">
                        Quantity
                      </span>
                      <QtyStepper
                        value={line.quantity}
                        onChange={(next) =>
                          updateLine(line.key, {
                            quantity: Math.max(1, next),
                          })
                        }
                        min={1}
                        size="sm"
                        ariaLabel={`${item.name} quantity`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            {availableExtra ? (
              <div className="border-t border-black/8 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={addFlavorRow}
                  className="font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
                >
                  + Add another flavor
                </button>
              </div>
            ) : null}

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
                  {showPrices ? <StorePrice amount={subtotal} /> : "On request"}
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
  );
}
