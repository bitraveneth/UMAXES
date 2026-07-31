import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { parseAddressSnap } from "@/lib/rma-format";
import { AdminStat, AdminCard } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminText } from "@/components/admin/AdminI18nBits";
import RmaPanel from "@/components/admin/RmaPanel";
import AdminCreateRmaForm from "@/components/admin/AdminCreateRmaForm";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Package,
  RotateCcw,
} from "lucide-react";

export const metadata = { title: "Returns · UMAXES Ops" };

export default async function AdminRmaPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/rma")) {
    redirect("/admin");
  }

  const [rmas, recentOrders] = await Promise.all([
    prisma.rma.findMany({
      include: {
        company: true,
        order: true,
        items: true,
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.order.findMany({
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
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const requested = rmas.filter((r) => r.status === "REQUESTED").length;
  const openCases = rmas.filter((r) =>
    ["REQUESTED", "APPROVED", "RECEIVED"].includes(r.status),
  ).length;
  const damage = rmas.filter(
    (r) => r.reasonType === "DAMAGE" || r.reasonType === "DEFECT",
  ).length;
  const reship = rmas.filter((r) => r.replacementNeeded).length;
  const credited = rmas.filter((r) => r.status === "CREDITED").length;

  const panelItems = rmas.map((r) => {
    const ship = parseAddressSnap(r.addressSnap || r.order.addressSnap);
    return {
      id: r.id,
      rmaNumber: r.rmaNumber,
      status: r.status,
      reasonType: r.reasonType,
      resolution: r.resolution,
      reason: r.reason,
      creditAmount: r.creditAmount,
      adminNote: r.adminNote,
      replacementNeeded: r.replacementNeeded,
      replacementNote: r.replacementNote,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      companyName: r.company.name,
      companyLevel: r.company.level,
      contactName: r.user.name,
      contactEmail: r.user.email || r.user.phone,
      orderNumber: r.order.orderNumber,
      orderId: r.order.id,
      shipRoute: ship.route,
      shipLines: ship.lines,
      items: r.items.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        flavor: item.flavor,
        optionsLabel: item.optionsLabel,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        image: item.image,
      })),
    };
  });

  const createOrders = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    companyName: o.company.name,
    companyLevel: o.company.level,
    items: o.items.map((line) => ({
      id: line.id,
      sku: line.sku,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      image: line.image,
    })),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="rma.title"
        descriptionKey="rma.description"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStat
          label={<AdminText id="rma.statRequested" />}
          value={requested.toLocaleString()}
          icon={Clock3}
          trendUp={requested === 0}
        />
        <AdminStat
          label={<AdminText id="rma.statOpen" />}
          value={openCases.toLocaleString()}
          icon={RotateCcw}
        />
        <AdminStat
          label={<AdminText id="rma.statDamage" />}
          value={damage.toLocaleString()}
          icon={AlertTriangle}
        />
        <AdminStat
          label={<AdminText id="rma.statReship" />}
          value={reship.toLocaleString()}
          icon={Package}
        />
        <AdminStat
          label={<AdminText id="rma.statCredited" />}
          value={credited.toLocaleString()}
          icon={CheckCircle2}
          trendUp
        />
      </div>

      <RmaPanel items={panelItems} />

      <AdminCard>
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
            <RotateCcw className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <AdminText
              id="rma.logTitle"
              as="h2"
              className="text-base font-semibold text-[var(--admin-text)]"
            />
            <AdminText
              id="rma.logHint"
              as="p"
              className="mt-1 text-sm text-[var(--admin-muted)]"
            />
          </div>
        </div>
        <AdminCreateRmaForm orders={createOrders} />
      </AdminCard>
    </div>
  );
}
