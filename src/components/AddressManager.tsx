"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Check,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  Warehouse,
} from "lucide-react";
import {
  EMPTY_ADDRESS_FORM,
  ShippingAddressForm,
  deleteAddress,
  fetchAddresses,
  formFromAddress,
  saveAddress,
  setDefaultAddress,
  type AddressFormValues,
  type ShippingAddress,
} from "@/components/ShippingAddressForm";
import { useAppFeedback } from "@/components/ui/AppFeedback";

export default function AddressManager() {
  const { data: session } = useSession();
  const canManage = session?.user?.companyRole !== "FINANCE";
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [max, setMax] = useState(10);
  const [form, setForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { confirm, showToast, ui } = useAppFeedback();

  async function load() {
    const data = await fetchAddresses();
    if (data.error) {
      setError(data.error);
    } else {
      setAddresses(data.addresses);
      setMax(data.max);
      if (data.addresses.length === 0) {
        setShowForm(true);
        setEditingId(null);
        setForm(EMPTY_ADDRESS_FORM);
      }
    }
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  const atLimit = addresses.length >= max;

  function startAdd() {
    setError(null);
    setEditingId(null);
    setForm(EMPTY_ADDRESS_FORM);
    setShowForm(true);
  }

  function startEdit(address: ShippingAddress) {
    setError(null);
    setEditingId(address.id);
    setForm(formFromAddress(address));
    setShowForm(true);
  }

  function cancelForm() {
    setError(null);
    setEditingId(null);
    setForm(EMPTY_ADDRESS_FORM);
    setShowForm(addresses.length === 0);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await saveAddress(form, editingId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setForm(EMPTY_ADDRESS_FORM);
    setEditingId(null);
    setShowForm(false);
    await load();
    showToast(
      editingId ? "Address updated successfully" : "Address saved successfully",
      "success",
    );
  }

  async function setDefault(id: string) {
    setBusyId(id);
    setError(null);
    const result = await setDefaultAddress(id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
    showToast("Default shipping address updated", "success");
  }

  async function remove(id: string) {
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
    setBusyId(id);
    setError(null);
    const result = await deleteAddress(id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) cancelForm();
    await load();
    showToast("Address deleted", "danger");
  }

  return (
    <div className="space-y-8">
      {ui}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold text-black">
            Shipping addresses
          </p>
          <p className="mt-1 font-body text-sm text-black">
            Used at checkout for delivery. Edit or delete a saved location any
            time.
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
          {canManage && !showForm ? (
            <button
              type="button"
              disabled={atLimit}
              onClick={startAdd}
              className="inline-flex items-center gap-2 rounded-full bg-umx-orange px-4 py-2.5 font-display text-sm font-semibold text-umx-cream shadow-[0_10px_24px_rgba(27,79,114,0.28)] transition hover:bg-umx-orange-deep disabled:cursor-not-allowed disabled:opacity-50"
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
                const selected = editingId === a.id;
                return (
                  <li
                    key={a.id}
                    className={`relative flex flex-col rounded-2xl border bg-umx-cream-bright/95 p-5 shadow-[0_12px_32px_rgba(61,22,5,0.04)] transition ${
                      selected
                        ? "border-umx-orange/55 ring-1 ring-umx-orange/25"
                        : a.isDefault
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
                      {a.recipientName || a.label || "Shipping address"}
                    </p>
                    {a.recipientName && a.label ? (
                      <p className="mt-0.5 font-body text-xs text-black/55">
                        {a.label}
                      </p>
                    ) : null}
                    <div className="mt-2 space-y-0.5 font-body text-sm leading-relaxed text-black">
                      {a.phone ? <p>{a.phone}</p> : null}
                      <p>{a.line1}</p>
                      <p>
                        {a.city}
                        {a.region ? `, ${a.region}` : ""} {a.postalCode}
                      </p>
                      <p>{a.country}</p>
                    </div>

                    {canManage ? (
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-black/6 pt-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startEdit(a)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-umx-orange/30 bg-white px-3 py-2 font-display text-xs font-semibold text-umx-orange transition hover:border-umx-orange hover:bg-umx-orange-wash disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                          Edit
                        </button>
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
                          Delete
                        </button>
                      </div>
                    ) : (
                      <p className="mt-5 border-t border-black/6 pt-4 font-body text-xs text-black/55">
                        Finance users can view addresses but cannot change them.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="xl:col-span-2">
          {canManage && (showForm || addresses.length === 0) ? (
            <div className="sticky top-28 rounded-2xl border border-black/8 bg-umx-cream-bright/95 p-6 shadow-[0_16px_40px_rgba(61,22,5,0.05)] sm:p-7">
              <ShippingAddressForm
                form={form}
                setForm={setForm}
                onSubmit={onSubmit}
                onCancel={addresses.length > 0 ? cancelForm : undefined}
                loading={loading}
                title={
                  editingId ? "Edit shipping address" : "Add shipping address"
                }
                description="Used at checkout for delivery."
                submitLabel={editingId ? "Save changes" : "Save address"}
                showCancel={addresses.length > 0}
                disabled={!editingId && atLimit}
              />
            </div>
          ) : canManage ? (
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
                onClick={startAdd}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2.5 font-display text-sm font-semibold transition hover:border-umx-orange hover:text-umx-orange disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add address
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/12 bg-umx-cream-bright/60 px-6 py-10 text-center">
              <p className="font-display text-sm font-semibold text-black">
                View only
              </p>
              <p className="mt-2 font-body text-sm text-black">
                Ask an owner or buyer on this account to add or change
                addresses.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
