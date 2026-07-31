"use client";

import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/generated/prisma/enums";
import { upsertShipment, updateOrderStatus } from "@/lib/admin-actions";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { ShipmentProgressHorizontal } from "@/components/admin/LogisticsShipmentProgress";
import { Building2, MapPin, Package, Phone, Mail, User } from "lucide-react";

export type ShipmentDeliveryOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
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
  items: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
  }[];
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
};

function statusTone(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "SHIPPED") return "warning" as const;
  if (status === "SENT_TO_SUPPLIER" || status === "PICKING")
    return "brand" as const;
  return "neutral" as const;
}

export default function ShipmentDeliveryDetail({
  order,
}: {
  order: ShipmentDeliveryOrder;
}) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();

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

  return (
    <div className="space-y-6">
      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--admin-muted)]">
              {t("logistics.detailTitle")}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--admin-text)]">
              {order.orderNumber}
            </p>
          </div>
          <AdminBadge tone={statusTone(order.status)}>
            {statusLabel(order.status)}
          </AdminBadge>
        </div>

        <div className="mt-8">
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
        </div>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--admin-muted)]">
              {t("logistics.customerInfo")}
            </span>
          </div>
          <p className="text-base font-semibold text-[var(--admin-text)]">
            {order.companyName}
          </p>
          <p className="text-xs text-[var(--admin-muted)]">{order.companyLevel}</p>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-[var(--admin-muted)]" />
              <span>{order.contactName || "—"}</span>
            </div>
            {order.contactPhone ? (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[var(--admin-muted)]" />
                <span>{order.contactPhone}</span>
              </div>
            ) : null}
            {order.contactEmail ? (
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--admin-muted)]" />
                <span className="break-all">{order.contactEmail}</span>
              </div>
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
          {order.notes ? (
            <div className="mt-4 border-t border-[var(--admin-border)] pt-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--admin-muted)]">
                {t("logistics.notes")}
              </p>
              <p className="mt-1 text-sm text-[var(--admin-text)]">{order.notes}</p>
            </div>
          ) : null}
        </AdminCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--admin-muted)]">
            {t("logistics.trackingTitle")}
          </p>
          <p className="text-sm font-medium text-[var(--admin-text)]">
            {order.shipment?.trackingNumber
              ? `${order.shipment.carrier || "—"} · ${order.shipment.trackingNumber}`
              : t("logistics.noTrackingYet")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-[var(--admin-border)] px-2.5 py-2">
              <p className="text-xs text-[var(--admin-muted)]">
                {t("logistics.boxCount")}
              </p>
              <p className="font-semibold tabular-nums">
                {order.boxCount ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] px-2.5 py-2">
              <p className="text-xs text-[var(--admin-muted)]">{t("logistics.cbm")}</p>
              <p className="font-semibold tabular-nums">{order.cbm ?? "—"}</p>
            </div>
          </div>

          {order.status !== "COMPLETED" ? (
            <div className="mt-4 space-y-3 border-t border-[var(--admin-border)] pt-4">
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
                      defaultValue={order.shipment?.carrier || ""}
                      placeholder="UPS / FedEx / DHL"
                      className="admin-input mt-1.5 w-full"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[var(--admin-muted)]">
                    {t("logistics.trackingNumber")}
                    <input
                      name="trackingNumber"
                      required
                      defaultValue={order.shipment?.trackingNumber || ""}
                      className="admin-input mt-1.5 w-full"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary admin-btn-sm"
                >
                  {t("logistics.uploadTracking")}
                </button>
              </form>
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
            </div>
          ) : (
            <div className="mt-4">
              <AdminBadge tone="success">
                {t("logistics.statusCOMPLETED")}
              </AdminBadge>
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--admin-muted)]">
              {t("logistics.orderLines")}
            </span>
          </div>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--admin-muted)]">{item.sku}</p>
                </div>
                <span className="shrink-0 text-sm tabular-nums font-medium">
                  ×{item.quantity}
                </span>
              </li>
            ))}
          </ul>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--admin-border)] pt-4">
                <a
                  href={`/admin/logistics/packing-lists/${order.id}`}
                  className="admin-btn admin-btn-primary admin-btn-sm"
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
    </div>
  );
}
