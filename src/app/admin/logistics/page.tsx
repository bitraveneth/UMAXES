import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminStat } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminText } from "@/components/admin/AdminI18nBits";
import LogisticsWorkspace from "@/components/admin/LogisticsWorkspace";
import { Clock3, Factory, Package } from "lucide-react";

export const metadata = { title: "Orders · UMAXES Ops" };

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

export default async function LogisticsPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/logistics")) {
    redirect("/admin");
  }

  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ["SENT_TO_SUPPLIER", "PICKING", "CONFIRMED"],
      },
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

  const queue = orders.filter(
    (o) => !o.shipments[0]?.packedAt && !o.shipments[0]?.boxCount,
  );
  const awaitingPacking = queue.length;
  const confirmed = queue.filter((o) => o.status === "CONFIRMED").length;
  const withSupplier = queue.filter(
    (o) => o.status === "SENT_TO_SUPPLIER" || o.status === "PICKING",
  ).length;

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
        titleKey="logistics.tabOrders"
        descriptionKey="logistics.tabOrdersHint"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStat
          label={<AdminText id="logistics.awaitingPacking" />}
          value={awaitingPacking.toLocaleString()}
          icon={Package}
        />
        <AdminStat
          label={<AdminText id="logistics.statusCONFIRMED" />}
          value={confirmed.toLocaleString()}
          icon={Clock3}
        />
        <AdminStat
          label={<AdminText id="logistics.statusSENT_TO_SUPPLIER" />}
          value={withSupplier.toLocaleString()}
          icon={Factory}
        />
      </div>

      <LogisticsWorkspace orders={workspaceOrders} />
    </div>
  );
}
