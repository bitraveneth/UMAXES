import type { OrderStatus } from "@/generated/prisma/enums";

export const BUYER_ORDER_STEPS = [
  { id: "submitted", label: "Submitted" },
  { id: "payment", label: "Payment" },
  { id: "confirmed", label: "Confirmed" },
  { id: "packing", label: "Packing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
] as const;

export type BuyerDocType = "pi" | "invoice" | "packing";

export function buyerTimelineIndex(status: OrderStatus): number {
  switch (status) {
    case "SUBMITTED":
      return 0;
    case "PAYMENT_PENDING":
      return 1;
    case "CONFIRMED":
    case "SENT_TO_SUPPLIER":
      return 2;
    case "PICKING":
      return 3;
    case "SHIPPED":
      return 4;
    case "COMPLETED":
      return 5;
    case "CANCELLED":
      return -1;
    default:
      return 0;
  }
}

export function buyerDocAvailability(
  status: OrderStatus,
  hasShipment: boolean,
): Record<BuyerDocType, { ready: boolean; hint: string }> {
  if (status === "CANCELLED") {
    return {
      pi: { ready: false, hint: "Order cancelled" },
      invoice: { ready: false, hint: "Order cancelled" },
      packing: { ready: false, hint: "Order cancelled" },
    };
  }

  const invoiceReady = ![
    "SUBMITTED",
    "PAYMENT_PENDING",
  ].includes(status);

  const packingReady =
    hasShipment ||
    status === "PICKING" ||
    status === "SHIPPED" ||
    status === "COMPLETED";

  return {
    pi: {
      ready: true,
      hint: "Available after order is placed",
    },
    invoice: {
      ready: invoiceReady,
      hint: "Available after payment is confirmed",
    },
    packing: {
      ready: packingReady,
      hint: "Available when packing starts",
    },
  };
}

export function buyerStatusLabel(status: OrderStatus) {
  return status.replaceAll("_", " ");
}

export function buyerStatusClass(status: string) {
  if (status === "COMPLETED" || status === "SHIPPED")
    return "bg-emerald-50 text-emerald-800";
  if (status === "PAYMENT_PENDING" || status === "SUBMITTED")
    return "bg-amber-50 text-amber-900";
  if (status === "CANCELLED") return "bg-red-50 text-red-800";
  return "bg-umx-orange-wash text-umx-orange";
}

/** Shipment board buckets for /account/tracking — not used on Orders list. */
export type TrackingLane = "moving" | "preparing" | "delivered";

export function buyerTrackingLane(status: OrderStatus): TrackingLane {
  if (status === "COMPLETED") return "delivered";
  if (status === "SHIPPED" || status === "PICKING") return "moving";
  return "preparing";
}

export function buyerTrackingLaneLabel(lane: TrackingLane) {
  switch (lane) {
    case "moving":
      return "On the way";
    case "preparing":
      return "Preparing";
    case "delivered":
      return "Delivered";
  }
}

