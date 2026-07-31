import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { paymentLabels } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import BuyerOrderDetail from "@/components/account/BuyerOrderDetail";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  return {
    title: order ? `${order.orderNumber} · Orders` : "Order · UMAXES",
  };
}

export default async function AccountOrderDetailPage({
  params,
  searchParams,
}: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/orders");
  if (session.user.status === "PENDING") redirect("/account/pending");
  if (!session.user.companyId) redirect("/account");

  const { id } = await params;
  const { tab } = await searchParams;
  const initialTab = tab === "tracking" ? "tracking" : "documents";

  const order = await prisma.order.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      items: true,
      shipments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  return (
    <BuyerOrderDetail
      companyLevel={session.user.companyLevel}
      paymentLabel={paymentLabels[order.paymentMethod]}
      initialTab={initialTab}
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        piNumber: order.piNumber,
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        discount: order.discount,
        shipping: order.shipping,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          image: item.image,
        })),
        shipments: order.shipments.map((s) => ({
          id: s.id,
          carrier: s.carrier,
          trackingNumber: s.trackingNumber,
          status: s.status,
          shippedAt: s.shippedAt?.toISOString() ?? null,
          deliveredAt: s.deliveredAt?.toISOString() ?? null,
          packedAt: s.packedAt?.toISOString() ?? null,
          trackingStatus: s.trackingStatus,
        })),
      }}
    />
  );
}