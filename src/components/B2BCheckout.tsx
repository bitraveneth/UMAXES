"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getFlavor } from "@/lib/assets";
import { CASE_MOQ_PCS, casesFromPcs, formatCases } from "@/lib/pack";
import { StorePrice, useShowStorePrices } from "@/components/StorePrice";
import {
  TEST_STATION_NAME,
  TEST_STATION_PER_CASE_COPY,
  formatTestStationLine,
} from "@/lib/test-station";
import {
  EMPTY_ADDRESS_FORM,
  ShippingAddressForm,
  confirmDeleteAddress,
  deleteAddress,
  formFromAddress,
  saveAddress,
  type AddressFormValues,
  type ShippingAddress,
} from "@/components/ShippingAddressForm";

type Address = ShippingAddress;

type CatalogProduct = {
  sku: string;
  name: string;
  unitPrice: number;
  retailPrice: number;
  moq: number;
  image: string | null;
};

type PayMethod = "TT" | "CREDIT";

type CreditInfo = {
  allowed: boolean;
};

type ChannelQuote = {
  eligible: boolean;
  hideCoupon: boolean;
  isFirstOrder: boolean;
  sellingQty: number;
  cases: number;
  pcsPerCase?: number;
  testStationsPerCase?: number;
  testStationQty: number;
  firstOrderUnpaidPcs: number;
  firstOrderDiscountUsd: number;
  rebateBalanceUsd: number;
  rebateAppliedUsd: number;
  chargedQty: number;
  monthPaidQty: number;
  monthProjectedRate: number;
  nextTierQty: number | null;
  nextTierRate: number | null;
};

