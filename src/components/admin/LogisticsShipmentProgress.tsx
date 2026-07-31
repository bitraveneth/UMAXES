"use client";

import type { OrderStatus } from "@/generated/prisma/enums";
import { shipmentStage } from "@/lib/logistics-progress";
import { CheckCircle2, Package, Truck } from "lucide-react";

export type LogisticsProgressOrder = {
  status: OrderStatus;
  updatedAt: string;
  shipment: {
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
};

function isWithSupplier(status: OrderStatus) {
  return status === "SENT_TO_SUPPLIER" || status === "PICKING";
}

export { shipmentStage };

export function ShipmentProgressHorizontal({
  order,
  formatDate,
  formatTime,
  labels,
  size = "md",
}: {
  order: LogisticsProgressOrder;
  formatDate: (iso: string) => string;
  formatTime: (iso: string | null) => string;
  labels: {
    supplier: string;
    transit: string;
    delivered: string;
  };
  size?: "sm" | "md";
}) {
  const stage = shipmentStage(order.status);
  const steps = [
    {
      key: "supplier",
      label: labels.supplier,
      icon: Package,
      date: formatDate(order.updatedAt),
      time:
        stage === 0 || isWithSupplier(order.status) || order.status === "CONFIRMED"
          ? formatTime(order.updatedAt)
          : formatTime(order.updatedAt),
    },
    {
      key: "transit",
      label: labels.transit,
      icon: Truck,
      date: order.shipment?.shippedAt
        ? formatDate(order.shipment.shippedAt)
        : stage >= 1
          ? formatDate(order.updatedAt)
          : "—",
      time: formatTime(
        order.shipment?.shippedAt ||
          (order.status === "SHIPPED" ? order.updatedAt : null),
      ),
    },
    {
      key: "delivered",
      label: labels.delivered,
      icon: CheckCircle2,
      date: order.shipment?.deliveredAt
        ? formatDate(order.shipment.deliveredAt)
        : order.status === "COMPLETED"
          ? formatDate(order.updatedAt)
          : "—",
      time: formatTime(
        order.shipment?.deliveredAt ||
          (order.status === "COMPLETED" ? order.updatedAt : null),
      ),
    },
  ] as const;

  const iconBox = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const ringClass = size === "sm" ? "ring-[var(--admin-card)]" : "ring-[var(--admin-bg)]";

  return (
    <div className="w-full">
      <ol className="relative grid grid-cols-3 gap-2">
        <div
          className="pointer-events-none absolute top-5 right-[16.67%] left-[16.67%] h-0.5 -translate-y-1/2 bg-[var(--admin-border)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-5 left-[16.67%] h-0.5 -translate-y-1/2 bg-sky-500 transition-all"
          style={{
            width: stage === 0 ? "0%" : stage === 1 ? "33.33%" : "66.66%",
          }}
          aria-hidden
        />
        {steps.map((step, i) => {
          const Icon = step.icon;
          const reached = i <= stage;
          const current = i === stage;
          return (
            <li
              key={step.key}
              className="relative z-[1] flex flex-col items-center text-center"
            >
              <span
                className={`flex ${iconBox} items-center justify-center rounded-full ring-4 ${ringClass} ${
                  reached
                    ? current
                      ? "bg-[var(--admin-brand-500)] text-white"
                      : "bg-sky-500 text-white"
                    : "bg-[var(--admin-gray-100)] text-[var(--admin-muted)]"
                }`}
              >
                <Icon className={iconSize} strokeWidth={2} />
              </span>
              <p
                className={`mt-2 text-xs font-semibold sm:text-sm ${
                  reached
                    ? "text-[var(--admin-text)]"
                    : "text-[var(--admin-muted)]"
                }`}
              >
                {step.label}
              </p>
              {size === "md" ? (
                <>
                  <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">
                    {step.date}
                  </p>
                  <p className="text-[11px] tabular-nums text-[var(--admin-muted)]">
                    {step.time}
                  </p>
                </>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
