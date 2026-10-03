import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { removeStoredUpload } from "@/lib/upload-store";

/** Drop the stored 水单 file and clear Payment slip fields. Paid status stays paid. */
export async function deleteOrderPaymentSlip(
  orderId: string,
  actorUserId: string,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });
  if (!order) throw new Error("Order not found");

  const withSlip = order.payments.filter((p) => p.slipUrl);
  if (withSlip.length === 0) throw new Error("No payment slip on this order");

  for (const payment of withSlip) {
    await removeStoredUpload(payment.slipUrl);
  }

  await prisma.$transaction(async (tx) => {
    for (const payment of withSlip) {
      const nextStatus =
        payment.status === "submitted" && !payment.paidAt
          ? "pending"
          : payment.status;
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          slipUrl: null,
          slipFileName: null,
          slipMime: null,
          slipUploadedAt: null,
          status: nextStatus,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: actorUserId,
        action: "PAYMENT_SLIP_DELETED",
        entity: "Order",
        entityId: order.id,
        meta: JSON.stringify({
          orderNumber: order.orderNumber,
          fileName: withSlip[0]?.slipFileName || null,
          paid: withSlip.some((p) => p.status === "paid" && p.paidAt),
        }),
      },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);

  return { orderNumber: order.orderNumber };
}
