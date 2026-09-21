"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminCard, AdminBadge } from "@/components/admin/ui";
import { Plus, Search } from "lucide-react";
import type { CustomerLevel, PaymentMethod } from "@/generated/prisma/enums";
import { casesFromPcs, formatCases, formatPack, pcsFromCases } from "@/lib/pack";
import {
  TEST_STATION_NAME,
  TEST_STATION_PER_CASE_COPY,
  formatTestStationQty,
} from "@/lib/test-station";

export type CreateOrderCompanyOption = {
  id: string;
  name: string;
  level: CustomerLevel;
  creditAllowed: boolean;
  creditLimit?: number;
  creditUsed?: number;
  paymentTermsDays?: number;
  addressCount: number;
  contactName: string | null;
};

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

type CatalogItem = {
  id: string;
  sku: string;
  name: string;
  image: string | null;
  unitPrice: number;
  moq: number;
  stock: number;
};

type CompanyContext = {
  company: {
    id: string;
    name: string;
    level: CustomerLevel;
    creditAllowed: boolean;
    testStationsPerCase?: number;
    pcsPerCase?: number;
  };
  addresses: Address[];
  catalog: CatalogItem[];
};

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function levelLabel(level: CustomerLevel) {
  if (level === "DISTRO") return "Distributor";
  if (level === "WHOLESALER") return "Wholesaler";
  return "Retail";
}

