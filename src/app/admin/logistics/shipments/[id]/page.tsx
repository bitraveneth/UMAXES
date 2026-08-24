import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminLinkBtn } from "@/components/admin/AdminI18nBits";
import ShipmentDeliveryDetail from "@/components/admin/ShipmentDeliveryDetail";

export const metadata = { title: "Shipment · UMAXES Ops" };

function parseAddress(snap: string) {
  try {
    const address = JSON.parse(snap) as {
      line1: string;
      line2?: string | null;
      city: string;
      region?: string | null;
      postalCode: string;
      country: string;
    };
    return [
      [address.line1, address.line2].filter(Boolean).join(", "),
      [address.city, address.region, address.postalCode]
        .filter(Boolean)
        .join(", "),
      address.country,
    ].filter(Boolean);
  } catch {
    return [snap.slice(0, 80)];
  }
}

type Params = { params: Promise<{ id: string }> };

export default async function ShipmentViewPage({ params }: Params) {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/logistics")) {
    redirect("/admin");
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      company: { select: { name: true, level: true } },
      shipments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          carrier: true,
          trackingNumber: true,
          status: true,
          shippedAt: true,
          deliveredAt: true,
          packedAt: true,
          boxCount: true,
          cbm: true,
        },
      },
      items: {
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
        },
      },
      user: { select: { email: true, phone: true, name: true } },
    },
  });

  if (!order) notFound();

  const shipment = order.shipments[0];
  const hasPacking = Boolean(shipment?.packedAt || shipment?.boxCount);
  if (!hasPacking && order.status !== "SHIPPED" && order.status !== "COMPLETED") {
    redirect(`/admin/logistics/orders/${order.id}`);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="logistics.detailTitle"
        descriptionKey="logistics.shipmentDetailHint"
        actions={
          <AdminLinkBtn
            href="/admin/logistics/shipments"
            labelKey="common.back"
          />
        }
      />
      <ShipmentDeliveryDetail
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          updatedAt: order.updatedAt.toISOString(),
          companyName: order.company.name,
          companyLevel: order.company.level,
          addressLines: parseAddress(order.addressSnap),
          notes: order.notes,
          contactName: order.user.name,
          contactPhone: order.user.phone,
          contactEmail: order.user.email,
          boxCount: shipment?.boxCount ?? null,
          cbm: shipment?.cbm ?? null,
          items: order.items,
          shipment: shipment
            ? {
                carrier: shipment.carrier,
                trackingNumber: shipment.trackingNumber,
                status: shipment.status,
                shippedAt: shipment.shippedAt?.toISOString() ?? null,
                deliveredAt: shipment.deliveredAt?.toISOString() ?? null,
              }
            : null,
        }}
      />
    </div>
  );
}
