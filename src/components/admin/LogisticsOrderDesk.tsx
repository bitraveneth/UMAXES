"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createShipmentPacking,
  upsertShipment,
  updateOrderStatus,
} from "@/lib/admin-actions";
import type { OrderStatus } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { ShipmentProgressHorizontal } from "@/components/admin/LogisticsShipmentProgress";
import { MapPin, Package, User } from "lucide-react";

export type LogisticsDetailOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  companyLevel: string;
  addressLines: string[];
  notes: string | null;
  contact: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  items: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    image: string | null;
  }[];
  shipment: {
    id: string;
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    shippedAt: string | null;
    deliveredAt: string | null;
    packedAt: string | null;
    boxCount: number | null;
    cbm: number | null;
    weightKg: number | null;
    packingNote: string | null;
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
  } | null;
};

type LineDraft = {
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

function guessFlavorSize(name: string) {
  // e.g. "Blue Razz Ice 50mg" → flavor + size heuristic
  const mg = name.match(/(\d+\s*mg)/i);
  const size = mg?.[1]?.replace(/\s+/g, "") || "";
  const flavor = mg
    ? name.replace(mg[0], "").replace(/\s+/g, " ").trim()
    : name;
  return { flavor, size };
}

export default function LogisticsOrderDesk({
  order,
}: {
  order: LogisticsDetailOrder;
}) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const hasPacking = Boolean(order.shipment?.packedAt || order.shipment?.boxCount);

  const [boxCount, setBoxCount] = useState(
    String(order.shipment?.boxCount ?? ""),
  );
  const [cbm, setCbm] = useState(
    order.shipment?.cbm != null ? String(order.shipment.cbm) : "",
  );
  const [weightKg, setWeightKg] = useState(
    order.shipment?.weightKg != null ? String(order.shipment.weightKg) : "",
  );
  const [packingNote, setPackingNote] = useState(
    order.shipment?.packingNote || "",
  );
  const [lines, setLines] = useState<LineDraft[]>(() => {
    if (order.shipment?.lines?.length) {
      return order.shipment.lines.map((l) => ({
        orderItemId: l.orderItemId || "",
        sku: l.sku,
        name: l.name,
        quantity: l.quantity,
        flavor: l.flavor || "",
        size: l.size || "",
        boxes: l.boxes != null ? String(l.boxes) : "",
      }));
    }
    return order.items.map((item) => {
      const g = guessFlavorSize(item.name);
      return {
        orderItemId: item.id,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        flavor: g.flavor,
        size: g.size,
        boxes: "",
      };
    });
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function formatTime(iso: string | null) {
    if (!iso) return "--:--";
    try {
      return new Date(iso).toLocaleTimeString(
        locale === "zh" ? "zh-CN" : "en-US",
        { hour: "2-digit", minute: "2-digit" },
      );
    } catch {
      return "--:--";
    }
  }

  async function savePacking() {
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
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("logistics.packingError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Customer + ship-to */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("logistics.customerInfo")}
            </p>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--admin-muted)]">{t("logistics.company")}</dt>
              <dd className="font-medium text-[var(--admin-text)] text-right">
                {order.companyName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--admin-muted)]">{t("logistics.level")}</dt>
              <dd className="font-medium text-[var(--admin-text)]">
                {order.companyLevel}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--admin-muted)]">{t("logistics.contact")}</dt>
              <dd className="font-medium text-[var(--admin-text)] text-right">
                {order.contactName || order.contact}
              </dd>
            </div>
            {order.contactEmail ? (
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--admin-muted)]">Email</dt>
                <dd className="text-[var(--admin-text)] text-right break-all">
                  {order.contactEmail}
                </dd>
              </div>
            ) : null}
            {order.contactPhone ? (
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--admin-muted)]">{t("logistics.phone")}</dt>
                <dd className="text-[var(--admin-text)]">{order.contactPhone}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--admin-muted)]">{t("logistics.colOrder")}</dt>
              <dd className="font-semibold text-[var(--admin-text)]">
                {order.orderNumber}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--admin-muted)]">{t("logistics.created")}</dt>
              <dd className="text-[var(--admin-text)]">{formatDate(order.createdAt)}</dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard>
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("logistics.shipAddress")}
            </p>
          </div>
          <div className="space-y-1 text-sm font-medium text-[var(--admin-text)]">
            {order.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="mt-4">
            <AdminBadge tone={statusTone(order.status)}>
              {statusLabel(order.status)}
            </AdminBadge>
          </div>
          {order.notes ? (
            <div className="mt-4 border-t border-[var(--admin-border)] pt-3">
              <p className="text-xs text-[var(--admin-muted)]">{t("logistics.notes")}</p>
              <p className="mt-1 text-sm text-[var(--admin-text)]">{order.notes}</p>
            </div>
          ) : null}
        </AdminCard>
      </div>

      {/* Order lines (qty only) */}
      <AdminCard>
        <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
          {t("logistics.orderLines")}
        </p>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--admin-gray-100)]">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-4 w-4 text-[var(--admin-muted)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">{item.sku}</p>
                </div>
              </div>
              <p className="shrink-0 text-sm tabular-nums font-medium">
                {t("logistics.qty")} {item.quantity}
              </p>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Create / edit packing */}
      <AdminCard>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {hasPacking
                ? t("logistics.editShipment")
                : t("logistics.createShipment")}
            </p>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {t("logistics.createShipmentHint")}
            </p>
          </div>
          {hasPacking ? (
            <AdminBadge tone="brand">{t("logistics.packingSaved")}</AdminBadge>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-medium text-[var(--admin-muted)]">
            {t("logistics.boxCount")}
            <input
              className="admin-input mt-1.5 w-full"
              inputMode="numeric"
              value={boxCount}
              onChange={(e) => setBoxCount(e.target.value)}
              placeholder="e.g. 4"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--admin-muted)]">
            {t("logistics.cbm")}
            <input
              className="admin-input mt-1.5 w-full"
              inputMode="decimal"
              value={cbm}
              onChange={(e) => setCbm(e.target.value)}
              placeholder="e.g. 0.85"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--admin-muted)]">
            {t("logistics.weightKg")}
            <input
              className="admin-input mt-1.5 w-full"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="optional"
            />
          </label>
        </div>

        <label className="mt-3 block text-xs font-medium text-[var(--admin-muted)]">
          {t("logistics.packingNote")}
          <input
            className="admin-input mt-1.5 w-full"
            value={packingNote}
            onChange={(e) => setPackingNote(e.target.value)}
            placeholder={t("logistics.packingNotePlaceholder")}
          />
        </label>

        <div className="mt-5 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("logistics.colSku")}</th>
                <th>{t("logistics.flavor")}</th>
                <th>{t("logistics.size")}</th>
                <th>{t("logistics.qty")}</th>
                <th>{t("logistics.lineBoxes")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={line.orderItemId || line.sku + idx}>
                  <td>
                    <p className="text-sm font-medium text-[var(--admin-text)]">
                      {line.name}
                    </p>
                    <p className="text-xs text-[var(--admin-muted)]">{line.sku}</p>
                  </td>
                  <td>
                    <input
                      className="admin-input w-full min-w-[7rem]"
                      value={line.flavor}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, flavor: v } : l,
                          ),
                        );
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="admin-input w-full min-w-[5rem]"
                      value={line.size}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, size: v } : l,
                          ),
                        );
                      }}
                      placeholder="50mg"
                    />
                  </td>
                  <td className="tabular-nums font-medium">{line.quantity}</td>
                  <td>
                    <input
                      className="admin-input w-20"
                      inputMode="numeric"
                      value={line.boxes}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, boxes: v } : l,
                          ),
                        );
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-[var(--admin-danger)]">{error}</p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={savePacking}
            className="admin-btn admin-btn-primary admin-btn-sm"
          >
            {busy
              ? t("common.loading")
              : hasPacking
                ? t("logistics.savePacking")
                : t("logistics.createShipment")}
          </button>
        </div>
      </AdminCard>

      {/* Desk summary + tracking (after packing exists) */}
      {hasPacking && order.shipment ? (
        <>
          <AdminCard>
            <p className="mb-4 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("logistics.shipmentDesk")}
            </p>
            <div className="mb-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[var(--admin-border)] px-3 py-3">
                <p className="text-xs text-[var(--admin-muted)]">
                  {t("logistics.boxCount")}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {order.shipment.boxCount ?? "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--admin-border)] px-3 py-3">
                <p className="text-xs text-[var(--admin-muted)]">{t("logistics.cbm")}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {order.shipment.cbm ?? "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--admin-border)] px-3 py-3">
                <p className="text-xs text-[var(--admin-muted)]">
                  {t("logistics.weightKg")}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {order.shipment.weightKg ?? "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--admin-border)] px-3 py-3">
                <p className="text-xs text-[var(--admin-muted)]">
                  {t("logistics.packingStatus")}
                </p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {order.shipment.status}
                </p>
              </div>
            </div>

            <ShipmentProgressHorizontal
              order={order}
              formatDate={formatDate}
              formatTime={formatTime}
              labels={{
                supplier: t("logistics.timelinePicked"),
                transit: t("logistics.timelineTransit"),
                delivered: t("logistics.timelineDelivered"),
              }}
              size="md"
            />

            {order.shipment.lines.length > 0 ? (
              <div className="mt-5 overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t("logistics.colSku")}</th>
                      <th>{t("logistics.flavor")}</th>
                      <th>{t("logistics.size")}</th>
                      <th>{t("logistics.qty")}</th>
                      <th>{t("logistics.lineBoxes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.shipment.lines.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <p className="font-medium">{l.name}</p>
                          <p className="text-xs text-[var(--admin-muted)]">{l.sku}</p>
                        </td>
                        <td>{l.flavor || "—"}</td>
                        <td>{l.size || "—"}</td>
                        <td className="tabular-nums">{l.quantity}</td>
                        <td className="tabular-nums">{l.boxes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </AdminCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard>
              <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
                {t("logistics.uploadTracking")}
              </p>
              <form
                action={async (fd) => {
                  await upsertShipment(
                    order.id,
                    String(fd.get("carrier") || ""),
                    String(fd.get("trackingNumber") || ""),
                  );
                  router.refresh();
                }}
                className="space-y-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-[var(--admin-muted)]">
                    {t("logistics.carrier")}
                    <input
                      name="carrier"
                      required
                      defaultValue={order.shipment.carrier || ""}
                      placeholder="UPS / FedEx / DHL"
                      className="admin-input mt-1.5 w-full"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[var(--admin-muted)]">
                    {t("logistics.trackingNumber")}
                    <input
                      name="trackingNumber"
                      required
                      defaultValue={order.shipment.trackingNumber || ""}
                      className="admin-input mt-1.5 w-full"
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary admin-btn-sm"
                  >
                    {t("logistics.uploadTracking")}
                  </button>
                </div>
              </form>
            </AdminCard>

            <AdminCard>
              <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
                {t("logistics.colStatus")}
              </p>
              <p className="text-sm text-[var(--admin-muted)]">
                {order.shipment.trackingNumber
                  ? `${order.shipment.carrier || "—"}: ${order.shipment.trackingNumber}`
                  : t("logistics.noTrackingYet")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {order.status !== "COMPLETED" ? (
                  <form
                    action={async () => {
                      await updateOrderStatus(order.id, "COMPLETED");
                      router.refresh();
                    }}
                  >
                    <button
                      type="submit"
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      {t("logistics.markDelivered")}
                    </button>
                  </form>
                ) : (
                  <AdminBadge tone="success">
                    {t("logistics.statusCOMPLETED")}
                  </AdminBadge>
                )}
                <a
                  href={`/admin/logistics/packing-lists/${order.id}`}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  {t("packingLists.view")}
                </a>
                <a
                  href={`/api/orders/${order.id}/docs?type=packing&download=1`}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  {t("packingLists.download")}
                </a>
              </div>
            </AdminCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