export default function CreateOrderPanel({
  companies,
  initialCompanyId,
}: {
  companies: CreateOrderCompanyOption[];
  initialCompanyId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [ctx, setCtx] = useState<CompanyContext | null>(null);
  const [loadingCtx, setLoadingCtx] = useState(false);
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TT");
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [qtyBySku, setQtyBySku] = useState<Record<string, number>>({});
  const [catalogQuery, setCatalogQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.contactName || "").toLowerCase().includes(q) ||
        c.level.toLowerCase().includes(q),
    );
  }, [companies, query]);

  const lines = useMemo(() => {
    if (!ctx) return [];
    return ctx.catalog
      .filter((p) => (qtyBySku[p.sku] || 0) > 0)
      .map((p) => ({
        sku: p.sku,
        name: p.name,
        unitPrice: p.unitPrice,
        moq: p.moq,
        quantity: qtyBySku[p.sku] || 0,
      }));
  }, [ctx, qtyBySku]);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [lines],
  );
  const sellingQty = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  );
  const pcsPerCase = ctx?.company.pcsPerCase || 95;
  const cartCases = useMemo(() => casesFromPcs(sellingQty), [sellingQty]);
  const stationQty = useMemo(() => {
    const per = ctx?.company.testStationsPerCase || 0;
    if (per < 1 || sellingQty < 1) return 0;
    return casesFromPcs(sellingQty) * per;
  }, [ctx?.company.testStationsPerCase, sellingQty]);

  const catalogFiltered = useMemo(() => {
    if (!ctx) return [];
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return ctx.catalog;
    return ctx.catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [ctx, catalogQuery]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === companyId) || null,
    [companies, companyId],
  );

  async function selectCompany(id: string) {
    setCompanyId(id);
    setCtx(null);
    setAddressId("");
    setQtyBySku({});
    setError(null);
    setOk(null);
    setPaymentMethod("TT");
    if (!id) return;

    setLoadingCtx(true);
    try {
      const res = await fetch(`/api/admin/orders?companyId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load company");
        return;
      }
      setCtx(data);
      const def =
        data.addresses.find((a: Address) => a.isDefault) || data.addresses[0];
      setAddressId(def?.id || "");
      if (!data.company.creditAllowed) setPaymentMethod("TT");
    } catch {
      setError("Could not load company");
    } finally {
      setLoadingCtx(false);
    }
  }

  const autoSelected = useRef(false);
  useEffect(() => {
    if (autoSelected.current || !initialCompanyId) return;
    if (!companies.some((c) => c.id === initialCompanyId)) return;
    autoSelected.current = true;
    const id = initialCompanyId;
    void Promise.resolve().then(() => selectCompany(id));
  }, [initialCompanyId, companies]);

  function setCases(sku: string, stockPcs: number, raw: string) {
    const cases = Math.floor(Number(raw) || 0);
    const maxCases = Math.floor(stockPcs / pcsPerCase);
    setQtyBySku((prev) => {
      const next = { ...prev };
      if (cases <= 0) {
        delete next[sku];
      } else {
        const clamped = Math.min(maxCases, Math.max(1, cases));
        next[sku] = pcsFromCases(clamped);
      }
      return next;
    });
  }

  function bumpCases(sku: string, stockPcs: number, delta: number) {
    const currentPcs = qtyBySku[sku] || 0;
    const currentCases = casesFromPcs(currentPcs);
    const nextCases = currentCases + delta;
    setCases(sku, stockPcs, String(nextCases));
  }

  function submit() {
    if (!companyId || !ctx) return;
    setError(null);
    setOk(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            addressId,
            paymentMethod,
            paymentRef: paymentRef || undefined,
            notes: notes || undefined,
            couponCode:
              ctx.company.level === "SHOP" ? couponCode || undefined : undefined,
            items: lines.map((l) => ({ sku: l.sku, quantity: l.quantity })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not create order");
          return;
        }
        setOk(`Created ${data.order.orderNumber}`);
        setQtyBySku({});
        setPaymentRef("");
        setNotes("");
        setCouponCode("");
        router.refresh();
        router.push("/admin/orders");
      } catch {
        setError("Could not create order");
      }
    });
  }

  return (
    <div className="space-y-6">
      <AdminCard>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--admin-text)]">
              1. Select customer
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Create the company first under Add user if they are new.
            </p>
          </div>
          <label className="relative block w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company…"
              className="admin-input w-full !pl-9"
            />
          </label>
        </div>

        <div className="admin-table-wrap max-h-72 overflow-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Level</th>
                <th>Contact</th>
                <th>Ship-tos</th>
                <th className="text-right">Select</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-sm text-[var(--admin-muted)]">
                    No approved companies found.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => {
                  const selected = companyId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className={
                        selected ? "bg-[var(--admin-brand-50)]/40" : undefined
                      }
                    >
                      <td className="font-medium">{c.name}</td>
                      <td>
                        <AdminBadge
                          tone={
                            c.level === "DISTRO"
                              ? "brand"
                              : c.level === "WHOLESALER"
                                ? "neutral"
                                : "success"
                          }
                        >
                          {levelLabel(c.level)}
                        </AdminBadge>
                      </td>
                      <td className="text-sm text-[var(--admin-muted)]">
                        {c.contactName || "—"}
                      </td>
                      <td className="tabular-nums">{c.addressCount}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => selectCompany(c.id)}
                          className={`admin-btn admin-btn-sm ${
                            selected
                              ? "admin-btn-primary"
                              : "admin-btn-secondary"
                          }`}
                        >
                          {selected ? "Selected" : "Select"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {loadingCtx ? (
        <AdminCard>
          <p className="text-sm text-[var(--admin-muted)]">Loading catalog…</p>
        </AdminCard>
      ) : null}

      {ctx ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminCard>
              <p className="text-[11px] font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
                Customer
              </p>
              <p className="mt-2 font-semibold">{ctx.company.name}</p>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {levelLabel(ctx.company.level)}
              </p>
            </AdminCard>
            <AdminCard>
              <p className="text-[11px] font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
                Credit
              </p>
              {ctx.company.creditAllowed ? (
                <p className="mt-2 font-semibold">
                  {typeof selectedCompany?.creditLimit === "number" ? (
                    <span className="tabular-nums">
                      {money(selectedCompany.creditUsed ?? 0)} /{" "}
                      {money(selectedCompany.creditLimit)}
                    </span>
                  ) : (
                    "Enabled"
                  )}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[var(--admin-muted)]">
                  No trade credit (pay TT / check)
                </p>
              )}
            </AdminCard>
            <AdminCard>
              <p className="text-[11px] font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
                Cart
              </p>
              <p className="mt-2 font-semibold tabular-nums">
                {cartCases > 0 ? formatPack(sellingQty) : "Empty"}
              </p>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {levelLabel(ctx.company.level)} price · {money(subtotal)}
                {stationQty > 0
                  ? ` · +${formatTestStationQty(stationQty)} free`
                  : ""}
              </p>
            </AdminCard>
          </div>

          <AdminCard>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">2. Add products</h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  Same as the storefront: sold by the case ({pcsPerCase} pcs).
                  Test stations add automatically for channel accounts.
                </p>
              </div>
              <label className="relative block w-full max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
                <input
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  placeholder="Search SKU or name…"
                  className="admin-input w-full !pl-9"
                />
              </label>
            </div>

            <div className="admin-table-wrap max-h-96 overflow-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th className="w-40">Cases</th>
                    <th>Pcs</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogFiltered.map((p) => {
                    const pcs = qtyBySku[p.sku] || 0;
                    const cases = casesFromPcs(pcs);
                    const stockCases = Math.floor(p.stock / pcsPerCase);
                    const disabled = p.stock < pcsPerCase || p.unitPrice <= 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-[var(--admin-muted)]">
                            {p.sku}
                            {p.unitPrice > 0
                              ? ` · ${money(p.unitPrice)}/pc`
                              : " · no price"}
                          </p>
                        </td>
                        <td className="tabular-nums text-sm">
                          {stockCases > 0
                            ? formatCases(stockCases)
                            : "0 cases"}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={disabled || cases < 1}
                              onClick={() => bumpCases(p.sku, p.stock, -1)}
                              className="admin-btn admin-btn-secondary admin-btn-sm !px-2"
                              aria-label="Remove one case"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              disabled={disabled}
                              value={cases || ""}
                              onChange={(e) =>
                                setCases(p.sku, p.stock, e.target.value)
                              }
                              placeholder="0"
                              className="admin-input w-16 text-center tabular-nums"
                            />
                            <button
                              type="button"
                              disabled={disabled || cases >= stockCases}
                              onClick={() => bumpCases(p.sku, p.stock, 1)}
                              className="admin-btn admin-btn-secondary admin-btn-sm !px-2"
                              aria-label="Add one case"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="tabular-nums text-sm text-[var(--admin-muted)]">
                          {pcs > 0 ? pcs.toLocaleString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-4 text-base font-semibold">
              3. Ship-to & payment
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                Ship-to address
                <select
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  className="admin-input mt-1.5 w-full"
                >
                  <option value="">Select address…</option>
                  {ctx.addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {(a.label || "Address") +
                        ` — ${a.line1}, ${a.city}` +
                        (a.isDefault ? " (default)" : "")}
                    </option>
                  ))}
                </select>
                {ctx.addresses.length === 0 ? (
                  <span className="mt-2 block text-sm text-amber-700">
                    Add a ship-to on the customer page before ordering.
                  </span>
                ) : null}
              </label>

              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                Payment method
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                  className="admin-input mt-1.5 w-full"
                >
                  <option value="TT">Telegraphic transfer (TT)</option>
                  <option value="CHECK">Check</option>
                  <option value="ONLINE">Online (pending gateway)</option>
                  {ctx.company.creditAllowed ? (
                    <option value="CREDIT">Credit</option>
                  ) : null}
                </select>
              </label>

              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                Payment reference
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="admin-input mt-1.5 w-full"
                  placeholder="Optional TT / check ref"
                />
              </label>

              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                {ctx.company.level === "SHOP" ? "Coupon code" : "Channel rebate"}
                {ctx.company.level === "SHOP" ? (
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="admin-input mt-1.5 w-full"
                  placeholder="Optional"
                />
                ) : (
                  <p className="mt-1.5 text-sm text-[var(--admin-gray-700)]">
                    {TEST_STATION_PER_CASE_COPY}. First-order unpaid pcs apply
                    automatically. No coupon code.
                  </p>
                )}
              </label>

              <label className="block text-xs font-medium text-[var(--admin-muted)] lg:col-span-2">
                Notes
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="admin-input mt-1.5 w-full"
                  placeholder="Internal or customer-facing note"
                />
              </label>
            </div>

            {lines.length > 0 ? (
              <div className="mt-5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
                <p className="text-xs font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
                  Order lines
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {lines.map((l) => (
                    <li
                      key={l.sku}
                      className="flex justify-between gap-3 tabular-nums"
                    >
                      <span>
                        {l.name} · {formatPack(l.quantity)}
                      </span>
                      <span className="font-medium">
                        {money(l.unitPrice * l.quantity)}
                      </span>
                    </li>
                  ))}
                  {stationQty > 0 ? (
                    <li className="flex justify-between gap-3 tabular-nums">
                      <span>
                        {TEST_STATION_NAME} · {formatTestStationQty(stationQty)}{" "}
                        · free
                      </span>
                      <span className="font-medium">{money(0)}</span>
                    </li>
                  ) : null}
                </ul>
                <div className="mt-3 flex justify-between border-t border-[var(--admin-border)] pt-3 font-semibold">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{money(subtotal)}</span>
                </div>
                {ctx.company.level !== "SHOP" ? (
                  <p className="mt-2 text-xs text-[var(--admin-muted)]">
                    Channel rebate program applies — same as storefront checkout
                    ({TEST_STATION_PER_CASE_COPY}).
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p className="mt-4 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            {ok ? (
              <p className="mt-4 text-sm text-emerald-700" role="status">
                {ok}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={
                  pending ||
                  !addressId ||
                  lines.length === 0 ||
                  ctx.addresses.length === 0
                }
                onClick={submit}
                className="admin-btn admin-btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {pending ? "Creating…" : "Create order"}
              </button>
              <p className="self-center text-xs text-[var(--admin-muted)]">
                Credit orders confirm immediately. TT / check stay payment
                pending until Sales confirms.
              </p>
            </div>
          </AdminCard>
        </>
      ) : null}
    </div>
  );
}