export default function B2BCheckout() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const showPrices = useShowStorePrices();
  const { items, clear, quantity, cases } = useCart();
  const canManageAddresses = session?.user?.companyRole !== "FINANCE";

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [credit, setCredit] = useState<CreditInfo>({
    allowed: false,
  });
  const [channel, setChannel] = useState<ChannelQuote | null>(null);
  const [creditReady, setCreditReady] = useState(false);
  const [canPlaceOrder, setCanPlaceOrder] = useState(true);
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("TT");
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [doneOrderId, setDoneOrderId] = useState<string | null>(null);
  const [piNumber, setPiNumber] = useState<string | null>(null);
  const [addressForm, setAddressForm] =
    useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressBusyId, setAddressBusyId] = useState<string | null>(null);

  function applyAddressList(next: Address[], preferId?: string) {
    setAddresses(next);
    setAddressId((current) => {
      const wanted = preferId || current;
      if (wanted && next.some((a) => a.id === wanted)) return wanted;
      const def = next.find((a) => a.isDefault) || next[0];
      return def?.id || "";
    });
    if (next.length === 0) {
      setShowAddressForm(true);
      setEditingAddressId(null);
      setAddressForm(EMPTY_ADDRESS_FORM);
    }
  }

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
        applyAddressList(addr.addresses);
      }
      if (cat.products) setCatalog(cat.products);
      if (cat.credit) {
        const nextCredit = {
          allowed: Boolean(cat.credit.allowed),
        };
        setCredit(nextCredit);
        if (!nextCredit.allowed) {
          setPaymentMethod((m) => (m === "CREDIT" ? "TT" : m));
        }
      }
      if (typeof cat.canOrder === "boolean") setCanPlaceOrder(cat.canOrder);
      if (cat.channel) setChannel(cat.channel);
      setCreditReady(true);
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
      moq: priced?.moq ?? CASE_MOQ_PCS,
    };
  });

  const subtotal = lines.reduce(
    (sum, l) => sum + l.unitPrice * l.quantity,
    0,
  );
  const sellingQty = lines.reduce((sum, l) => sum + l.quantity, 0);
  const fallbackStations =
    (channel?.testStationsPerCase || 0) > 0
      ? casesFromPcs(sellingQty) * (channel?.testStationsPerCase || 0)
      : 0;
  const stationQty =
    channel && channel.sellingQty === sellingQty
      ? channel.testStationQty
      : fallbackStations;
  const firstDiscount = channel?.eligible ? channel.firstOrderDiscountUsd : 0;
  const rebateApplied = channel?.eligible ? channel.rebateAppliedUsd : 0;
  const channelDiscount = firstDiscount + rebateApplied;
  const displayDiscount = channel?.eligible ? channelDiscount : 0;
  const total = Math.max(0, Math.round((subtotal - displayDiscount) * 100) / 100);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (sellingQty < 1) return;
    let cancelled = false;
    const unit = lines[0]?.unitPrice;
    (async () => {
      const res = await fetch("/api/rebate/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellingQty, unitPrice: unit }),
      });
      const data = await res.json();
      if (!cancelled && res.ok) setChannel(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [sellingQty, status]);

  async function refreshAddresses(preferId?: string) {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    if (data.addresses) applyAddressList(data.addresses, preferId);
  }

  function startAddAddress() {
    setError(null);
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS_FORM);
    setShowAddressForm(true);
  }

  function startEditAddress(address: Address) {
    setError(null);
    setAddressId(address.id);
    setEditingAddressId(address.id);
    setAddressForm(formFromAddress(address));
    setShowAddressForm(true);
  }

  function cancelAddressForm() {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS_FORM);
  }

  async function onSaveAddress(e: FormEvent) {
    e.preventDefault();
    setAddressSaving(true);
    setError(null);
    const result = await saveAddress(addressForm, editingAddressId);
    setAddressSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    cancelAddressForm();
    await refreshAddresses(result.address.id);
  }

  async function onDeleteAddress(id: string) {
    if (!confirmDeleteAddress(addresses.length === 1)) return;
    setAddressBusyId(id);
    setError(null);
    const result = await deleteAddress(id);
    setAddressBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingAddressId === id) cancelAddressForm();
    await refreshAddresses();
  }

  async function placeOrder() {
    setError(null);
    if (!addressId) {
      setError("Add a shipping address to place your order.");
      return;
    }
    if (paymentMethod === "CREDIT" && !credit.allowed) {
      setError("Credit is not available on this account.");
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
        notes,
        items: lines.map((l) => ({
          sku: l.sku,
          quantity: l.quantity,
        })),
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

  if (status === "unauthenticated") {
    return null;
  }

  if (doneOrderId) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-display text-xs font-semibold tracking-[0.18em] text-umx-orange uppercase">
          Order placed
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold">Thank you</h1>
        <p className="mt-3 font-body text-black/65">
          Your order is recorded
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
    <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] xl:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]">
      <div className="space-y-6 lg:space-y-8">
        <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_12px_32px_rgba(61,22,5,0.04)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">
              Shipping address
            </h2>
            {canManageAddresses && addresses.length > 0 ? (
              <button
                type="button"
                onClick={startAddAddress}
                className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-umx-orange"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Add
              </button>
            ) : (
              <Link
                href="/account/addresses"
                className="font-display text-sm font-semibold text-umx-orange"
              >
                {addresses.length === 0 ? "Add address" : "Manage"}
              </Link>
            )}
          </div>
          {addresses.length === 0 && !showAddressForm ? (
            <div className="mt-4 rounded-xl border border-dashed border-black/15 bg-umx-cream/60 px-4 py-6 text-center">
              <p className="font-body text-sm text-black/65">
                Add a shipping address to place your order.
              </p>
              {canManageAddresses ? (
                <button
                  type="button"
                  onClick={startAddAddress}
                  className="mt-3 inline-flex rounded-full bg-umx-orange px-5 py-2.5 font-display text-sm font-semibold text-white"
                >
                  Add shipping address
                </button>
              ) : (
                <Link
                  href="/account/addresses"
                  className="mt-3 inline-flex rounded-full bg-umx-orange px-5 py-2.5 font-display text-sm font-semibold text-white"
                >
                  View addresses
                </Link>
              )}
            </div>
          ) : addresses.length > 0 ? (
            <div className="mt-4 space-y-3">
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className={`border p-4 ${
                    addressId === a.id
                      ? "border-umx-orange bg-umx-orange-wash/40"
                      : "border-black/10"
                  }`}
                >
                  <label className="flex cursor-pointer gap-3">
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === a.id}
                      onChange={() => setAddressId(a.id)}
                    />
                    <span className="min-w-0 flex-1 font-body text-sm leading-relaxed">
                      {a.label ? (
                        <strong className="block font-display">{a.label}</strong>
                      ) : null}
                      {a.line1}
                      <br />
                      {a.city}
                      {a.region ? `, ${a.region}` : ""} {a.postalCode}
                      <br />
                      {a.country}
                    </span>
                  </label>
                  {canManageAddresses ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-black/8 pt-3">
                      <button
                        type="button"
                        disabled={addressBusyId === a.id}
                        onClick={() => startEditAddress(a)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-umx-orange/30 bg-white px-3 py-1.5 font-display text-xs font-semibold text-umx-orange transition hover:bg-umx-orange-wash disabled:opacity-50"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={addressBusyId === a.id}
                        onClick={() => onDeleteAddress(a.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-semibold text-red-700/80 transition hover:bg-red-50 hover:text-red-800 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {canManageAddresses && showAddressForm ? (
            <div className="mt-4 rounded-xl border border-black/8 bg-umx-cream-bright/80 p-4 sm:p-5">
              <ShippingAddressForm
                form={addressForm}
                setForm={setAddressForm}
                onSubmit={onSaveAddress}
                onCancel={addresses.length > 0 ? cancelAddressForm : undefined}
                loading={addressSaving}
                title={
                  editingAddressId
                    ? "Edit shipping address"
                    : "Add shipping address"
                }
                submitLabel={editingAddressId ? "Save changes" : "Save address"}
                showCancel={addresses.length > 0}
              />
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_12px_32px_rgba(61,22,5,0.04)] sm:p-6">
          <h2 className="font-display text-lg font-semibold">Payment</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                {
                  id: "TT" as const,
                  label: "Telegraphic transfer",
                  enabled: true,
                  hint: null as string | null,
                },
                {
                  id: "CREDIT" as const,
                  label: "Credit",
                  enabled: creditReady && credit.allowed,
                  hint: !creditReady
                    ? "Checking credit…"
                    : credit.allowed
                      ? null
                      : "Not available on this account",
                },
              ] as const
            ).map((opt) => {
              const selected = paymentMethod === opt.id;
              const disabled = !opt.enabled;
              return (
                <label
                  key={opt.id}
                  className={`relative flex gap-3 border p-4 transition ${
                    disabled
                      ? "cursor-not-allowed border-black/8 bg-black/[0.03] opacity-55 grayscale"
                      : selected
                        ? "cursor-pointer border-umx-orange bg-umx-orange-wash/40"
                        : "cursor-pointer border-black/10 hover:border-black/25"
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    disabled={disabled}
                    checked={selected}
                    onChange={() => {
                      if (!disabled) setPaymentMethod(opt.id);
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block font-display text-sm font-semibold">
                      {opt.label}
                    </span>
                    {opt.hint ? (
                      <span className="mt-0.5 block font-body text-xs text-black/50">
                        {opt.hint}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}

            {(
              [
                { id: "paypal", label: "PayPal", sub: "Coming soon" },
                { id: "stripe", label: "Stripe", sub: "Coming soon" },
              ] as const
            ).map((gw) => (
              <div
                key={gw.id}
                aria-disabled="true"
                title="Payment gateway not configured yet"
                className="relative flex cursor-not-allowed items-center gap-3 border border-black/8 bg-black/[0.03] p-4 opacity-50 grayscale select-none"
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-black/25 bg-white"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block font-display text-sm font-semibold blur-[0.3px]">
                    {gw.label}
                  </span>
                  <span className="mt-0.5 block font-body text-xs text-black/50">
                    {gw.sub}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 font-body text-xs text-black/50">
            PayPal and Stripe will unlock here once the payment gateways are
            connected.
          </p>

          <label className="mt-4 block">
            <span className="font-display text-sm font-semibold">
              Payment reference (optional)
            </span>
            <input
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="mt-2 w-full border border-black/15 px-4 py-3"
              placeholder="TT / wire reference"
            />
          </label>
          <p className="mt-3 font-body text-xs text-black/50">
            After you place the order, open it and upload the bank slip (水单).
            Info confirms 到账 before the order counts for rebate.
          </p>
        </section>

        <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_12px_32px_rgba(61,22,5,0.04)] sm:p-6">
          {channel?.hideCoupon ? (
            <>
              <h2 className="font-display text-lg font-semibold">Channel rebate</h2>
              <div className="mt-3 space-y-2 font-body text-sm text-black/70">
                {channel.isFirstOrder ? (
                  <p>
                    First order: {channel.firstOrderUnpaidPcs} pcs not charged
                    {showPrices && channel.firstOrderDiscountUsd
                      ? ` (−$${channel.firstOrderDiscountUsd.toFixed(2)})`
                      : ""}
                    . No monthly rebate on this order.
                  </p>
                ) : channel.rebateBalanceUsd > 0 ? (
                  <p>
                    Rebate on account: ${channel.rebateBalanceUsd.toFixed(2)}. This
                    order applies ${channel.rebateAppliedUsd.toFixed(2)}.
                  </p>
                ) : (
                  <p>No rebate balance yet. Volume counts after payment is confirmed.</p>
                )}
                {stationQty > 0 ? (
                  <p>
                    This order includes {formatTestStationLine(stationQty)}.{" "}
                    {TEST_STATION_PER_CASE_COPY}. Taken from Test Station stock.
                  </p>
                ) : (channel?.testStationsPerCase || 0) > 0 ? (
                  <p>
                    {TEST_STATION_PER_CASE_COPY}. Kits are added automatically
                    and deducted from Test Station stock.
                  </p>
                ) : null}
                {channel.nextTierQty != null ? (
                  <p>
                    Paid this month: {channel.monthPaidQty.toLocaleString()} pcs.
                    {channel.monthProjectedRate
                      ? ` Current rate $${channel.monthProjectedRate.toFixed(2)}/pc.`
                      : ""}{" "}
                    {channel.nextTierQty.toLocaleString()} more paid pcs to $
                    {(channel.nextTierRate ?? 0).toFixed(2)}/pc.
                  </p>
                ) : (
                  <p>
                    Paid this month: {channel.monthPaidQty.toLocaleString()} pcs
                    {channel.monthProjectedRate
                      ? ` · $${channel.monthProjectedRate.toFixed(2)}/pc`
                      : ""}
                    .
                  </p>
                )}
              </div>
            </>
          ) : null}
          <label className={channel?.hideCoupon ? "mt-4 block" : "block"}>
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

      <aside className="h-fit overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_16px_40px_rgba(61,22,5,0.05)] lg:sticky lg:top-28">
        <div className="border-b border-black/8 bg-[#eef3f7] px-5 py-4 sm:px-6">
          <p className="font-display text-[0.65rem] font-semibold tracking-[0.18em] text-umx-orange uppercase">
            Your order
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-black">
              Order summary
            </h2>
            <p className="font-body text-xs text-black/55">
              {formatCases(cases)} · {quantity.toLocaleString()} pcs
            </p>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <ul className="divide-y divide-black/8">
            {lines.map((l) => {
              const lineCases = casesFromPcs(l.quantity);
              return (
                <li key={l.sku} className="flex gap-3 py-4 first:pt-0">
                  {l.image ? (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-umx-cream">
                      <Image
                        src={l.image}
                        alt=""
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-sm font-semibold leading-snug text-black">
                        {l.name}
                      </p>
                      <p className="shrink-0 font-display text-sm font-semibold tabular-nums text-black">
                        <StorePrice amount={l.unitPrice * l.quantity} />
                      </p>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="font-body text-xs text-black/55">
                        {formatCases(lineCases)} · {l.quantity.toLocaleString()}{" "}
                        pcs
                        {l.quantity < l.moq ? ` · MOQ ${l.moq} pcs` : ""}
                      </p>
                      {showPrices ? (
                        <p className="font-body text-xs tabular-nums text-black/45">
                          <StorePrice amount={l.unitPrice} /> / pc
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
            {stationQty > 0 ? (
              <li className="flex gap-3 py-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] font-display text-[0.65rem] font-bold tracking-wide text-[#1b4f72] uppercase">
                  Kit
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-sm font-semibold leading-snug text-black">
                      {TEST_STATION_NAME}
                    </p>
                    <p className="shrink-0 font-display text-sm font-semibold tabular-nums text-black">
                      $0
                    </p>
                  </div>
                  <p className="mt-1.5 font-body text-xs text-black/55">
                    {formatTestStationLine(stationQty)} · {TEST_STATION_PER_CASE_COPY}
                  </p>
                </div>
              </li>
            ) : null}
          </ul>

          <div className="mt-2 space-y-2.5 border-t border-black/10 pt-4 font-body text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-black/65">Subtotal</span>
              <span className="font-display font-semibold tabular-nums">
                <StorePrice amount={subtotal} />
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-black/65">Shipping</span>
              <span className="text-right text-black/65">Arranged after order</span>
            </div>
            {channel?.firstOrderUnpaidPcs ? (
              <div className="flex justify-between gap-4">
                <span className="text-black/65">First-order unpaid pcs</span>
                <span>{channel.firstOrderUnpaidPcs}</span>
              </div>
            ) : null}
            {displayDiscount > 0 ? (
              <div className="flex justify-between gap-4 text-umx-orange">
                <span>Channel rebate</span>
                <span className="font-display font-semibold tabular-nums">
                  {showPrices ? `−$${displayDiscount.toFixed(2)}` : "On request"}
                </span>
              </div>
            ) : null}
            <div className="flex items-end justify-between gap-4 border-t border-black/10 pt-3">
              <span className="font-display text-base font-semibold">Total</span>
              <span className="font-display text-xl font-bold tabular-nums text-umx-orange">
                <StorePrice amount={total} />
              </span>
            </div>
          </div>

          {error && (
            <p className="mt-4 font-body text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={loading || !addressId}
            onClick={placeOrder}
            className="mt-6 hidden w-full rounded-full bg-umx-orange py-3.5 font-display text-sm font-semibold text-umx-cream shadow-[0_12px_28px_rgba(27,79,114,0.3)] transition hover:bg-umx-orange-deep disabled:opacity-50 lg:block"
          >
            {loading ? "Placing order…" : "Place order"}
          </button>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-body text-xs text-black/55">Total</p>
            <p className="font-display text-lg font-bold tracking-tight text-black">
              <StorePrice amount={total} />
            </p>
          </div>
          <button
            type="button"
            disabled={loading || !addressId}
            onClick={placeOrder}
            className="shrink-0 rounded-full bg-umx-orange px-5 py-3.5 font-display text-sm font-semibold text-umx-cream shadow-[0_10px_24px_rgba(27,79,114,0.28)] transition hover:bg-umx-orange-deep disabled:opacity-50"
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
