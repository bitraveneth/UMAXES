import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { orderCompanyScopeForStaff } from "@/lib/sales-scope";
import { prisma } from "@/lib/db";
import type { OrderStatus, UserRole } from "@/generated/prisma/enums";
import { AdminStat } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminLinkBtn, AdminText } from "@/components/admin/AdminI18nBits";
import OrdersPanel from "@/components/admin/OrdersPanel";
import {
  CheckCircle2,
  Clock3,
  Factory,
  PackageCheck,
  Truck,
} from "lucide-react";

export const metadata = { title: "Orders · UMAXES Ops" };

const statusByRole: Partial<Record<UserRole, OrderStatus[]>> = {
  SALES: ["PAYMENT_PENDING", "CONFIRMED", "SENT_TO_SUPPLIER", "CANCELLED"],
  WAREHOUSE: ["SENT_TO_SUPPLIER", "CONFIRMED"],
  LOGISTICS: ["SHIPPED", "COMPLETED"],
  ADMIN: [
    "SUBMITTED",
    "PAYMENT_PENDING",
    "CONFIRMED",
    "SENT_TO_SUPPLIER",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
  ],
  SUPER_ADMIN: [
    "SUBMITTED",
    "PAYMENT_PENDING",
    "CONFIRMED",
    "SENT_TO_SUPPLIER",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
  ],
};

export default async function AdminOrdersPage() {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/orders")
  ) {
    redirect("/admin");
  }

  const role = session.user.role as UserRole;
  const allowedStatuses = statusByRole[role] ?? statusByRole.SALES!;
  const canAssignSupplier =
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "SALES" ||
    role === "WAREHOUSE";

  const [orders, suppliers] = await Promise.all([
    prisma.order.findMany({
      where: orderCompanyScopeForStaff(role, session.user.id),
      include: {
        company: true,
        supplier: true,
        items: true,
        shipments: true,
        placedByStaff: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const pendingPayment = orders.filter((o) => o.status === "PAYMENT_PENDING")
    .length;
  const confirmed = orders.filter((o) => o.status === "CONFIRMED").length;
  const withSupplier = orders.filter(
    (o) => o.status === "SENT_TO_SUPPLIER" || o.status === "PICKING",
  ).length;
  const shipped = orders.filter((o) => o.status === "SHIPPED").length;
  const completed = orders.filter((o) => o.status === "COMPLETED").length;

  const panelOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentRef: o.paymentRef,
    notes: o.notes,
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    companyName: o.company.name,
    supplierId: o.supplierId,
    supplierName: o.supplier?.name ?? null,
    supplierNote: o.supplierNote,
    placedByStaffName: o.placedByStaff?.name || o.placedByStaff?.email || null,
    items: o.items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      image: item.image,
    })),
    shipments: o.shipments.map((s) => ({
      id: s.id,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      status: s.status,
    })),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="orders.title"
        descriptionKey="orders.description"
        actions={
          <>
            <AdminLinkBtn
              href="/admin/orders/new"
              labelKey="orders.createOrder"
            />
            <AdminLinkBtn
              href="/api/admin/export/orders"
              labelKey="orders.exportOrders"
            />
            <AdminLinkBtn
              href="/api/admin/export/customers"
              labelKey="orders.exportCustomers"
            />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStat
          label={<AdminText id="orders.pendingPayment" />}
          value={pendingPayment.toLocaleString()}
          icon={Clock3}
          trendUp={pendingPayment === 0}
        />
        <AdminStat
          label={<AdminText id="orders.confirmed" />}
          value={confirmed.toLocaleString()}
          icon={CheckCircle2}
          trendUp
        />
        <AdminStat
          label={<AdminText id="orders.fulfillment" />}
          value={withSupplier.toLocaleString()}
          icon={Factory}
        />
        <AdminStat
          label={<AdminText id="orders.filterShipped" />}
          value={shipped.toLocaleString()}
          icon={Truck}
        />
        <AdminStat
          label={<AdminText id="orders.completed" />}
          value={completed.toLocaleString()}
          icon={PackageCheck}
          trendUp
        />
      </div>

      <OrdersPanel
        orders={panelOrders}
        suppliers={suppliers}
        allowedStatuses={allowedStatuses}
        canAssignSupplier={canAssignSupplier}
      />
    </div>
  );
}
