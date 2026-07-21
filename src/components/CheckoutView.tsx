"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Lock,
  Mail,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { getFlavor, type FlavorId } from "@/lib/assets";

type FormState = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  ageConfirmed: boolean;
};

type Step = 1 | 2 | 3;
type PayMethod = "card" | "apple" | "paypal";

function PayPalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#003087"
        d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.653h6.97c2.306 0 3.903.62 4.747 1.846.76 1.103.9 2.52.41 4.21-.02.07-.04.14-.06.22-.55 2.23-1.84 3.79-3.83 4.64-1.09.46-2.38.7-3.84.7H7.94a.92.92 0 0 0-.91.78l-.78 4.95a.64.64 0 0 1-.63.54l-.544.014z"
      />
      <path
        fill="#009CDE"
        d="M19.832 7.723c-.03.18-.06.36-.1.55-.95 3.87-3.33 5.2-6.62 5.2h-1.68a.77.77 0 0 0-.76.65l-.96 6.1a.64.64 0 0 1-.63.54H6.48a.385.385 0 0 0-.38.45l.1.63c.05.3.31.52.62.52h4.37a.77.77 0 0 0 .76-.65l.03-.16.58-3.68.04-.2a.77.77 0 0 1 .76-.65h.48c3.1 0 5.53-1.26 6.24-4.9.3-1.52.14-2.79-.61-3.7-.23-.27-.5-.5-.82-.7z"
      />
      <path
        fill="#012169"
        d="M18.646 7.347c-.2-.06-.41-.11-.63-.15-.22-.04-.45-.07-.69-.09-.23-.02-.48-.03-.74-.03h-5.66a.77.77 0 0 0-.76.65l-1.03 6.52-.03.2a.77.77 0 0 0 .76.65h1.68c3.29 0 5.67-1.33 6.62-5.2.04-.19.07-.37.1-.55.16-.9.17-1.66.01-2.3-.06-.23-.14-.44-.24-.63a3.3 3.3 0 0 0-.38-.57z"
      />
    </svg>
  );
}

function ApplePayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 50 20"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M9.5 3.2c-.6.7-1.5 1.2-2.4 1.1-.1-1 .4-2 1-2.6.6-.7 1.6-1.2 2.4-1.2.1 1-.3 2-.1 2.7zm2.4 1.4c-1.4 0-2.5.8-3.2.8-.7 0-1.7-.8-2.9-.7-1.5 0-2.8.9-3.6 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1.1 1.6 2.2 2.8 2.2 1.1 0 1.5-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-1.1 2.7-2.1.8-1.2 1.1-2.4 1.1-2.5-.1 0-2.1-.8-2.1-3.2 0-2 1.6-2.9 1.7-3-.9-1.4-2.4-1.5-2.9-1.5l-.5.2zM20.2 2.1v15.4h2.1v-5.3h2.9c2.7 0 4.5-1.8 4.5-5.1 0-3.2-1.9-5-4.6-5h-4.9zm2.1 1.8h2.5c1.8 0 2.8 1 2.8 3.2s-1 3.3-2.8 3.3h-2.5V3.9zm12.6 6.6c0 2.1 1.7 3.3 3.7 3.3 1.5 0 2.5-.5 3.3-1.2l-.9-1.3c-.6.5-1.4.9-2.3.9-1.3 0-2.2-.8-2.3-2h5.8v-.5c0-3.1-1.7-5.1-4.5-5.1-2.7 0-4.8 2.1-4.8 5zm2.1-.7c0-1.6.9-2.7 2.4-2.7 1.4 0 2.3 1.1 2.3 2.7h-4.7zm8.9 6.8c1.8 0 2.8-.7 3.6-2.9l3.5-9.4h-2.3l-2.3 7.3h-.1l-2.3-7.3h-2.4l3.4 9.2c-.2.7-.5 1-1.3 1.1l-.4.1v1.9h.6z"
      />
    </svg>
  );
}

