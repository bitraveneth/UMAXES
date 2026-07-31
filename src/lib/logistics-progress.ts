import type { OrderStatus } from "@/generated/prisma/enums";

/** Shared stage index for logistics progress UI (server + client safe). */
export function shipmentStage(status: OrderStatus): 0 | 1 | 2 {
  if (status === "COMPLETED") return 2;
  if (status === "SHIPPED") return 1;
  return 0;
}
