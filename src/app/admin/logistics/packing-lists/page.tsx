import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import PackingListsWorkspace from "@/components/admin/PackingListsWorkspace";

export const metadata = { title: "Packing lists · UMAXES Ops" };

function parseRoute(snap: string) {
  try {
    const address = JSON.parse(snap) as {
      city: string;
      country: string;
    };
    return [address.city, address.country].filter(Boolean).join(" → ") || "—";
  } catch {
    return "—";
  }
}

export default async function PackingListsPage() {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/logistics/packing-lists")
  ) {
    redirect("/admin");
  }

  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: [
          "CONFIRMED",
          "SENT_TO_SUPPLIER",
          "PICKING",
          "SHIPPED",
          "COMPLETED",
        ],
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
          packedAt: true,
          boxCount: true,
          cbm: true,
          weightKg: true,
          packingNote: true,
          lines: { select: { id: true } },
        },
      },
      items: { select: { quantity: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 150,
  });

  const rows = orders.map((o) => {
    const shipment = o.shipments[0];
    const hasPacking = Boolean(shipment?.packedAt || shipment?.boxCount);
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      updatedAt: o.updatedAt.toISOString(),
      companyName: o.company.name,
      companyLevel: o.company.level,
      route: parseRoute(o.addressSnap),
      hasPacking,
      boxCount: shipment?.boxCount ?? null,
      cbm: shipment?.cbm ?? null,
      weightKg: shipment?.weightKg ?? null,
      totalUnits: o.items.reduce((n, i) => n + i.quantity, 0),
      lineCount: shipment?.lines.length || o.items.length,
      packingNote: shipment?.packingNote ?? null,
      trackingNumber: shipment?.trackingNumber ?? null,
      carrier: shipment?.carrier ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="packingLists.title"
        descriptionKey="packingLists.description"
      />
      <PackingListsWorkspace rows={rows} />
    </div>
  );
}
