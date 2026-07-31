import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminStat } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminText } from "@/components/admin/AdminI18nBits";
import ShipmentsWorkspace from "@/components/admin/ShipmentsWorkspace";
import { CheckCircle2, Clock3, Truck } from "lucide-react";

export const metadata = { title: "Shipments · UMAXES Ops" };

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
    const lines = [
      [address.line1, address.line2].filter(Boolean).join(", "),
      [address.city, address.region, address.postalCode]
        .filter(Boolean)
        .join(", "),
      address.country,
    ].filter(Boolean);
    const route = [address.city, address.country].filter(Boolean).join(" → ");
    return { lines, route: route || "—" };
  } catch {
    return { lines: [snap.slice(0, 80)], route: "—" };
  }
}

export default async function LogisticsShipmentsPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/logistics")) {
    redirect("/admin");
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { status: { in: ["SHIPPED", "COMPLETED"] } },
        {
          shipments: {
            some: {
              OR: [{ packedAt: { not: null } }, { boxCount: { not: null } }],
            },
          },
        },
      ],
    },
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
          image: true,
        },
      },
      user: {
        select: {
          email: true,
          phone: true,
          name: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 120,
  });

  const awaitingTracking = orders.filter((o) => {
    const s = o.shipments[0];
    const hasPacking = Boolean(s?.packedAt || s?.boxCount);
    return (
      hasPacking &&
      o.status !== "SHIPPED" &&
      o.status !== "COMPLETED" &&
      !s?.trackingNumber
    );
  }).length;
  const inTransit = orders.filter((o) => o.status === "SHIPPED").length;
  const delivered = orders.filter((o) => o.status === "COMPLETED").length;

  const workspaceOrders = orders.map((o) => {
    const addr = parseAddress(o.addressSnap);
    const shipment = o.shipments[0];
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      companyName: o.company.name,
      companyLevel: o.company.level,
      route: addr.route,
      addressLines: addr.lines,
      notes: o.notes,
      contactName: o.user.name,
      contactPhone: o.user.phone,
      contactEmail: o.user.email,
      hasPacking: Boolean(shipment?.packedAt || shipment?.boxCount),
      boxCount: shipment?.boxCount ?? null,
      cbm: shipment?.cbm ?? null,
      items: o.items.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        image: item.image,
      })),
      shipment: shipment
        ? {
            carrier: shipment.carrier,
            trackingNumber: shipment.trackingNumber,
            status: shipment.status,
            shippedAt: shipment.shippedAt?.toISOString() ?? null,
            deliveredAt: shipment.deliveredAt?.toISOString() ?? null,
          }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="logistics.tabShipments"
        descriptionKey="logistics.tabShipmentsHint"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStat
          label={<AdminText id="logistics.filterAwaitingTracking" />}
          value={awaitingTracking.toLocaleString()}
          icon={Clock3}
        />
        <AdminStat
          label={<AdminText id="logistics.inTransit" />}
          value={inTransit.toLocaleString()}
          icon={Truck}
          trendUp={inTransit > 0}
        />
        <AdminStat
          label={<AdminText id="logistics.delivered" />}
          value={delivered.toLocaleString()}
          icon={CheckCircle2}
          trendUp
        />
      </div>

      <ShipmentsWorkspace orders={workspaceOrders} />
    </div>
  );
}
