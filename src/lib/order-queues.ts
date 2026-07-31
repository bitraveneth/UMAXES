import type { OrderStatus } from "@/generated/prisma/enums";

/**
 * Shared status queues — one Order record, each desk pulls by status.
 * Sales owns payment + supplier assign; Logistics owns tracking + delivery.
 */

export const SALES_ACTION_STATUSES: OrderStatus[] = [
  "PAYMENT_PENDING",
  "CONFIRMED",
];

export const LOGISTICS_QUEUE_STATUSES: OrderStatus[] = [
  "SENT_TO_SUPPLIER",
  "PICKING",
  "SHIPPED",
  "COMPLETED",
];

/** Logistics primary work: needs carrier/tracking */
export function isAwaitingTracking(status: OrderStatus) {
  return status === "SENT_TO_SUPPLIER" || status === "PICKING";
}

export function isInTransit(status: OrderStatus) {
  return status === "SHIPPED";
}

export function isDelivered(status: OrderStatus) {
  return status === "COMPLETED";
}

/** Sales needs to confirm payment or assign supplier */
export function needsSalesAction(order: {
  status: OrderStatus;
  supplierId?: string | null;
}) {
  if (order.status === "PAYMENT_PENDING") return true;
  if (order.status === "CONFIRMED" && !order.supplierId) return true;
  return false;
}

export type SalesQueueKey =
  | "all"
  | "NEEDS_ACTION"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "SENT_TO_SUPPLIER"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export type LogisticsQueueKey =
  | "all"
  | "AWAITING_TRACKING"
  | "SHIPPED"
  | "COMPLETED"
  | "WAITING_SALES";

export function matchesSalesQueue(
  order: { status: OrderStatus; supplierId?: string | null },
  filter: SalesQueueKey,
) {
  if (filter === "all") return true;
  if (filter === "NEEDS_ACTION") return needsSalesAction(order);
  if (filter === "SENT_TO_SUPPLIER") {
    return order.status === "SENT_TO_SUPPLIER" || order.status === "PICKING";
  }
  return order.status === filter;
}

export function matchesLogisticsQueue(
  status: OrderStatus,
  filter: LogisticsQueueKey,
) {
  if (filter === "all") return true;
  if (filter === "AWAITING_TRACKING") return isAwaitingTracking(status);
  if (filter === "WAITING_SALES") return status === "CONFIRMED";
  return status === filter;
}
