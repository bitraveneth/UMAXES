"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAdminRma } from "@/lib/admin-actions";
import type { CustomerLevel, RmaReasonType } from "@/generated/prisma/enums";
import { useAdminI18n } from "@/components/admin/AdminI18n";

export type CreateRmaOrderOption = {
  id: string;
  orderNumber: string;
  companyName: string;
  companyLevel: CustomerLevel;
  items: {
    id: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    image: string | null;
  }[];
};

export default function AdminCreateRmaForm({
  orders,
}: {
  orders: CreateRmaOrderOption[];
}) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [orderId, setOrderId] = useState(orders[0]?.id || "");
  const [reasonType, setReasonType] = useState<RmaReasonType>("RETURN");
  const [reason, setReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [replacementNeeded, setReplacementNeeded] = useState(false);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const order = useMemo(
    () => orders.find((o) => o.id === orderId) || null,
    [orders, orderId],
  );

  function setQty(id: string, value: number, max: number) {
    setQtys((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(max, Math.floor(value) || 0)),
    }));
  }

  function submit() {
    setError(null);
    if (!order) {
      setError(t("rma.errOrder"));
      return;
    }
    if (!reason.trim()) {
      setError(t("rma.errReason"));
      return;
    }
    const items = order.items
      .map((line) => ({
        orderItemId: line.id,
        quantity: qtys[line.id] || 0,
      }))
      .filter((x) => x.quantity > 0);
    if (!items.length) {
      setError(t("rma.errLines"));
      return;
    }

    startTransition(async () => {
      try {
        await createAdminRma({
          orderId: order.id,
          reason: reason.trim(),
          reasonType,
          replacementNeeded,
          items,
          adminNote,
        });
        setReason("");
        setAdminNote("");
        setQtys({});
        setReplacementNeeded(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("rma.errGeneric"));
      }
    });
  }

  if (!orders.length) {
    return (
      <p className="text-sm text-[var(--admin-muted)]">{t("rma.noOrders")}</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-[var(--admin-muted)]">
          {t("rma.colOrder")}
          <select
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              setQtys({});
            }}
            className="admin-input mt-1.5 w-full"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} · {o.companyName} ({o.companyLevel})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-[var(--admin-muted)]">
          {t("rma.colType")}
          <select
            value={reasonType}
            onChange={(e) => setReasonType(e.target.value as RmaReasonType)}
            className="admin-input mt-1.5 w-full"
          >
            <option value="RETURN">{t("rma.reasonRETURN")}</option>
            <option value="DAMAGE">{t("rma.reasonDAMAGE")}</option>
            <option value="DEFECT">{t("rma.reasonDEFECT")}</option>
            <option value="OTHER">{t("rma.reasonOTHER")}</option>
          </select>
        </label>
      </div>

      <label className="block text-xs font-medium text-[var(--admin-muted)]">
        {t("rma.reasonDetail")}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="admin-input mt-1.5 w-full"
          required
        />
      </label>

      <label className="block text-xs font-medium text-[var(--admin-muted)]">
        {t("rma.adminNote")}
        <input
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          className="admin-input mt-1.5 w-full"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
        <input
          type="checkbox"
          checked={replacementNeeded}
          onChange={(e) => setReplacementNeeded(e.target.checked)}
          className="rounded border-[var(--admin-border)]"
        />
        {t("rma.markReship")}
      </label>

      {order ? (
        <div className="rounded-xl border border-[var(--admin-border)] p-4">
          <p className="mb-1 text-xs font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
            {t("rma.selectLines")}
          </p>
          <p className="mb-3 text-xs text-[var(--admin-muted)]">
            {t("rma.selectLinesHint")}
          </p>
          <ul className="space-y-2">
            {order.items.map((line) => (
              <li
                key={line.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--admin-hover)]/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--admin-text)]">
                    {line.name}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    SKU {line.sku} · max {line.quantity}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={line.quantity}
                  value={qtys[line.id] ?? 0}
                  onChange={(e) =>
                    setQty(line.id, Number(e.target.value), line.quantity)
                  }
                  className="admin-input w-20"
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-[var(--admin-error-500)]">{error}</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="admin-btn admin-btn-primary"
        >
          {t("rma.createRecord")}
        </button>
      </div>
    </div>
  );
}
