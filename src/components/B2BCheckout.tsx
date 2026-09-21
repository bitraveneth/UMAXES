"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CircleCheck, Gift, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import PiNumberBlock from "@/components/account/PiNumberBlock";
import { useCart } from "@/context/CartContext";
import { getFlavor } from "@/lib/assets";
import { CASE_MOQ_PCS, casesFromPcs, formatPack } from "@/lib/pack";
import { isChannelBuyerLevel } from "@/lib/channel-level";
import { StorePrice, useShowStorePrices } from "@/components/StorePrice";
import {
  TEST_STATION_NAME,
} from "@/lib/test-station";
import {
  EMPTY_ADDRESS_FORM,
  ShippingAddressForm,
  deleteAddress,
  formFromAddress,
  saveAddress,
  type AddressFormValues,
  type ShippingAddress,
} from "@/components/ShippingAddressForm";
import { useAppFeedback } from "@/components/ui/AppFeedback";
import DocumentDownloadMenu from "@/components/account/DocumentDownloadMenu";
import CheckoutSlipField from "@/components/account/CheckoutSlipField";
import OrderQtySummary from "@/components/account/OrderQtySummary";

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
  const isChannelBuyer = isChannelBuyerLevel(session?.user?.companyLevel);

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
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipError, setSlipError] = useState<string | null>(null);
  const [slipAttached, setSlipAttached] = useState(false);
  const { confirm, showToast, ui } = useAppFeedback();

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
    const wasEdit = Boolean(editingAddressId);
    cancelAddressForm();
    await refreshAddresses(result.address.id);
    showToast(
      wasEdit ? "Updated successfully" : "Saved successfully",
      "success",
      wasEdit
        ? "Shipping address has been updated."
        : "Shipping address has been saved.",
    );
  }

  async function onDeleteAddress(id: string) {
    const ok = await confirm({
      title: "Delete shipping address?",
      message:
        addresses.length === 1
          ? "This is your only saved address. You will need to add a new one before placing an order."
          : "This ship-to location will be removed from your account.",
      confirmLabel: "Delete address",
      tone: "danger",
    });
    if (!ok) return;
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
    showToast("Address deleted", "danger", "This ship-to was removed.");
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
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Could not place order");
      return;
    }

    let attached = false;
    if (slipFile && data.order?.id) {
      const fd = new FormData();
      fd.set("file", slipFile);
      if (paymentRef.trim()) fd.set("reference", paymentRef.trim());
      const slipRes = await fetch(
        `/api/orders/${data.order.id}/payment-slip`,
        { method: "POST", body: fd },
      );
      attached = slipRes.ok;
      if (!slipRes.ok) {
        const slipData = await slipRes.json().catch(() => ({}));
        showToast(
          "Order placed — slip not attached",
          "danger",
          slipData.error ||
            "You can upload the bank slip from the order page.",
        );
      }
    }

    clear();
    setLoading(false);
    setDoneOrderId(data.order.id);
    setPiNumber(data.order.piNumber);
    setSlipAttached(attached);
  }

  if (status === "loading") {
    return <p className="py-20 text-center font-body">Loading checkout…</p>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (doneOrderId) {
    return (
      <div className="mx-auto max-w-2xl py-10 sm:py-16">
        {ui}
        <div className="relative overflow-hidden border border-black/10 bg-white shadow-[0_18px_48px_rgba(14,36,56,0.07)]">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1.5 bg-emerald-600"
          />
          <div className="px-6 py-7 pl-7 sm:px-9 sm:py-9">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CircleCheck className="h-7 w-7" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[0.65rem] font-semibold tracking-[0.2em] text-emerald-800 uppercase">
                  Order placed
                </p>
                <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
                  Thank you
                </h1>
                <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-black/68">
                  {slipAttached
                    ? "Your order is recorded and the bank slip is attached. Finance confirms funds received before this order counts toward rebate."
                    : "Your order is recorded. Download the proforma and send the transfer. You can upload a bank slip from the order page — it is not required to place the order. Finance confirms funds received before this order counts toward rebate."}
                </p>
              </div>
            </div>

            {piNumber ? (
              <div className="mt-7">
                <PiNumberBlock value={piNumber} />
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 border border-black/8 bg-[#f7f9fb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-sm font-semibold text-black">
                  Download PI
                </p>
                <p className="mt-0.5 font-body text-xs text-black/55">
                  Choose PDF or Excel.
                </p>
              </div>
              <DocumentDownloadMenu
                orderId={doneOrderId}
                type="pi"
                label="Choose format"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/account/orders/${doneOrderId}`}
                className="inline-flex items-center justify-center bg-umx-orange px-5 py-3 font-display text-sm font-semibold text-white"
              >
                View this order
              </Link>
              <Link
                href="/account/orders"
                className="inline-flex items-center justify-center border border-black/15 px-5 py-3 font-display text-sm font-semibold text-black"
              >
                All orders
              </Link>
            </div>
          </div>
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
    <>
      {ui}
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
                      {a.recipientName ? (
                        <strong className="block font-display">
                          {a.recipientName}
                        </strong>
                      ) : a.label ? (
                        <strong className="block font-display">{a.label}</strong>
                      ) : null}
                      {a.recipientName && a.label ? (
                        <span className="block text-xs text-black/55">
                          {a.label}
                        </span>
                      ) : null}
                      {a.phone ? (
                        <span className="block text-black/70">{a.phone}</span>
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
              Payment reference
              <span className="ml-2 font-body text-xs font-normal text-black/45">
                Optional
              </span>
            </span>
            <input
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="mt-2 w-full border border-black/15 px-4 py-3"
              placeholder="TT / wire reference"
            />
          </label>
          <CheckoutSlipField
            file={slipFile}
            disabled={loading}
            onChange={(next, err) => {
              setSlipFile(err ? null : next);
              setSlipError(err);
            }}
          />
          {slipError ? (
            <p className="mt-2 font-body text-sm text-red-700">{slipError}</p>
          ) : null}
          <p className="mt-3 font-body text-xs leading-relaxed text-black/50">
            After you place the order, finance confirms funds received before
            this order counts toward rebate. You can pay now or later, and you
            can upload the bank slip here or from the order page.
          </p>
        </section>

        {isChannelBuyer ? (
          <section className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_12px_32px_rgba(61,22,5,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/8 bg-[#eef3f7] px-5 py-4 sm:px-6">
              <div>
                <p className="font-display text-[0.65rem] font-semibold tracking-[0.18em] text-[#1b4f72] uppercase">
                  Channel program
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold text-black">
                  This order
                </h2>
              </div>
              <Link
                href="/account/rebate"
                className="font-display text-sm font-semibold text-[#1b4f72] transition hover:text-umx-orange"
              >
                Rebate status →
              </Link>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <div className="flex gap-3 border border-black/8 bg-umx-cream-bright p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-white text-[#1b4f72]">
                  <Wallet className="h-4 w-4" strokeWidth={1.85} />
                </span>
                <div className="min-w-0">
                  {channel?.isFirstOrder ? (
                    <>
                      <p className="font-display text-sm font-bold text-black">
                        First order
                      </p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-black/70">
                        {channel.firstOrderUnpaidPcs
                          ? `${channel.firstOrderUnpaidPcs.toLocaleString()} unpaid pcs on this order`
                          : "First-order gift applies when the case count qualifies"}
                        {showPrices && channel.firstOrderDiscountUsd
                          ? ` (−$${channel.firstOrderDiscountUsd.toFixed(2)})`
                          : ""}
                        . Monthly rebate starts after this order is paid.
                      </p>
                    </>
                  ) : channel && channel.rebateBalanceUsd > 0 ? (
                    <>
                      <p className="font-display text-sm font-bold text-black">
                        ${channel.rebateAppliedUsd.toFixed(2)} credit
                      </p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-black/70">
                        Applying from ${channel.rebateBalanceUsd.toFixed(2)} on
                        account. Credit is not cash.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-sm font-bold text-black">
                        No credit on this order
                      </p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-black/70">
                        Wallet and monthly volume live on your Rebate page.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-3 border border-black/8 bg-umx-cream-bright p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-white text-[#1b4f72]">
                  <Gift className="h-4 w-4" strokeWidth={1.85} />
                </span>
                <div className="min-w-0">
                  {stationQty > 0 ? (
                    <>
                      <p className="font-display text-sm font-bold text-black">
                        {stationQty === 1
                          ? "1 test station"
                          : `${stationQty} test stations`}
                      </p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-black/70">
                        {stationQty === 1 ? "1 piece" : `${stationQty} pieces`} ·
                        free · 1 per case
                      </p>
                    </>
                  ) : (channel?.testStationsPerCase || 0) > 0 ? (
                    <>
                      <p className="font-display text-sm font-bold text-black">
                        Test stations
                      </p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-black/70">
                        1 free kit per case when you order full cases
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-sm font-bold text-black">
                        Test stations
                      </p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-black/70">
                        Qualifying channel orders include one kit per case.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_12px_32px_rgba(61,22,5,0.04)] sm:p-6">
          <label className="block">
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
              {formatPack(quantity)}
            </p>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <OrderQtySummary pcs={quantity} stationQty={stationQty} compact />
          <ul className="mt-4 divide-y divide-black/8">
            {lines.map((l) => {
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
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="font-body text-xs text-black/55">
                        {formatPack(l.quantity)}
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
                    {stationQty === 1 ? "1 piece" : `${stationQty} pieces`} · free
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
    </>
  );
}
