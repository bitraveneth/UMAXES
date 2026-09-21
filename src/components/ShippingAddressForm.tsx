"use client";

import { FormEvent } from "react";

export type ShippingAddress = {
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

export type AddressFormValues = {
  label: string;
  line1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export const EMPTY_ADDRESS_FORM: AddressFormValues = {
  label: "",
  line1: "",
  city: "",
  region: "",
  postalCode: "",
  country: "United States",
  isDefault: false,
};

export const ADDRESS_FIELD_CLASS =
  "mt-1.5 w-full rounded-xl border border-black/12 bg-umx-cream-bright px-3.5 py-3 font-body text-sm text-black outline-none transition placeholder:text-black focus:border-umx-orange focus:ring-2 focus:ring-umx-orange/20";

export function formFromAddress(a: ShippingAddress): AddressFormValues {
  return {
    label: a.label || "",
    line1: a.line1,
    city: a.city,
    region: a.region || "",
    postalCode: a.postalCode,
    country: a.country,
    isDefault: a.isDefault,
  };
}

export function addressPayload(form: AddressFormValues) {
  return {
    label: form.label.trim() || null,
    line1: form.line1.trim(),
    line2: null as string | null,
    city: form.city.trim(),
    region: form.region.trim() || null,
    postalCode: form.postalCode.trim(),
    country: form.country.trim(),
    isDefault: form.isDefault,
  };
}

export async function fetchAddresses(): Promise<{
  addresses: ShippingAddress[];
  max: number;
  error?: string;
}> {
  const res = await fetch("/api/addresses");
  const data = await res.json();
  if (!res.ok) {
    return {
      addresses: [],
      max: 10,
      error: data.error || "Could not load addresses",
    };
  }
  return {
    addresses: data.addresses || [],
    max: data.max || 10,
  };
}

export async function saveAddress(
  form: AddressFormValues,
  editingId?: string | null,
): Promise<{ ok: true; address: ShippingAddress } | { ok: false; error: string }> {
  const res = await fetch(
    editingId ? `/api/addresses/${editingId}` : "/api/addresses",
    {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressPayload(form)),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error || "Could not save" };
  }
  return { ok: true, address: data.address };
}

export async function deleteAddress(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || "Could not delete address" };
  }
  return { ok: true };
}

export async function setDefaultAddress(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`/api/addresses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isDefault: true }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error || "Could not update default" };
  }
  return { ok: true };
}

export function confirmDeleteAddress(isLast: boolean) {
  if (isLast) {
    return window.confirm(
      "Delete this shipping address? It is your only saved address. You will need to add a new one before placing an order.",
    );
  }
  return window.confirm("Delete this shipping address?");
}

export function ShippingAddressForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  loading,
  title,
  description,
  submitLabel,
  showCancel = false,
  disabled = false,
}: {
  form: AddressFormValues;
  setForm: (updater: (prev: AddressFormValues) => AddressFormValues) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel?: () => void;
  loading: boolean;
  title: string;
  description?: string;
  submitLabel: string;
  showCancel?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-black">{title}</p>
          {description ? (
            <p className="mt-1 font-body text-sm text-black">{description}</p>
          ) : null}
        </div>
        {showCancel && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="font-display text-xs font-semibold text-black hover:text-umx-orange"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="font-display text-xs font-semibold tracking-wide text-black uppercase">
            Label
          </span>
          <input
            value={form.label}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, label: e.target.value }))
            }
            placeholder="Warehouse, store, HQ…"
            className={ADDRESS_FIELD_CLASS}
          />
        </label>

        <label className="block">
          <span className="font-display text-xs font-semibold tracking-wide text-black uppercase">
            Address *
          </span>
          <input
            required
            value={form.line1}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, line1: e.target.value }))
            }
            className={ADDRESS_FIELD_CLASS}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="font-display text-xs font-semibold tracking-wide text-black uppercase">
              City *
            </span>
            <input
              required
              value={form.city}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, city: e.target.value }))
              }
              className={ADDRESS_FIELD_CLASS}
            />
          </label>
          <label className="block">
            <span className="font-display text-xs font-semibold tracking-wide text-black uppercase">
              State / region
            </span>
            <input
              value={form.region}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, region: e.target.value }))
              }
              className={ADDRESS_FIELD_CLASS}
            />
          </label>
          <label className="block">
            <span className="font-display text-xs font-semibold tracking-wide text-black uppercase">
              ZIP / postal *
            </span>
            <input
              required
              value={form.postalCode}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  postalCode: e.target.value,
                }))
              }
              className={ADDRESS_FIELD_CLASS}
            />
          </label>
        </div>

        <label className="block">
          <span className="font-display text-xs font-semibold tracking-wide text-black uppercase">
            Country *
          </span>
          <input
            required
            value={form.country}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, country: e.target.value }))
            }
            className={ADDRESS_FIELD_CLASS}
          />
        </label>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/8 bg-umx-orange-wash/40 px-4 py-3">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                isDefault: e.target.checked,
              }))
            }
            className="h-4 w-4 accent-umx-orange"
          />
          <span className="font-display text-sm font-semibold text-black">
            Set as default ship-to
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || disabled}
          className="w-full rounded-full bg-umx-orange py-3.5 font-display text-sm font-semibold text-umx-cream shadow-[0_12px_28px_rgba(27,79,114,0.3)] transition hover:bg-umx-orange-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
      </form>
    </div>
  );
}
