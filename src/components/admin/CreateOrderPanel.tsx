"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminCard, AdminBadge } from "@/components/admin/ui";
import { Plus, Search } from "lucide-react";
import type { CustomerLevel, PaymentMethod } from "@/generated/prisma/enums";

export type CreateOrderCompanyOption = {
  id: string;
  name: string;
  level: CustomerLevel;
  creditLimit: number;
  creditUsed: number;
  paymentTermsDays: number;
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
    creditLimit: number;
    creditUsed: number;
    creditAvailable: number;
    paymentTermsDays: number;
    creditAllowed: boolean;
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
}: {
  companies: CreateOrderCompanyOption[];
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

  const catalogFiltered = useMemo(() => {
    if (!ctx) return [];
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return ctx.catalog;
    return ctx.catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [ctx, catalogQuery]);

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

  function setQty(sku: string, moq: number, stock: number, raw: string) {
    const n = Math.floor(Number(raw) || 0);
    setQtyBySku((prev) => {
      const next = { ...prev };
      if (n <= 0) {
        delete next[sku];
      } else {
        next[sku] = Math.min(stock, Math.max(moq, n));
      }
      return next;
    });
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
            couponCode: couponCode || undefined,
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
              Create the company first under Distributors / Wholesalers / Retail
              if they are new.
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
                <>
                  <p className="mt-2 font-semibold tabular-nums">
                    {money(ctx.company.creditAvailable)} available
                  </p>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">
                    {ctx.company.paymentTermsDays}d terms · limit{" "}
                    {money(ctx.company.creditLimit)}
                  </p>
                </>
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
                {lines.length} SKU · {money(subtotal)}
              </p>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                Prices for {levelLabel(ctx.company.level)} level
              </p>
            </AdminCard>
          </div>

          <AdminCard>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">2. Add products</h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  Qty must meet MOQ and available stock.
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
                    <th>Unit</th>
                    <th>MOQ</th>
                    <th>Stock</th>
                    <th className="w-28">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogFiltered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {p.sku}
                        </p>
                      </td>
                      <td className="tabular-nums">{money(p.unitPrice)}</td>
                      <td className="tabular-nums">{p.moq}</td>
                      <td className="tabular-nums">{p.stock}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          disabled={p.stock < p.moq || p.unitPrice <= 0}
                          value={qtyBySku[p.sku] ?? ""}
                          onChange={(e) =>
                            setQty(p.sku, p.moq, p.stock, e.target.value)
                          }
                          placeholder="0"
                          className="admin-input w-full"
                        />
                      </td>
                    </tr>
                  ))}
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
                    <option value="CREDIT">
                      Credit ({money(ctx.company.creditAvailable)} available)
                    </option>
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
                Coupon code
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="admin-input mt-1.5 w-full"
                  placeholder="Optional"
                />
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
                        {l.name} × {l.quantity}
                      </span>
                      <span className="font-medium">
                        {money(l.unitPrice * l.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t border-[var(--admin-border)] pt-3 font-semibold">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{money(subtotal)}</span>
                </div>
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
