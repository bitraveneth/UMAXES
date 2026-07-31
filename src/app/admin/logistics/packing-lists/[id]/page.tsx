import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminLinkBtn } from "@/components/admin/AdminI18nBits";
import PackingListDetail from "@/components/admin/PackingListDetail";

export const metadata = { title: "Packing list · UMAXES Ops" };

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

function guessFlavorSize(name: string) {
  const mg = name.match(/(\d+\s*mg)/i);
  const size = mg?.[1]?.replace(/\s+/g, "") || "";
  const flavor = mg
    ? name.replace(mg[0], "").replace(/\s+/g, " ").trim()
    : name;
  return { flavor, size };
}

type Params = { params: Promise<{ id: string }> };

export default async function PackingListViewPage({ params }: Params) {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/logistics/packing-lists")
  ) {
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
        },
      },
      user: { select: { email: true, phone: true, name: true } },
    },
  });

  if (!order) notFound();

  const shipment = order.shipments[0];
  const canEdit = ["ADMIN", "LOGISTICS", "SUPER_ADMIN"].includes(
    session.user.role,
  );
  const lines =
    shipment?.lines?.length
      ? shipment.lines.map((l) => ({
          id: l.id,
          orderItemId: l.orderItemId,
          sku: l.sku,
          name: l.name,
          quantity: l.quantity,
          flavor: l.flavor,
          size: l.size,
          boxes: l.boxes,
        }))
      : order.items.map((item) => {
          const g = guessFlavorSize(item.name);
          return {
            id: item.id,
            orderItemId: item.id,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            flavor: g.flavor || null,
            size: g.size || null,
            boxes: null as number | null,
          };
        });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="packingLists.documentTitle"
        descriptionKey="packingLists.detailHint"
        actions={
          <AdminLinkBtn
            href="/admin/logistics/packing-lists"
            labelKey="common.back"
          />
        }
      />
      <PackingListDetail
        canEdit={canEdit}
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
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
          weightKg: shipment?.weightKg ?? null,
          packingNote: shipment?.packingNote ?? null,
          carrier: shipment?.carrier ?? null,
          trackingNumber: shipment?.trackingNumber ?? null,
          lines,
        }}
      />
    </div>
  );
}
