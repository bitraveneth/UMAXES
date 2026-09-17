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
  const { addMany, couponCode: savedCoupon, setCouponCode } = useCart();
  const showPrices = useShowStorePrices();
  const [lines, setLines] = useState<OrderLine[]>([defaultLine(flavor.id)]);
  const [draftReady, setDraftReady] = useState(false);
  const [added, setAdded] = useState(false);
  const [shot, setShot] = useState(0);
  const [couponDraft, setCouponDraft] = useState(savedCoupon);
  const [appliedCoupon, setAppliedCoupon] = useState(savedCoupon);
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const compactChrome = useCompactMobileStoreChrome();

  const gallery = useMemo(
    () => [
      { id: "product", src: flavor.image, alt: flavor.name },
      {
        id: "pack",
        src: flavor.packageImage,
        alt: `${flavor.name} package`,
      },
    ],
    [flavor],
  );

  useEffect(() => {
    setShot(0);
  }, [flavor.id]);

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

  const payable = Math.max(0, subtotal - discount);
  const activeShot = gallery[shot] ?? gallery[0];

  async function validateCoupon(code: string, amount: number) {
    const trimmed = code.trim();
    if (!trimmed) {
      setDiscount(0);
      setAppliedCoupon("");
      setCouponCode("");
      setCouponMessage("");
      return;
    }
    setCouponBusy(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, subtotal: amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscount(0);
        setAppliedCoupon("");
        setCouponCode("");
        setCouponMessage(data.error || "Invalid coupon code.");
        return;
      }
      setAppliedCoupon(data.code);
      setCouponCode(data.code);
      setDiscount(Number(data.discount) || 0);
      setCouponMessage("");
    } catch {
      setCouponMessage("Could not check that coupon.");
    } finally {
      setCouponBusy(false);
    }
  }

  useEffect(() => {
    if (!savedCoupon || !draftReady) return;
    setCouponDraft((draft) => draft || savedCoupon);
    if (!appliedCoupon) {
      void validateCoupon(savedCoupon, subtotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCoupon, draftReady]);

  useEffect(() => {
    if (!draftReady || !appliedCoupon) return;
    void validateCoupon(appliedCoupon, subtotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, draftReady, appliedCoupon]);

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
    if (appliedCoupon) setCouponCode(appliedCoupon);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  function handleBuy() {
    const next = cartLines();
    if (!next.length) return;
    flushSync(() => {
      addMany(next);
      if (appliedCoupon) setCouponCode(appliedCoupon);
    });
    router.push("/checkout");
  }

  return (
    <div
      className={`px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-20 ${storeTopPadClass(compactChrome)}`}
    >
      <div className="mx-auto max-w-[1120px]">
        <nav className="mb-4 font-display text-[0.7rem] tracking-wide text-black/55 sm:mb-6">
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

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:gap-10">
          <div>
            <div
              className="relative mx-auto aspect-square w-full max-w-[22rem] overflow-hidden rounded-2xl bg-white ring-1 ring-black/8 sm:max-w-[28rem] lg:mx-0 lg:max-w-none"
              style={{ backgroundColor: `${flavor.accent}14` }}
            >
              <Image
                src={activeShot.src}
                alt={activeShot.alt}
                fill
                priority
                className="object-contain p-4 sm:p-6"
                quality={80}
                sizes="(max-width: 1024px) 90vw, 560px"
              />
            </div>

            <div className="mt-2.5 flex gap-2">
              {gallery.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setShot(i)}
                  aria-label={`Show ${item.alt}`}
                  aria-current={i === shot}
                  className={`relative h-14 w-14 overflow-hidden rounded-lg bg-white ring-2 transition sm:h-16 sm:w-16 ${
                    i === shot
                      ? "ring-umx-orange"
                      : "ring-black/10 hover:ring-black/25"
                  }`}
                >
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/8 sm:p-5">
            <p className="font-display text-[0.65rem] font-semibold tracking-[0.16em] text-umx-orange uppercase">
              {product.name}
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h1 className="font-display text-[clamp(1.65rem,4.5vw,2.15rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-black">
                {flavor.name}
              </h1>
              <p className="font-display text-xl font-bold tracking-tight text-black">
                <StorePrice amount={flavor.price} suffix=".00" />
              </p>
            </div>
            <p className="mt-2 font-body text-sm leading-relaxed text-black/60">
              {flavor.description}
            </p>

            <div className="mt-4 border-t border-black/10 pt-3">
              <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 pb-2 sm:grid">
                <p className="font-display text-[0.62rem] font-semibold tracking-[0.12em] text-black/40 uppercase">
                  Flavor
                </p>
                <p className="w-[4.75rem] text-right font-display text-[0.62rem] font-semibold tracking-[0.12em] text-black/40 uppercase">
                  Price
                </p>
                <p className="w-[8.25rem] text-right font-display text-[0.62rem] font-semibold tracking-[0.12em] text-black/40 uppercase">
                  Qty
                </p>
              </div>

              <ul className="divide-y divide-black/8 border-y border-black/10">
                {lines.map((line) => {
                  const item = flavors.find((f) => f.id === line.flavorId) ?? flavor;
                  const options = flavors.filter(
                    (f) => f.id === line.flavorId || !usedFlavorIds.has(f.id),
                  );
                  return (
                    <li
                      key={line.key}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2.5 sm:grid-cols-[minmax(0,1fr)_4.75rem_8.25rem] sm:gap-3"
                    >
                      <label className="min-w-0">
                        <span className="sr-only">Flavor</span>
                        <div className="flex min-w-0 items-center gap-2">
                          <select
                            value={line.flavorId}
                            onChange={(e) =>
                              changeFlavor(line, e.target.value as FlavorId)
                            }
                            aria-label="Flavor"
                            className="min-w-0 flex-1 rounded-md border border-black/15 bg-white px-2.5 py-2 font-display text-sm font-semibold text-black outline-none focus:border-black"
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
                              className="shrink-0 font-display text-[0.7rem] font-semibold text-black/40 transition hover:text-black"
                              aria-label={`Remove ${item.name}`}
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </label>
                      <p className="hidden text-right font-display text-sm font-semibold text-black sm:block">
                        <StorePrice amount={item.price} />
                      </p>
                      <div className="justify-self-end">
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
                <button
                  type="button"
                  onClick={addFlavorRow}
                  className="mt-2.5 font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
                >
                  + Add flavor
                </button>
              ) : null}

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="font-display text-[0.62rem] font-semibold tracking-[0.12em] text-black/40 uppercase">
                    Total
                  </p>
                  <p className="mt-0.5 font-display text-xl font-bold text-black">
                    {showPrices ? <StorePrice amount={payable} /> : "On request"}
                  </p>
                  <p className="font-body text-xs text-black/45">
                    {totalQty} {totalQty === 1 ? "item" : "items"}
                    {showPrices && discount > 0 && appliedCoupon
                      ? ` · ${appliedCoupon} −$${discount.toFixed(2)}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <label htmlFor="product-coupon" className="sr-only">
                  Coupon code
                </label>
                <input
                  id="product-coupon"
                  value={couponDraft}
                  onChange={(e) => {
                    setCouponDraft(e.target.value.toUpperCase());
                    setCouponMessage("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void validateCoupon(couponDraft, subtotal);
                    }
                  }}
                  placeholder="Coupon code"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-md border border-black/15 bg-white px-3 py-2 font-display text-sm font-semibold uppercase tracking-wide text-black outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-black/35 focus:border-black"
                />
                <button
                  type="button"
                  onClick={() => void validateCoupon(couponDraft, subtotal)}
                  disabled={couponBusy}
                  className="shrink-0 rounded-md border border-black/20 px-3 py-2 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange disabled:opacity-50"
                >
                  {couponBusy ? "…" : "Apply"}
                </button>
              </div>
              {couponMessage ? (
                <p className="mt-1.5 font-body text-xs text-red-700">
                  {couponMessage}
                </p>
              ) : appliedCoupon && !couponMessage ? (
                <p className="mt-1.5 font-body text-xs text-black/55">
                  Applied {appliedCoupon}
                </p>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!totalQty}
                  className={`inline-flex min-h-11 items-center justify-center rounded-md px-3 font-display text-sm font-semibold tracking-wide !text-white transition duration-300 ${
                    !totalQty
                      ? "cursor-not-allowed bg-black/25"
                      : added
                        ? "bg-umx-orange"
                        : "bg-black hover:bg-umx-orange"
                  }`}
                >
                  {added ? "Added" : "Add to cart"}
                </button>
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={!totalQty}
                  className={`inline-flex min-h-11 items-center justify-center rounded-md px-3 font-display text-sm font-semibold tracking-wide transition duration-300 ${
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
