"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import type { FlavorId } from "@/lib/assets";

type OrderOption = {
  id: string;
  orderNumber: string;
  items: {
    id: string;
    sku: string;
    name: string;
    quantity: number;
    image?: string | null;
  }[];
};

type RmaRow = {
  id: string;
  rmaNumber: string;
  status: string;
  reason: string;
  reasonType?: string;
  order: { orderNumber: string };
  items?: { name: string; flavor?: string | null; quantity: number }[];
};

export default function RmaManager() {
  const { add, clear, setOpen } = useCart();
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [rmas, setRmas] = useState<RmaRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [reasonType, setReasonType] = useState("RETURN");
  const [reason, setReason] = useState("");
  const [replacementNeeded, setReplacementNeeded] = useState(false);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = useMemo(
    () => orders.find((o) => o.id === orderId) || null,
    [orders, orderId],
  );

  async function load() {
    const [o, r] = await Promise.all([
      fetch("/api/orders").then((x) => x.json()),
      fetch("/api/account/rma").then((x) => x.json()),
    ]);
    const list = (o.orders || []).map(
      (ord: {
        id: string;
        orderNumber: string;
        items: {
          id: string;
          sku: string;
          name: string;
          quantity: number;
          image?: string | null;
        }[];
      }) => ({
        id: ord.id,
        orderNumber: ord.orderNumber,
        items: ord.items,
      }),
    );
    setOrders(list);
    if (list[0] && !orderId) {
      setOrderId(list[0].id);
      const init: Record<string, number> = {};
      for (const line of list[0].items) init[line.id] = line.quantity;
      setQtys(init);
    }
    setRmas(r.rmas || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickOrder(id: string) {
    setOrderId(id);
    const ord = orders.find((o) => o.id === id);
    const init: Record<string, number> = {};
    for (const line of ord?.items || []) init[line.id] = 0;
    setQtys(init);
  }

  async function submitRma(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const items = order.items
      .map((i) => ({
        orderItemId: i.id,
        sku: i.sku,
        name: i.name,
        flavor: i.name,
        quantity: qtys[i.id] || 0,
      }))
      .filter((i) => i.quantity > 0);
    if (!items.length) {
      setError("Select quantity for at least one product.");
      return;
    }
    const res = await fetch("/api/account/rma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        reason,
        reasonType,
        replacementNeeded,
        items,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "RMA failed");
      return;
    }
    setReason("");
    setReplacementNeeded(false);
    setMsg(`RMA ${data.rma.rmaNumber} submitted`);
    await load();
  }

  async function reorder(id: string) {
    const res = await fetch(`/api/orders/${id}/reorder`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Reorder failed");
      return;
    }
    clear();
    for (const item of data.items as { flavorId: string; quantity: number }[]) {
      add(item.flavorId as FlavorId, item.quantity);
    }
    setOpen(true);
    setMsg(`Cart filled from ${data.orderNumber}`);
  }

  return (
    <div className="space-y-10">
      <section className="border border-black/10 bg-white p-6">
        <h2 className="font-display text-lg font-semibold">Quick reorder</h2>
        <ul className="mt-4 space-y-2">
          {orders.slice(0, 8).map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between gap-3 font-body text-sm"
            >
              <span>{o.orderNumber}</span>
              <button
                type="button"
                onClick={() => reorder(o.id)}
                className="font-display text-xs font-semibold text-umx-orange"
              >
                Reorder
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-black/10 bg-white p-6">
        <h2 className="font-display text-lg font-semibold">Request return</h2>
        <form onSubmit={submitRma} className="mt-4 space-y-3">
          <label className="block font-display text-sm font-semibold">
            Order
            <select
              value={orderId}
              onChange={(e) => pickOrder(e.target.value)}
              className="mt-1 w-full border border-black/15 px-3 py-2.5 font-body font-normal"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber}
                </option>
              ))}
            </select>
          </label>

          <label className="block font-display text-sm font-semibold">
            Type
            <select
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value)}
              className="mt-1 w-full border border-black/15 px-3 py-2.5 font-body font-normal"
            >
              <option value="RETURN">Return</option>
              <option value="DAMAGE">Damage</option>
              <option value="DEFECT">Defect</option>
              <option value="OTHER">Other</option>
            </select>
          </label>

          {selected ? (
            <div className="space-y-2 rounded border border-black/10 p-3">
              <p className="font-display text-sm font-semibold">
                Products / flavors
              </p>
              {selected.items.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between gap-3 font-body text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {line.name}{" "}
                    <span className="text-black">(max {line.quantity})</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={line.quantity}
                    value={qtys[line.id] ?? 0}
                    onChange={(e) =>
                      setQtys((prev) => ({
                        ...prev,
                        [line.id]: Math.max(
                          0,
                          Math.min(
                            line.quantity,
                            Math.floor(Number(e.target.value) || 0),
                          ),
                        ),
                      }))
                    }
                    className="w-20 border border-black/15 px-2 py-1.5"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <label className="block font-display text-sm font-semibold">
            Reason
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full border border-black/15 px-3 py-2.5 font-body font-normal"
              rows={3}
            />
          </label>

          <label className="flex items-center gap-2 font-body text-sm">
            <input
              type="checkbox"
              checked={replacementNeeded}
              onChange={(e) => setReplacementNeeded(e.target.checked)}
            />
            Request replacement shipment
          </label>

          <button
            type="submit"
            className="border border-black bg-black px-5 py-3 font-display text-sm font-semibold text-umx-cream"
          >
            Submit return
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        {msg && <p className="mt-3 text-sm text-umx-orange">{msg}</p>}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Your returns</h2>
        <ul className="mt-4 divide-y divide-black/8 border border-black/10 bg-white">
          {rmas.length === 0 && (
            <li className="p-4 font-body text-sm text-black">
              No return requests yet.
            </li>
          )}
          {rmas.map((r) => (
            <li key={r.id} className="p-4 font-body text-sm">
              <p className="font-display font-semibold">
                {r.rmaNumber} · {r.status}
                {r.reasonType ? ` · ${r.reasonType}` : ""}
              </p>
              <p className="text-black">
                {r.order.orderNumber} · {r.reason}
              </p>
              {r.items?.length ? (
                <p className="mt-1 text-xs text-black">
                  {r.items
                    .map(
                      (i) =>
                        `${i.flavor || i.name} × ${i.quantity}`,
                    )
                    .join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