const initialForm: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  cardNumber: "",
  cardName: "",
  cardExpiry: "",
  cardCvv: "",
  ageConfirmed: false,
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 font-body text-[15px] font-medium text-black outline-none transition placeholder:text-black/50 focus:border-umx-orange focus:ring-4 focus:ring-umx-orange/15 shadow-[0_1px_0_rgba(61,22,5,0.03)] [-webkit-text-fill-color:#000]";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="font-display text-sm font-semibold text-black">
        {label}
      </span>
      {children}
    </label>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = {
    1: "Personal details",
    2: "Payment",
    3: "Complete",
  } as const;

  return (
    <div className="w-full max-w-xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-[0.65rem] font-semibold tracking-[0.16em] text-black uppercase">
            Checkout · Step {step} of 3
          </p>
          <p className="mt-1 font-display text-xl font-bold text-black sm:text-2xl">
            {labels[step]}
          </p>
        </div>
        <p className="hidden pb-1 font-body text-sm text-black sm:block">
          Secure checkout
        </p>
      </div>
      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/10"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-label={`Checkout progress: step ${step} of 3`}
      >
        <div
          className="h-full rounded-full bg-umx-orange transition-[width] duration-500 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}

type Coupon = {
  code: string;
  label: string;
  amount: number;
};

const COUPONS: Record<string, { label: string; type: "percent" | "fixed"; value: number }> = {
  UMAXES10: { label: "10% off", type: "percent", value: 10 },
  WELCOME5: { label: "$5 off", type: "fixed", value: 5 },
  SAVE15: { label: "15% off", type: "percent", value: 15 },
};

function resolveCoupon(code: string, subtotal: number): Coupon | null {
  const key = code.trim().toUpperCase();
  const rule = COUPONS[key];
  if (!rule) return null;
  const amount =
    rule.type === "percent"
      ? Math.round(subtotal * (rule.value / 100) * 100) / 100
      : Math.min(rule.value, subtotal);
  return { code: key, label: rule.label, amount };
}

function CartSummary({
  quantity,
  total,
  shipping,
  discount,
  grandTotal,
  items,
  coupon,
  onApplyCoupon,
  onRemoveCoupon,
  onSetQuantity,
  onRemove,
}: {
  quantity: number;
  total: number;
  shipping: number;
  discount: number;
  grandTotal: number;
  items: { flavorId: FlavorId; quantity: number }[];
  coupon: Coupon | null;
  onApplyCoupon: (code: string) => string | null;
  onRemoveCoupon: () => void;
  onSetQuantity: (flavorId: FlavorId, qty: number) => void;
  onRemove: (flavorId: FlavorId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  function handleApply() {
    const result = onApplyCoupon(code);
    if (result) {
      setMessage(result);
      return;
    }
    setMessage("");
    setCode("");
    setOpen(false);
  }

  return (
    <aside className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_60px_rgba(61,22,5,0.12)] ring-1 ring-black/8">
      <div className="relative overflow-hidden bg-gradient-to-br from-umx-orange via-umx-orange to-umx-orange-deep px-6 py-6 text-white sm:px-7 sm:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 rounded-full bg-white/20 blur-2xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[0.65rem] font-semibold tracking-[0.18em] text-white/85 uppercase">
              Order summary
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">
              Your cart
            </h2>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 font-display text-sm font-bold text-umx-orange">
            {quantity} item{quantity === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-b from-umx-orange-wash/50 via-umx-cream/70 to-white px-5 py-6 sm:px-6 sm:py-7">
        <ul className="space-y-3.5">
          {items.map((line) => {
            const flavor = getFlavor(line.flavorId);
            if (!flavor) return null;
            return (
              <li
                key={line.flavorId}
                className="flex gap-4 rounded-2xl bg-white p-3.5 shadow-[0_8px_24px_rgba(61,22,5,0.06)] ring-1 ring-black/6 sm:p-4"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-umx-cream sm:h-24 sm:w-24">
                  <Image
                    src={flavor.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-black">
                        {flavor.name}
                      </p>
                      <p className="mt-1 font-body text-sm text-black">
                        ${flavor.price.toFixed(2)} each
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${flavor.name}`}
                      onClick={() => onRemove(line.flavorId)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-black/40 transition hover:bg-umx-orange/10 hover:text-umx-orange"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <div className="inline-flex items-center rounded-full border border-black/12 bg-umx-cream">
                      <button
                        type="button"
                        aria-label={`Decrease ${flavor.name}`}
                        onClick={() =>
                          onSetQuantity(line.flavorId, line.quantity - 1)
                        }
                        className="flex h-8 w-8 items-center justify-center text-black transition hover:text-umx-orange"
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      </button>
                      <span className="min-w-7 text-center font-display text-sm font-bold text-black">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${flavor.name}`}
                        onClick={() =>
                          onSetQuantity(line.flavorId, line.quantity + 1)
                        }
                        className="flex h-8 w-8 items-center justify-center text-black transition hover:text-umx-orange"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      </button>
                    </div>
                    <p className="font-display text-base font-bold text-umx-orange">
                      ${(flavor.price * line.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(61,22,5,0.05)] ring-1 ring-black/6">
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              setMessage("");
            }}
            aria-expanded={open}
            className="flex w-full items-center justify-between px-4 py-3.5 font-display text-sm font-semibold text-black"
          >
            <span className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-umx-orange text-sm font-bold text-white">
                %
              </span>
              {coupon ? `Coupon · ${coupon.code}` : "Apply coupon code"}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-umx-orange transition ${open ? "rotate-180" : ""}`}
              strokeWidth={2.2}
              aria-hidden
            />
          </button>

          {open && (
            <div className="border-t border-black/6 px-4 pt-3 pb-4">
              {coupon ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-umx-orange/10 px-3 py-3">
                  <div>
                    <p className="font-display text-sm font-bold text-black">
                      {coupon.code}
                    </p>
                    <p className="font-body text-xs text-black">{coupon.label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveCoupon();
                      setMessage("");
                    }}
                    className="font-display text-xs font-semibold tracking-wide text-umx-orange uppercase"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setMessage("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApply();
                        }
                      }}
                      placeholder="Enter code"
                      className="min-w-0 flex-1 rounded-xl border border-black/10 bg-umx-cream px-3 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-black outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-black/50 focus:border-umx-orange focus:bg-white focus:ring-4 focus:ring-umx-orange/15 [-webkit-text-fill-color:#000]"
                    />
                    <button
                      type="button"
                      onClick={handleApply}
                      className="rounded-xl bg-umx-orange px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-umx-orange-mid"
                    >
                      Apply
                    </button>
                  </div>
                  {message && (
                    <p className="mt-2 font-display text-xs font-semibold text-umx-orange-deep">
                      {message}
                    </p>
                  )}
                  <p className="mt-2 font-body text-[0.7rem] text-black">
                    Try UMAXES10, WELCOME5, or SAVE15
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(61,22,5,0.05)] ring-1 ring-black/6">
          <div className="space-y-2.5">
            <div className="flex justify-between font-body text-sm text-black">
              <span>Subtotal</span>
              <span className="font-display font-semibold text-black">
                ${total.toFixed(2)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-body text-sm text-umx-orange">
                <span>Discount{coupon ? ` (${coupon.code})` : ""}</span>
                <span className="font-display font-semibold">
                  −${discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-body text-sm text-black">
              <span>Shipping</span>
              <span className="font-display font-semibold text-black">
                {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between font-body text-sm text-black">
              <span>Tax</span>
              <span className="font-display font-semibold text-black">$0.00</span>
            </div>
            <div className="flex justify-between border-t border-black/8 pt-3 font-display text-2xl font-extrabold text-black">
              <span>Total</span>
              <span className="text-umx-orange">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-black/6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-umx-orange text-white">
              <Lock className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-display text-xs font-bold text-black">
                Secure checkout
              </p>
              <p className="mt-0.5 font-body text-[0.65rem] leading-snug text-black">
                Encrypted payment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-black/6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-umx-orange text-white">
              <ShieldCheck className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-display text-xs font-bold text-black">
                Adults 21+
              </p>
              <p className="mt-0.5 font-body text-[0.65rem] leading-snug text-black">
                Age-verified sale
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function CheckoutView() {
  const router = useRouter();
  const { items, quantity, total, clear, setOpen, setQuantity, remove } =
    useCart();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    if (step !== 3 && quantity === 0) router.replace("/shop");
  }, [quantity, step, router]);

  useEffect(() => {
    if (!coupon) return;
    const next = resolveCoupon(coupon.code, total);
    if (!next || next.amount <= 0) setCoupon(null);
    else if (next.amount !== coupon.amount) setCoupon(next);
  }, [total, coupon]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function applyCoupon(raw: string) {
    if (!raw.trim()) return "Enter a coupon code.";
    const next = resolveCoupon(raw, total);
    if (!next) return "Invalid coupon code.";
    setCoupon(next);
    return null;
  }

  const shipping =
    total >= 75 && shippingMethod === "standard"
      ? 0
      : shippingMethod === "express"
        ? 14
        : 6;
  const discount = coupon?.amount ?? 0;
  const grandTotal = Math.max(0, total - discount) + shipping;

  function validatePersonal() {
    if (
      !form.email ||
      !form.firstName ||
      !form.lastName ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.state ||
      !form.zip ||
      !form.country
    ) {
      setError("Please fill in all personal and shipping details.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email.");
      return false;
    }
    setError("");
    return true;
  }

  function goPayment() {
    if (!validatePersonal()) return;
    setStep(2);
  }

  function placeOrder() {
    if (!form.ageConfirmed) {
      setError("Please confirm you are 21+ to continue.");
      return;
    }
    if (payMethod === "card") {
      if (!form.cardNumber || !form.cardName || !form.cardExpiry || !form.cardCvv) {
        setError("Please complete card details (preview fields).");
        return;
      }
    }
    setError("");
    setSubmitting(true);
    window.setTimeout(() => {
      clear();
      setSubmitting(false);
      setStep(3);
    }, 700);
  }

  if (step !== 3 && quantity === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-umx-cream pt-[8.5rem] sm:pt-[9rem]">
        <p className="font-display text-sm text-black">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-umx-cream pb-16 text-black pt-[8.5rem] sm:pb-24 sm:pt-[9rem] [&_input]:text-black [&_input]:[-webkit-text-fill-color:#000]">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 pb-5"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-black transition hover:text-umx-orange"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              Back to shop
            </Link>
            <span className="hidden text-black/25 sm:inline" aria-hidden>
              |
            </span>
            <ol className="hidden items-center gap-1.5 font-body text-sm text-black sm:flex">
              <li>
                <Link href="/" className="transition hover:text-umx-orange">
                  Home
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5 text-black/30" />
              </li>
              <li>
                <Link href="/shop" className="transition hover:text-umx-orange">
                  Shop
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5 text-black/30" />
              </li>
              <li className="font-display font-semibold text-black" aria-current="page">
                Checkout
              </li>
            </ol>
          </div>
          {step !== 3 && (
            <Link
              href="/shop"
              className="rounded-full border border-black/15 bg-white px-4 py-2 font-display text-xs font-semibold tracking-wide text-black uppercase transition hover:border-umx-orange hover:text-umx-orange"
            >
              Cancel order
            </Link>
          )}
        </nav>

        <div className="mt-8">
          <Stepper step={step} />
        </div>

        {step === 3 ? (
          <div className="mx-auto mt-12 max-w-xl rounded-[1.75rem] bg-white px-8 py-14 text-center shadow-[0_20px_50px_rgba(61,22,5,0.08)] ring-1 ring-black/5">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-umx-orange text-white">
              <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden />
            </span>
            <h1 className="mt-6 font-display text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-tight text-black">
              Order complete
            </h1>
            <p className="mt-3 font-body text-base leading-relaxed text-black">
              Preview only — no payment was charged. After Stripe or Shopify is
              connected, real confirmations will show here.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/shop"
                className="rounded-2xl bg-umx-orange px-7 py-3.5 font-display text-sm font-semibold text-white transition hover:bg-umx-orange-mid"
              >
                Continue shopping
              </Link>
              <Link
                href="/"
                className="rounded-2xl bg-white px-7 py-3.5 font-display text-sm font-semibold text-black ring-1 ring-black/10 transition hover:ring-umx-orange/40"
              >
                Back home
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(440px,480px)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_520px]">
            <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_rgba(61,22,5,0.1)] ring-1 ring-black/8 sm:p-8">
              {step === 1 && (
                <>
                  <div className="flex items-start gap-4 border-b border-black/6 pb-6">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-umx-orange text-white shadow-[0_10px_24px_rgba(255,91,4,0.3)]">
                      <User className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                    </span>
                    <div>
                      <h1 className="font-display text-2xl font-bold tracking-tight text-black sm:text-[1.75rem]">
                        Personal details
                      </h1>
                      <p className="mt-1.5 font-body text-sm leading-relaxed text-black">
                        Tell us who you are and where to deliver your flavors.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    <section className="rounded-[1.35rem] bg-umx-cream-warm/70 p-4 ring-1 ring-black/5 sm:p-5">
                      <div className="mb-4 flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-umx-orange/15 text-umx-orange">
                          <Mail className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                        </span>
                        <div>
                          <h2 className="font-display text-sm font-bold text-black">
                            Contact
                          </h2>
                          <p className="font-body text-xs text-black">
                            Receipt and delivery updates
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3.5">
                        <div className="grid gap-3.5 sm:grid-cols-2">
                          <Field label="First name">
                            <input
                              className={inputClass}
                              value={form.firstName}
                              onChange={(e) => update("firstName", e.target.value)}
                              autoComplete="given-name"
                            />
                          </Field>
                          <Field label="Last name">
                            <input
                              className={inputClass}
                              value={form.lastName}
                              onChange={(e) => update("lastName", e.target.value)}
                              autoComplete="family-name"
                            />
                          </Field>
                        </div>
                        <Field label="Email">
                          <input
                            type="email"
                            className={inputClass}
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            autoComplete="email"
                          />
                        </Field>
                        <Field label="Phone">
                          <input
                            type="tel"
                            className={inputClass}
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            autoComplete="tel"
                          />
                        </Field>
                      </div>
                    </section>

                    <section className="rounded-[1.35rem] bg-umx-cream-warm/70 p-4 ring-1 ring-black/5 sm:p-5">
                      <div className="mb-4 flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-umx-orange/15 text-umx-orange">
                          <MapPin className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                        </span>
                        <div>
                          <h2 className="font-display text-sm font-bold text-black">
                            Delivery address
                          </h2>
                          <p className="font-body text-xs text-black">
                            Where your order should arrive
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3.5">
                        <Field label="Address">
                          <input
                            className={inputClass}
                            value={form.address}
                            onChange={(e) => update("address", e.target.value)}
                            autoComplete="street-address"
                          />
                        </Field>
                        <div className="grid gap-3.5 sm:grid-cols-2">
                          <Field label="City">
                            <input
                              className={inputClass}
                              value={form.city}
                              onChange={(e) => update("city", e.target.value)}
                              autoComplete="address-level2"
                            />
                          </Field>
                          <Field label="State">
                            <input
                              className={inputClass}
                              value={form.state}
                              onChange={(e) => update("state", e.target.value)}
                              autoComplete="address-level1"
                            />
                          </Field>
                        </div>
                        <div className="grid gap-3.5 sm:grid-cols-2">
                          <Field label="ZIP">
                            <input
                              className={inputClass}
                              value={form.zip}
                              onChange={(e) => update("zip", e.target.value)}
                              autoComplete="postal-code"
                            />
                          </Field>
                          <Field label="Country">
                            <input
                              className={inputClass}
                              value={form.country}
                              onChange={(e) => update("country", e.target.value)}
                              autoComplete="country-name"
                            />
                          </Field>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[1.35rem] bg-umx-cream-warm/70 p-4 ring-1 ring-black/5 sm:p-5">
                      <div className="mb-4 flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-umx-orange/15 text-umx-orange">
                          <Truck className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                        </span>
                        <div>
                          <h2 className="font-display text-sm font-bold text-black">
                            Shipping method
                          </h2>
                          <p className="font-body text-xs text-black">
                            Free standard shipping at $75+
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            {
                              id: "standard" as const,
                              title: "Standard",
                              meta: "5–7 business days",
                              price: total >= 75 ? "Free" : "$6",
                            },
                            {
                              id: "express" as const,
                              title: "Express",
                              meta: "2–3 business days",
                              price: "$14",
                            },
                          ] as const
                        ).map((opt) => {
                          const on = shippingMethod === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setShippingMethod(opt.id)}
                              className={`flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left transition ${
                                on
                                  ? "shadow-[0_10px_28px_rgba(255,91,4,0.2)] ring-2 ring-umx-orange"
                                  : "ring-1 ring-black/10 hover:ring-umx-orange/40"
                              }`}
                            >
                              <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                  on
                                    ? "bg-umx-orange text-white"
                                    : "bg-umx-orange/10 text-umx-orange"
                                }`}
                              >
                                <Truck className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-display text-sm font-bold text-black">
                                  {opt.title}
                                </span>
                                <span className="font-body text-xs text-black">
                                  {opt.meta}
                                </span>
                              </span>
                              <span className="font-display text-sm font-bold text-black">
                                {opt.price}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </div>

                  {error && (
                    <p className="mt-4 font-display text-sm font-semibold text-umx-orange-deep">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={goPayment}
                    className="mt-7 w-full rounded-2xl bg-umx-orange py-4 font-display text-base font-semibold text-white shadow-[0_14px_30px_rgba(255,91,4,0.28)] transition hover:bg-umx-orange-mid"
                  >
                    Continue to payment
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-black sm:text-[1.75rem]">
                    Select Payment Option
                  </h1>
                  <p className="mt-2 font-body text-sm text-black">
                    All transactions are secure and encrypted.
                  </p>

                  <div className="mt-7 space-y-3">
                    {(
                      [
                        {
                          id: "paypal" as const,
                          title: "PayPal",
                          icon: (
                            <PayPalIcon className="h-6 w-6 shrink-0" />
                          ),
                        },
                        {
                          id: "card" as const,
                          title: "Credit Card",
                          icon: (
                            <CreditCard
                              className="h-5 w-5 shrink-0 text-black"
                              strokeWidth={2}
                              aria-hidden
                            />
                          ),
                        },
                        {
                          id: "apple" as const,
                          title: "Apple Pay",
                          icon: (
                            <ApplePayIcon className="h-5 w-12 shrink-0 text-black" />
                          ),
                        },
                      ] as const
                    ).map((method) => {
                      const on = payMethod === method.id;
                      return (
                        <div
                          key={method.id}
                          className={`overflow-hidden rounded-2xl transition ${
                            on
                              ? "bg-umx-orange/[0.06] ring-2 ring-umx-orange"
                              : "bg-umx-cream-warm/60 ring-1 ring-black/6 hover:ring-umx-orange/35"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setPayMethod(method.id)}
                            className="flex w-full items-center gap-3 px-4 py-4 text-left"
                          >
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                on ? "border-umx-orange" : "border-black/35"
                              }`}
                            >
                              {on && (
                                <span className="h-2.5 w-2.5 rounded-full bg-umx-orange" />
                              )}
                            </span>
                            {method.icon}
                            <span className="font-display text-sm font-bold text-black">
                              {method.title}
                            </span>
                          </button>

                          {on && method.id === "card" && (
                            <div className="space-y-3 border-t border-umx-orange/15 px-4 pt-4 pb-4">
                              <Field label="Card Number">
                                <div className="relative">
                                  <input
                                    className={`${inputClass} pr-12`}
                                    value={form.cardNumber}
                                    onChange={(e) =>
                                      update("cardNumber", e.target.value)
                                    }
                                    placeholder="ACCT-000003"
                                    inputMode="numeric"
                                  />
                                  <CreditCard
                                    className="pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-umx-orange"
                                    strokeWidth={2.1}
                                    aria-hidden
                                  />
                                </div>
                              </Field>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Name on card" className="sm:col-span-2">
                                  <input
                                    className={inputClass}
                                    value={form.cardName}
                                    onChange={(e) =>
                                      update("cardName", e.target.value)
                                    }
                                    placeholder="Name on card"
                                  />
                                </Field>
                                <Field label="Expire date (MM / YY)">
                                  <input
                                    className={inputClass}
                                    value={form.cardExpiry}
                                    onChange={(e) =>
                                      update("cardExpiry", e.target.value)
                                    }
                                    placeholder="MM / YY"
                                  />
                                </Field>
                                <Field label="CVV">
                                  <input
                                    className={inputClass}
                                    value={form.cardCvv}
                                    onChange={(e) =>
                                      update("cardCvv", e.target.value)
                                    }
                                    placeholder="CVV"
                                    inputMode="numeric"
                                  />
                                </Field>
                              </div>
                              <p className="font-body text-xs text-black">
                                Preview fields only — not processed until Stripe
                                is connected.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {error && (
                    <p className="mt-4 font-display text-sm font-semibold text-umx-orange-deep">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={placeOrder}
                    disabled={submitting}
                    className="mt-7 w-full rounded-2xl bg-umx-orange py-4 font-display text-base font-semibold text-white shadow-[0_14px_30px_rgba(255,91,4,0.28)] transition hover:bg-umx-orange-mid disabled:opacity-50"
                  >
                    {submitting
                      ? "Processing…"
                      : `Pay | $${grandTotal.toFixed(2)}`}
                  </button>

                  <label className="mt-4 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.ageConfirmed}
                      onChange={(e) => update("ageConfirmed", e.target.checked)}
                      className="mt-1 h-4 w-4 accent-umx-orange"
                    />
                    <span className="font-body text-sm leading-relaxed text-black">
                      By clicking this, I confirm I am{" "}
                      <span className="font-semibold text-umx-orange-deep">21+</span>, agree
                      to UMAXES terms, and understand nicotine is addictive.
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep(1);
                    }}
                    className="mt-5 font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
                  >
                    ← Back to personal details
                  </button>
                </>
              )}
            </div>

            <div className="lg:sticky lg:top-8">
              <CartSummary
                quantity={quantity}
                total={total}
                shipping={shipping}
                discount={discount}
                grandTotal={grandTotal}
                items={items}
                coupon={coupon}
                onApplyCoupon={applyCoupon}
                onRemoveCoupon={() => setCoupon(null)}
                onSetQuantity={setQuantity}
                onRemove={remove}
              />
            </div>
          </div>
        )}

        {step !== 3 && (
          <div className="mt-6 rounded-[1.75rem] bg-white p-5 shadow-[0_12px_30px_rgba(61,22,5,0.05)] ring-1 ring-umx-orange/15 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-7">
            <div className="max-w-2xl">
              <h2 className="font-display text-lg font-bold text-black">
                Adult purchase policy
              </h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-black">
                UMAXES products are for adults 21+ only. Nicotine is an addictive
                chemical. Orders may be age-verified at delivery.
              </p>
              <Link
                href="/faq"
                className="mt-3 inline-block font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
              >
                See more details
              </Link>
            </div>
            <div className="mt-5 hidden h-24 w-36 shrink-0 items-center justify-center rounded-2xl bg-umx-orange sm:mt-0 sm:flex">
              <span className="font-display text-3xl font-extrabold text-white">
                21+
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
