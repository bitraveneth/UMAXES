"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Trash2 } from "lucide-react";
import { CaseQtyStepper, PackNote } from "@/components/QtyStepper";
import { PCS_PER_CASE, casesFromPcs, formatPack, snapToCasePcs } from "@/lib/pack";
import { DualStorePrice, StorePrice, useShowStorePrices } from "@/components/StorePrice";
import { useCart } from "@/context/CartContext";
import { useCatalogPrices } from "@/context/CatalogPricesContext";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";
import { flavors, product, type Flavor, type FlavorId } from "@/lib/assets";
import {
  TEST_STATION_PER_CASE_COPY,
  formatTestStationLine,
} from "@/lib/test-station";

const DRAFT_KEY = "umaxes-product-order-lines-v3";

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
  return { key: newKey(), flavorId, quantity: PCS_PER_CASE };
}

/** All catalog flavors as line items, with the current product flavor first. */
function defaultLines(preferred: FlavorId): OrderLine[] {
  const head = flavors.filter((f) => f.id === preferred);
  const tail = flavors.filter((f) => f.id !== preferred);
  return [...head, ...tail].map((f) => ({
    key: `line-${f.id}`,
    flavorId: f.id,
    quantity: PCS_PER_CASE,
  }));
}

function loadLines(fallback: FlavorId): OrderLine[] {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return defaultLines(fallback);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultLines(fallback);
    }
    const lines: OrderLine[] = [];
    const seen = new Set<FlavorId>();
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      if (!isFlavorId(String(row.flavorId))) continue;
      const flavorId = row.flavorId as FlavorId;
      if (seen.has(flavorId)) continue;
      seen.add(flavorId);
      const quantity = snapToCasePcs(Number(row.quantity) || PCS_PER_CASE);
      lines.push({
        key: String(row.key || newKey()),
        flavorId,
        quantity,
      });
    }
    return lines.length ? lines : defaultLines(fallback);
  } catch {
    return defaultLines(fallback);
  }
}

