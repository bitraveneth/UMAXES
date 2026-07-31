"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@/generated/prisma/enums";
import { createShipmentPacking } from "@/lib/admin-actions";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import {
  Building2,
  Download,
  ExternalLink,
  MapPin,
  Package,
  Pencil,
  Printer,
  X,
} from "lucide-react";

export type PackingListDetailOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  companyLevel: string;
  addressLines: string[];
  notes: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  boxCount: number | null;
  cbm: number | null;
  weightKg: number | null;
  packingNote: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  lines: {
    id: string;
    orderItemId: string | null;
    sku: string;
    name: string;
    quantity: number;
    flavor: string | null;
    size: string | null;
    boxes: number | null;
  }[];
};

type LineDraft = {
  id: string;
  orderItemId: string;
  sku: string;
  name: string;
  quantity: number;
  flavor: string;
  size: string;
  boxes: string;
};

function statusTone(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "SHIPPED") return "warning" as const;
  if (status === "SENT_TO_SUPPLIER" || status === "PICKING")
    return "brand" as const;
  return "neutral" as const;
}

export default function PackingListDetail({
  order,
  canEdit = false,
}: {
  order: PackingListDetailOrder;
  canEdit?: boolean;
}) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [boxCount, setBoxCount] = useState(String(order.boxCount ?? ""));
  const [cbm, setCbm] = useState(
    order.cbm != null ? String(order.cbm) : "",
  );
  const [weightKg, setWeightKg] = useState(
    order.weightKg != null ? String(order.weightKg) : "",
  );
  const [packingNote, setPackingNote] = useState(order.packingNote || "");
  const [lines, setLines] = useState<LineDraft[]>(() =>
    order.lines.map((l) => ({
      id: l.id,
      orderItemId: l.orderItemId || "",
      sku: l.sku,
      name: l.name,
      quantity: l.quantity,
      flavor: l.flavor || "",
      size: l.size || "",
      boxes: l.boxes != null ? String(l.boxes) : "",
    })),
  );

  const totalUnits = order.lines.reduce((n, l) => n + l.quantity, 0);
  const printHref = `/api/orders/${order.id}/docs?type=packing`;
  const downloadHref = `/api/orders/${order.id}/docs?type=packing&download=1`;

  function statusLabel(status: OrderStatus) {
    const key = `logistics.status${status}`;
    const label = t(key);
    return label === key ? status : label;
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(
        locale === "zh" ? "zh-CN" : "en-US",
        { month: "short", day: "numeric", year: "numeric" },
      );
    } catch {
      return iso.slice(0, 10);
    }
  }

  function startEdit() {
    setBoxCount(String(order.boxCount ?? ""));
    setCbm(order.cbm != null ? String(order.cbm) : "");
    setWeightKg(order.weightKg != null ? String(order.weightKg) : "");
    setPackingNote(order.packingNote || "");
    setLines(
      order.lines.map((l) => ({
        id: l.id,
        orderItemId: l.orderItemId || "",
        sku: l.sku,
        name: l.name,
        quantity: l.quantity,
        flavor: l.flavor || "",
        size: l.size || "",
        boxes: l.boxes != null ? String(l.boxes) : "",
      })),
    );
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function saveEdit() {
    setBusy(true);
    setError(null);
    try {
      await createShipmentPacking(order.id, {
        boxCount: Number(boxCount),
        cbm: Number(cbm),
        weightKg: weightKg ? Number(weightKg) : undefined,
        packingNote: packingNote || undefined,
        lines: lines.map((l) => ({
          orderItemId: l.orderItemId || undefined,
          sku: l.sku,
          name: l.name,
          quantity: l.quantity,
          flavor: l.flavor || undefined,
          size: l.size || undefined,
          boxes: l.boxes ? Number(l.boxes) : undefined,
        })),
      });
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("logistics.packingError"));
    } finally {
      setBusy(false);
    }
  }

  function updateLine(
    id: string,
    field: "flavor" | "size" | "boxes",
    value: string,
  ) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    );
  }

  return (
    <div className="space-y-6">
      <AdminCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--admin-muted)]">
              {t("packingLists.documentTitle")}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--admin-text)]">
              PL-{order.orderNumber}
            </p>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {t("logistics.colOrder")}: {order.orderNumber} ·{" "}
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge tone={statusTone(order.status)}>
              {statusLabel(order.status)}
            </AdminBadge>
            {canEdit && !editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("packingLists.edit")}
              </button>
            ) : null}
            {editing ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <X className="h-3.5 w-3.5" />
                {t("common.cancel")}
              </button>
            ) : null}
            <a
              href={printHref}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              {t("packingLists.printView")}
            </a>
            <a
              href={downloadHref}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              <Download className="h-3.5 w-3.5" />
              {t("packingLists.download")}
            </a>
          </div>
        </div>

        {editing ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("logistics.boxCount")}
              <input
                value={boxCount}
                onChange={(e) => setBoxCount(e.target.value)}
                type="number"
                min={1}
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("logistics.cbm")}
              <input
                value={cbm}
                onChange={(e) => setCbm(e.target.value)}
                type="number"
                min={0}
                step="0.01"
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("logistics.weightKg")}
              <input
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                type="number"
                min={0}
                step="0.1"
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <div className="rounded-xl border border-[var(--admin-border)] px-3 py-3">
              <p className="text-xs text-[var(--admin-muted)]">
                {t("logistics.colQty")}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {totalUnits}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--admin-border)] px-3 py-3">
              <p className="text-xs text-[var(--admin-muted)]">
                {t("logistics.boxCount")}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {order.boxCount ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--admin-border)] px-3 py-3">
              <p className="text-xs text-[var(--admin-muted)]">
                {t("logistics.cbm")}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {order.cbm ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--admin-border)] px-3 py-3">
              <p className="text-xs text-[var(--admin-muted)]">
                {t("logistics.weightKg")}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {order.weightKg ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--admin-border)] px-3 py-3">
              <p className="text-xs text-[var(--admin-muted)]">
                {t("logistics.colQty")}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {totalUnits}
              </p>
            </div>
          </div>
        )}

        {editing ? (
          <label className="mt-4 block text-xs font-medium text-[var(--admin-muted)]">
            {t("logistics.packingNote")}
            <textarea
              value={packingNote}
              onChange={(e) => setPackingNote(e.target.value)}
              rows={2}
              placeholder={t("logistics.packingNotePlaceholder")}
              className="admin-input mt-1.5 w-full"
            />
          </label>
        ) : null}
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--admin-muted)]">
              {t("logistics.customerInfo")}
            </span>
          </div>
          <p className="font-semibold text-[var(--admin-text)]">
            {order.companyName}
          </p>
          <p className="text-xs text-[var(--admin-muted)]">{order.companyLevel}</p>
          <div className="mt-3 space-y-1 text-sm text-[var(--admin-text)]">
            <p>{order.contactName || "—"}</p>
            {order.contactPhone ? <p>{order.contactPhone}</p> : null}
            {order.contactEmail ? (
              <p className="break-all">{order.contactEmail}</p>
            ) : null}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--admin-muted)]">
              {t("logistics.shipAddress")}
            </span>
          </div>
          <div className="space-y-0.5 text-sm text-[var(--admin-text)]">
            {order.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {order.trackingNumber ? (
            <p className="mt-3 text-sm text-[var(--admin-muted)]">
              {t("logistics.trackingNumber")}:{" "}
              <span className="font-medium text-[var(--admin-text)]">
                {order.carrier || "—"} · {order.trackingNumber}
              </span>
            </p>
          ) : null}
          {!editing && order.packingNote ? (
            <p className="mt-3 text-sm text-[var(--admin-text)]">
              <span className="text-[var(--admin-muted)]">
                {t("logistics.packingNote")}:{" "}
              </span>
              {order.packingNote}
            </p>
          ) : null}
        </AdminCard>
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <div>
              <h2 className="admin-section-title mb-0">
                {t("packingLists.linesTitle")}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--admin-muted)]">
                {editing
                  ? t("packingLists.editLinesHint")
                  : t("packingLists.linesHint")}
              </p>
            </div>
          </div>
          {!editing ? (
            <a
              href={printHref}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("packingLists.openPrintable")}
            </a>
          ) : null}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("logistics.colSku")}</th>
                <th>{t("logistics.flavor")}</th>
                <th>{t("logistics.size")}</th>
                <th className="text-right">{t("logistics.qty")}</th>
                <th className="text-right">{t("logistics.lineBoxes")}</th>
              </tr>
            </thead>
            <tbody>
              {(editing ? lines : order.lines).map((line, idx) => (
                <tr key={line.id}>
                  <td className="tabular-nums text-[var(--admin-muted)]">
                    {idx + 1}
                  </td>
                  <td>
                    <p className="font-medium text-[var(--admin-text)]">
                      {line.name}
                    </p>
                    <p className="text-xs text-[var(--admin-muted)]">{line.sku}</p>
                  </td>
                  <td>
                    {editing ? (
                      <input
                        value={(line as LineDraft).flavor}
                        onChange={(e) =>
                          updateLine(line.id, "flavor", e.target.value)
                        }
                        className="admin-input w-full min-w-[6rem]"
                      />
                    ) : (
                      line.flavor || "—"
                    )}
                  </td>
                  <td>
                    {editing ? (
                      <input
                        value={(line as LineDraft).size}
                        onChange={(e) =>
                          updateLine(line.id, "size", e.target.value)
                        }
                        className="admin-input w-full min-w-[4rem]"
                      />
                    ) : (
                      line.size || "—"
                    )}
                  </td>
                  <td className="text-right tabular-nums font-medium">
                    {line.quantity}
                  </td>
                  <td className="text-right tabular-nums">
                    {editing ? (
                      <input
                        value={(line as LineDraft).boxes}
                        onChange={(e) =>
                          updateLine(line.id, "boxes", e.target.value)
                        }
                        type="number"
                        min={0}
                        className="admin-input ml-auto w-20 text-right"
                      />
                    ) : (
                      ("boxes" in line ? line.boxes : null) ?? "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {!editing ? (
              <tfoot>
                <tr>
                  <td colSpan={4} className="text-right font-medium">
                    {t("packingLists.totalUnits")}
                  </td>
                  <td className="text-right tabular-nums font-semibold">
                    {totalUnits}
                  </td>
                  <td className="text-right tabular-nums font-semibold">
                    {order.boxCount ?? "—"}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        {editing ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--admin-border)] px-5 py-4">
            {error ? (
              <p className="mr-auto text-sm text-red-500">{error}</p>
            ) : null}
            <button
              type="button"
              onClick={cancelEdit}
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={busy}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className="admin-btn admin-btn-primary admin-btn-sm"
              disabled={busy}
            >
              {busy ? t("common.loading") : t("packingLists.save")}
            </button>
          </div>
        ) : null}
      </AdminCard>
    </div>
  );
}
