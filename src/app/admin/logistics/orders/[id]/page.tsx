import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminLinkBtn } from "@/components/admin/AdminI18nBits";
import LogisticsOrderDesk from "@/components/admin/LogisticsOrderDesk";

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

export default async function LogisticsOrderPage({ params }: Params) {
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
        include: { lines: true },
      },
      items: {
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          image: true,
        },
      },
      user: { select: { email: true, phone: true, name: true } },
    },
  });

  if (!order) notFound();

  const shipment = order.shipments[0];
  const deskOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    companyName: order.company.name,
    companyLevel: order.company.level,
    addressLines: parseAddress(order.addressSnap),
    notes: order.notes,
    contact: order.user.email || order.user.phone || order.user.name || "—",
    contactName: order.user.name,
    contactPhone: order.user.phone,
    contactEmail: order.user.email,
    items: order.items,
    shipment: shipment
      ? {
          id: shipment.id,
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          shippedAt: shipment.shippedAt?.toISOString() ?? null,
          deliveredAt: shipment.deliveredAt?.toISOString() ?? null,
          packedAt: shipment.packedAt?.toISOString() ?? null,
          boxCount: shipment.boxCount,
          cbm: shipment.cbm,
          weightKg: shipment.weightKg,
          packingNote: shipment.packingNote,
          lines: shipment.lines.map((l) => ({
            id: l.id,
            orderItemId: l.orderItemId,
            sku: l.sku,
            name: l.name,
            quantity: l.quantity,
            flavor: l.flavor,
            size: l.size,
            boxes: l.boxes,
          })),
        }
      : null,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="logistics.detailPageTitle"
        descriptionKey={
          order.shipments[0]?.packedAt || order.shipments[0]?.boxCount
            ? "logistics.shipmentDetailHint"
            : "logistics.detailPageHint"
        }
        actions={
          <AdminLinkBtn
            href={
              order.shipments[0]?.packedAt || order.shipments[0]?.boxCount
                ? "/admin/logistics/shipments"
                : "/admin/logistics"
            }
            labelKey="common.back"
          />
        }
      />
      <p className="text-sm text-[var(--admin-muted)] -mt-4">
        <span className="font-semibold text-[var(--admin-text)]">
          {order.orderNumber}
        </span>
        {" · "}
        {order.company.name}
      </p>
      <LogisticsOrderDesk order={deskOrder} />
    </div>
  );
}
