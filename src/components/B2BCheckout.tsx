"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { getFlavor } from "@/lib/assets";

type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type CatalogProduct = {
  sku: string;
  name: string;
  unitPrice: number;
  moq: number;
  image: string | null;
};

type PayMethod = "TT" | "CHECK" | "ONLINE" | "CREDIT";

export default function B2BCheckout() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, clear, quantity } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [creditAllowed, setCreditAllowed] = useState(false);
  const [canPlaceOrder, setCanPlaceOrder] = useState(true);
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("TT");
  const [paymentRef, setPaymentRef] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [notes, setNotes] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [doneOrderId, setDoneOrderId] = useState<string | null>(null);
  const [piNumber, setPiNumber] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.status === "PENDING") {
      router.replace("/account/pending");
      return;
    }
    Promise.all([
      fetch("/api/addresses").then((r) => r.json()),
      fetch("/api/catalog").then((r) => r.json()),
    ]).then(([addr, cat]) => {
      if (addr.addresses) {
        setAddresses(addr.addresses);
        const def =
          addr.addresses.find((a: Address) => a.isDefault) || addr.addresses[0];
        if (def) setAddressId(def.id);
      }
      if (cat.products) setCatalog(cat.products);
    });
  }, [status, session, router]);

  const priceMap = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    for (const p of catalog) map.set(p.sku, p);
    return map;
  }, [catalog]);

  const lines = items.map((item) => {
    const flavor = getFlavor(item.flavorId);
    const priced = priceMap.get(item.flavorId);
    return {
      sku: item.flavorId,
      quantity: item.quantity,
      name: priced?.name || flavor?.name || item.flavorId,
      image: priced?.image || flavor?.image || null,
      unitPrice: priced?.unitPrice ?? flavor?.price ?? 0,
      moq: priced?.moq ?? 1,
    };
  });

  const subtotal = lines.reduce(
    (sum, l) => sum + l.unitPrice * l.quantity,
    0,
  );
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  async function applyCoupon() {
    setError(null);
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDiscount(0);
      setAppliedCoupon("");
      setError(data.error || "Coupon failed");
      return;
    }
    setDiscount(data.discount);
    setAppliedCoupon(data.code);
  }

  async function placeOrder() {
    setError(null);
    if (!ageConfirmed) {
      setError("Confirm you are 21+ to place this order.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId,
        paymentMethod,
        paymentRef,
        couponCode: appliedCoupon || undefined,
        notes,
        items: lines.map((l) => ({ sku: l.sku, quantity: l.quantity })),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not place order");
      return;
    }
    clear();
    setDoneOrderId(data.order.id);
    setPiNumber(data.order.piNumber);
  }

  if (status === "loading") {
    return <p className="py-20 text-center font-body">Loading checkout…</p>;
  }

  if (doneOrderId) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-display text-xs font-semibold tracking-[0.18em] text-umx-orange uppercase">
          Order placed
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold">Thank you</h1>
        <p className="mt-3 font-body text-black/65">
          Your wholesale order is recorded
          {piNumber ? ` · ${piNumber}` : ""}.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={`/api/orders/${doneOrderId}/pi`}
            className="border border-black bg-black px-5 py-3 font-display text-sm font-semibold text-umx-cream"
          >
            Download PI
          </a>
          <Link
            href="/account/orders"
            className="border border-black/20 px-5 py-3 font-display text-sm font-semibold"
          >
            View orders
          </Link>
        </div>
      </div>
    );
  }

  if (!quantity) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Cart is empty</h1>
        <Link href="/shop" className="mt-6 inline-block text-umx-orange">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-8">
        <section className="border border-black/10 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Shipping address</h2>
            <Link href="/account/addresses" className="text-sm text-umx-orange">
              Manage
            </Link>
          </div>
          {addresses.length === 0 ? (
            <p className="mt-4 font-body text-sm text-black/60">
              Add an address first (max 5).{" "}
              <Link href="/account/addresses" className="text-umx-orange">
                Add address
              </Link>
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer gap-3 border p-4 ${
                    addressId === a.id
                      ? "border-umx-orange bg-umx-orange-wash/40"
                      : "border-black/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={addressId === a.id}
                    onChange={() => setAddressId(a.id)}
                  />
                  <span className="font-body text-sm">
                    {a.label ? <strong>{a.label} · </strong> : null}
                    {a.line1}, {a.city} {a.postalCode}, {a.country}
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="border border-black/10 bg-white p-6">
          <h2 className="font-display text-lg font-semibold">Payment</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["TT", "Telegraphic transfer"],
                ["CHECK", "Check"],
                ["CREDIT", "Credit (1–30 days)"],
                ["ONLINE", "Online (gateway later)"],
              ] as const
            ).map(([id, label]) => (
              <label
                key={id}
                className={`flex cursor-pointer gap-3 border p-4 ${
                  paymentMethod === id
                    ? "border-umx-orange bg-umx-orange-wash/40"
                    : "border-black/10"
                }`}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === id}
                  onChange={() => setPaymentMethod(id)}
                />
                <span className="font-display text-sm font-semibold">{label}</span>
              </label>
            ))}
          </div>
          {paymentMethod === "ONLINE" && (
            <p className="mt-3 font-body text-xs text-black/55">
              Stripe/online gateway is not configured yet. Order will be saved as
              payment pending until the gateway is connected later.
            </p>
          )}
          <label className="mt-4 block">
            <span className="font-display text-sm font-semibold">
              Payment reference (optional)
            </span>
            <input
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="mt-2 w-full border border-black/15 px-4 py-3"
              placeholder="TT ref / check number"
            />
          </label>
        </section>

        <section className="border border-black/10 bg-white p-6">
          <h2 className="font-display text-lg font-semibold">Coupon</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1 border border-black/15 px-4 py-3"
              placeholder="UMAXES10"
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="border border-black px-4 font-display text-sm font-semibold"
            >
              Apply
            </button>
          </div>
          {appliedCoupon && (
            <p className="mt-2 font-body text-sm text-umx-orange">
              Applied {appliedCoupon} (−${discount.toFixed(2)})
            </p>
          )}
          <label className="mt-4 block">
            <span className="font-display text-sm font-semibold">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full border border-black/15 px-4 py-3"
              rows={3}
            />
          </label>
        </section>
      </div>

      <aside className="h-fit border border-black/10 bg-white p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-lg font-semibold">Order summary</h2>
        <ul className="mt-4 space-y-4">
          {lines.map((l) => (
            <li key={l.sku} className="flex gap-3">
              {l.image && (
                <div className="relative h-16 w-16 shrink-0 bg-umx-cream">
                  <Image src={l.image} alt="" fill className="object-contain p-1" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold">{l.name}</p>
                <p className="font-body text-xs text-black/55">
                  Qty {l.quantity}
                  {l.quantity < l.moq ? ` · MOQ ${l.moq}` : ""}
                </p>
                <p className="font-display text-sm">
                  ${(l.unitPrice * l.quantity).toFixed(2)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-2 border-t border-black/10 pt-4 font-body text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>−${discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-display text-base font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-4 font-body text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <label className="mt-4 flex items-start gap-2 font-body text-sm text-black/70">
          <input
            type="checkbox"
            className="mt-1"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
          />
          <span>
            I confirm the buyer and recipients are adults 21+. Nicotine is an
            addictive chemical.
          </span>
        </label>

        <button
          type="button"
          disabled={loading || !addressId || !ageConfirmed}
          onClick={placeOrder}
          className="mt-6 hidden w-full border border-black bg-black py-3.5 font-display text-sm font-semibold text-umx-cream transition hover:border-umx-orange hover:bg-umx-orange disabled:opacity-50 lg:block"
        >
          {loading ? "Placing order…" : "Place wholesale order"}
        </button>
      </aside>

      {/* Mobile sticky total + place order (above bottom nav) */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-body text-xs text-black/55">Total</p>
            <p className="font-display text-lg font-bold tracking-tight text-black">
              ${total.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            disabled={loading || !addressId || !ageConfirmed}
            onClick={placeOrder}
            className="shrink-0 border border-black bg-black px-5 py-3.5 font-display text-sm font-semibold text-umx-cream transition hover:border-umx-orange hover:bg-umx-orange disabled:opacity-50"
          >
            {loading ? "Placing…" : "Place order"}
          </button>
        </div>
        {error ? (
          <p className="mx-auto mt-2 max-w-6xl font-body text-xs text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