export default function ProductDetail({ flavor }: { flavor: Flavor }) {
  const router = useRouter();
  const { addMany, couponCode: savedCoupon, setCouponCode } = useCart();
  const showPrices = useShowStorePrices();
  const { hideCoupon, unitPriceFor, testStationsPerCase } = useCatalogPrices();
  const [lines, setLines] = useState<OrderLine[]>(() => defaultLines(flavor.id));
  const [draftReady, setDraftReady] = useState(false);
  const [added, setAdded] = useState(false);
  const [shot, setShot] = useState(0);
  const [couponDraft, setCouponDraft] = useState(savedCoupon);
  const [appliedCoupon, setAppliedCoupon] = useState(savedCoupon);
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const compactChrome = useCompactMobileStoreChrome();

  const unitPrice = unitPriceFor(flavor.id);

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
      lines.reduce((sum, l) => sum + unitPriceFor(l.flavorId) * l.quantity, 0),
    [lines, unitPriceFor],
  );
  const payable = Math.max(0, subtotal - discount);
  const orderCases = casesFromPcs(totalQty);
  const stationQty = orderCases * testStationsPerCase;
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
    if (hideCoupon) return;
    if (!savedCoupon || !draftReady) return;
    setCouponDraft((draft) => draft || savedCoupon);
    if (!appliedCoupon) {
      void validateCoupon(savedCoupon, subtotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCoupon, draftReady]);

  useEffect(() => {
    if (hideCoupon) return;
    if (!draftReady || !appliedCoupon) return;
    void validateCoupon(appliedCoupon, subtotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, draftReady, appliedCoupon]);

  function updateLine(key: string, patch: Partial<OrderLine>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((line) => line.key !== key));
  }

  function addFlavorRow() {
    if (!availableExtra) return;
    setLines((prev) => [...prev, defaultLine(availableExtra.id)]);
  }

  function cartLines() {
    const merged = new Map<FlavorId, number>();
    for (const line of lines) {
      if (line.quantity <= 0) continue;
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
      <div className="mx-auto max-w-[1280px]">
        <nav className="mb-5 font-display text-xs tracking-wide text-black/55 sm:mb-7">
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

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,40rem)] lg:gap-12">
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

          <div className="min-w-0 rounded-[1.35rem] bg-white p-4 ring-1 ring-black/8 sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <h1 className="order-2 min-w-0 font-display text-[1.65rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-black text-balance sm:order-none sm:text-[clamp(1.85rem,3.6vw,2.75rem)] sm:leading-[1.08]">
                {flavor.name}
              </h1>
              <span className="order-1 self-end shrink-0 rounded-full bg-[#1b4f72] px-3 py-1 font-display text-[0.68rem] font-bold tracking-[0.14em] text-white uppercase sm:order-none sm:mt-1 sm:self-auto">
                {product.name}
              </span>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <DualStorePrice
                amount={unitPrice}
                className="font-display text-[1.75rem] font-bold tracking-tight text-black sm:text-4xl"
              />
            </div>
            <PackNote className="mt-4" />

            {hideCoupon ? (
              <p className="mt-4 font-body text-sm text-black/60">
                Channel rebate and test stations apply automatically at checkout. No coupon code.
              </p>
            ) : (
              <div className="mt-4">
                <label
                  htmlFor="product-coupon"
                  className="font-display text-sm font-bold text-black"
                >
                  Coupon code
                </label>
                <div className="mt-2 flex gap-2">
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
                    placeholder="Enter code"
                    autoComplete="off"
                    className="min-w-0 flex-1 rounded-lg border border-black/25 bg-white px-3 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-black outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-black/45 focus:border-black sm:px-3.5"
                  />
                  <button
                    type="button"
                    onClick={() => void validateCoupon(couponDraft, subtotal)}
                    disabled={couponBusy}
                    className="shrink-0 rounded-lg border border-black px-3 py-2.5 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange disabled:opacity-50 sm:px-4"
                  >
                    {couponBusy ? "…" : "Apply"}
                  </button>
                </div>
                {couponMessage ? (
                  <p className="mt-2 font-body text-sm text-red-700">
                    {couponMessage}
                  </p>
                ) : appliedCoupon && !couponMessage ? (
                  <p className="mt-2 font-body text-sm text-black/55">
                    Applied {appliedCoupon}
                  </p>
                ) : null}
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-black/10">
              <div className="hidden grid-cols-[minmax(0,1fr)_6.5rem_8.75rem_2.75rem] items-center gap-4 bg-[#eef3f7] px-4 py-3 sm:grid">
                <p className="font-display text-sm font-bold text-black">
                  Flavor
                </p>
                <p className="text-right font-display text-sm font-bold text-black">
                  Price / pc
                </p>
                <p className="text-center font-display text-sm font-bold text-black">
                  Cases
                </p>
                <span className="sr-only">Remove</span>
              </div>

              {lines.length === 0 ? (
                <p className="px-4 py-6 font-body text-sm text-black/55">
                  No flavors on this order. Add one below.
                </p>
              ) : (
                <ul className="divide-y divide-black/8">
                  {lines.map((line) => {
                    const item =
                      flavors.find((f) => f.id === line.flavorId) ?? flavor;
                    return (
                      <li
                        key={line.key}
                        className="grid grid-cols-1 gap-3 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_6.5rem_8.75rem_2.75rem] sm:items-center sm:gap-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-black/5 ring-1 ring-black/8">
                            <Image
                              src={item.image}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-sm font-semibold text-black">
                              {item.name}
                            </p>
                            <p className="mt-0.5 font-display text-sm font-semibold text-black sm:hidden">
                              <StorePrice amount={unitPriceFor(item.id)} />
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${item.name}`}
                            onClick={() => removeLine(line.key)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black/40 transition hover:bg-umx-orange/10 hover:text-umx-orange sm:hidden"
                          >
                            <Trash2
                              className="h-4 w-4"
                              strokeWidth={2.1}
                              aria-hidden
                            />
                          </button>
                        </div>
                        <p className="hidden font-display text-sm font-semibold text-black sm:block sm:text-right">
                          <StorePrice amount={unitPriceFor(item.id)} />
                        </p>
                        <div className="min-w-0">
                          <p className="mb-1.5 text-center font-display text-sm font-bold text-black sm:hidden">
                            Cases
                          </p>
                          <CaseQtyStepper
                            pcs={line.quantity}
                            onChangePcs={(next) =>
                              updateLine(line.key, {
                                quantity: snapToCasePcs(next),
                              })
                            }
                            allowZero
                            showPcs
                            size="sm"
                            align="center"
                            ariaLabel={`${item.name} cases`}
                          />
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeLine(line.key)}
                          className="hidden h-9 w-9 shrink-0 items-center justify-center justify-self-center rounded-lg text-black/40 transition hover:bg-umx-orange/10 hover:text-umx-orange sm:flex"
                        >
                          <Trash2
                            className="h-4 w-4"
                            strokeWidth={2.1}
                            aria-hidden
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

              {availableExtra ? (
                <button
                  type="button"
                  onClick={addFlavorRow}
                  className="mt-3 font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
                >
                  + Add another flavor
                </button>
              ) : null}

              <div className="mt-6 rounded-2xl bg-[#eef3f7] px-4 py-4 sm:px-5 sm:py-5">
                <p className="font-display text-[0.7rem] font-semibold tracking-[0.16em] text-black/45 uppercase">
                  Order size
                </p>
                <p className="mt-1.5 font-display text-[1.65rem] font-extrabold leading-none tracking-[-0.04em] text-black tabular-nums sm:text-[2.15rem]">
                  {formatPack(totalQty)}
                </p>
                {testStationsPerCase > 0 ? (
                  <div className="mt-3 border-t border-black/8 pt-3">
                    <p className="font-display text-[0.7rem] font-semibold tracking-[0.16em] text-black/45 uppercase">
                      Test stations
                    </p>
                    <p className="mt-1 font-display text-lg font-bold tracking-tight text-black">
                      {stationQty > 0
                        ? formatTestStationLine(stationQty)
                        : "Add a case to include a test station"}
                    </p>
                    <p className="mt-1 font-body text-sm text-black/55">
                      {TEST_STATION_PER_CASE_COPY}. Free with this order — taken
                      from Test Station stock.
                    </p>
                  </div>
                ) : null}
                <p className="mt-3 font-display text-2xl font-bold tracking-tight text-black sm:text-3xl">
                  {showPrices ? <StorePrice amount={payable} /> : "On request"}
                </p>
                {showPrices && discount > 0 && appliedCoupon ? (
                  <p className="mt-1.5 font-body text-sm text-black/50">
                    {appliedCoupon} −${discount.toFixed(2)}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!totalQty}
                  className={`inline-flex min-h-12 items-center justify-center rounded-lg px-3 font-display text-sm font-semibold tracking-wide !text-white transition duration-300 sm:px-4 ${
                    !totalQty
                      ? "cursor-not-allowed bg-black/25"
                      : added
                        ? "bg-[#1b4f72]"
                        : "bg-black hover:-translate-y-0.5 hover:bg-[#1b4f72] hover:shadow-[0_10px_22px_rgba(27,79,114,0.28)]"
                  }`}
                >
                  {added ? "Added" : "Add to cart"}
                </button>
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={!totalQty}
                  className={`inline-flex min-h-12 items-center justify-center rounded-lg px-3 font-display text-sm font-semibold tracking-wide transition duration-300 sm:px-4 ${
                    !totalQty
                      ? "cursor-not-allowed border border-black/15 text-black/30"
                      : "border border-black bg-white text-black hover:-translate-y-0.5 hover:border-[#1b4f72] hover:bg-[#1b4f72] hover:!text-white hover:shadow-[0_10px_22px_rgba(27,79,114,0.28)]"
                  }`}
                >
                  Buy now
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
