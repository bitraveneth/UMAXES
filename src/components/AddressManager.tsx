"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  MapPin,
  Plus,
  Star,
  Trash2,
  Warehouse,
} from "lucide-react";

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

const empty = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "United States",
  isDefault: false,
};

const FIELD_CLASS =
  "mt-1.5 w-full rounded-xl border border-black/12 bg-umx-cream-bright px-3.5 py-3 font-body text-sm text-black outline-none transition placeholder:text-black focus:border-umx-orange focus:ring-2 focus:ring-umx-orange/20";

export default function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [max, setMax] = useState(10);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    if (res.ok) {
      setAddresses(data.addresses || []);
      setMax(data.max || 10);
      if ((data.addresses || []).length === 0) setShowForm(true);
    } else {
      setError(data.error || "Could not load addresses");
    }
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  const atLimit = addresses.length >= max;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not save");
      return;
    }
    setForm(empty);
    setShowForm(false);
    await load();
  }

  async function setDefault(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not update default");
      return;
    }
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this ship-to address?")) return;
    setBusyId(id);
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setBusyId(null);
    await load();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold text-black">
            Saved locations
          </p>
          <p className="mt-1 font-body text-sm text-black">
            Used at checkout for warehouse, store, or HQ delivery.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[9rem]">
            <div className="mb-1.5 flex items-center justify-between font-display text-[11px] font-semibold tracking-wide text-black uppercase">
              <span>Capacity</span>
              <span className="tabular-nums text-black">
                {addresses.length}/{max}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/8">
              <div
                className="h-full rounded-full bg-umx-orange transition-all"
                style={{
                  width: `${Math.min(100, (addresses.length / max) * 100)}%`,
                }}
              />
            </div>
          </div>
          {!showForm ? (
            <button
              type="button"
              disabled={atLimit}
              onClick={() => {
                setError(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-umx-orange px-4 py-2.5 font-display text-sm font-semibold text-umx-cream shadow-[0_10px_24px_rgba(255,91,4,0.28)] transition hover:bg-umx-orange-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add address
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-5">
        <section className="xl:col-span-3">
          {!loaded ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-2xl border border-black/8 bg-umx-cream-warm/40"
                />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-umx-cream-bright/70 px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-umx-orange-wash text-umx-orange">
                <MapPin className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <p className="mt-5 font-display text-lg font-bold text-black">
                No ship-to addresses yet
              </p>
              <p className="mt-2 max-w-sm font-body text-sm text-black">
                Add your first warehouse, store, or HQ location so checkout can
                ship to the right place.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {addresses.map((a) => {
                const busy = busyId === a.id;
                return (
                  <li
                    key={a.id}
                    className={`relative flex flex-col rounded-2xl border bg-umx-cream-bright/95 p-5 shadow-[0_12px_32px_rgba(61,22,5,0.04)] transition ${
                      a.isDefault
                        ? "border-umx-orange/45 ring-1 ring-umx-orange/20"
                        : "border-black/8 hover:border-umx-orange/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          a.isDefault
                            ? "bg-umx-orange text-umx-cream"
                            : "bg-umx-orange-wash text-umx-orange"
                        }`}
                      >
                        <Warehouse className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      {a.isDefault ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-umx-orange px-2.5 py-1 font-display text-[10px] font-semibold tracking-wide text-umx-cream uppercase">
                          <Star className="h-3 w-3" fill="currentColor" />
                          Default
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-4 font-display text-base font-bold text-black">
                      {a.label || "Ship-to location"}
                    </p>
                    <div className="mt-2 space-y-0.5 font-body text-sm leading-relaxed text-black">
                      <p>
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}
                      </p>
                      <p>
                        {a.city}
                        {a.region ? `, ${a.region}` : ""} {a.postalCode}
                      </p>
                      <p>{a.country}</p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-black/6 pt-4">
                      {!a.isDefault ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setDefault(a.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-black/12 bg-white px-3 py-2 font-display text-xs font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2} />
                          Set default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => remove(a.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-display text-xs font-semibold text-red-700/80 transition hover:bg-red-50 hover:text-red-800 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="xl:col-span-2">
          {showForm || addresses.length === 0 ? (
            <div className="sticky top-28 rounded-2xl border border-black/8 bg-umx-cream-bright/95 p-6 shadow-[0_16px_40px_rgba(61,22,5,0.05)] sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-black">
                    Add ship-to
                  </p>
                  <p className="mt-1 font-body text-sm text-black">
                    Label helps your team pick the right stop at checkout.
                  </p>
                </div>
                {addresses.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError(null);
                      setForm(empty);
                    }}
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
                    className={FIELD_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="font-display text-xs font-semibold tracking-wide text-black uppercase">
                    Address line 1 *
                  </span>
                  <input
                    required
                    value={form.line1}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, line1: e.target.value }))
                    }
                    className={FIELD_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="font-display text-xs font-semibold tracking-wide text-black uppercase">
                    Address line 2
                  </span>
                  <input
                    value={form.line2}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, line2: e.target.value }))
                    }
                    className={FIELD_CLASS}
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
                      className={FIELD_CLASS}
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
                      className={FIELD_CLASS}
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
                      className={FIELD_CLASS}
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
                    className={FIELD_CLASS}
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
                  disabled={loading || atLimit}
                  className="w-full rounded-full bg-umx-orange py-3.5 font-display text-sm font-semibold text-umx-cream shadow-[0_12px_28px_rgba(255,91,4,0.3)] transition hover:bg-umx-orange-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Save address"}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/12 bg-umx-cream-bright/60 px-6 py-10 text-center">
              <p className="font-display text-sm font-semibold text-black">
                Need another location?
              </p>
              <p className="mt-2 font-body text-sm text-black">
                You can save up to {max} ship-to addresses.
              </p>
              <button
                type="button"
                disabled={atLimit}
                onClick={() => setShowForm(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2.5 font-display text-sm font-semibold transition hover:border-umx-orange hover:text-umx-orange disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add address
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
