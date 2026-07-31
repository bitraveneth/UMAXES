import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { adjustInventory, updateOrderStatus } from "@/lib/admin-actions";
import { AdminBadge, AdminTable } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";

export const metadata = { title: "Warehouse · UMAXES Ops" };

export default async function WarehousePage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/warehouse")) {
    redirect("/admin");
  }

  const [inventory, pickOrders] = await Promise.all([
    prisma.inventory.findMany({
      include: { product: true },
      orderBy: { quantity: "asc" },
    }),
    prisma.order.findMany({
      where: { status: { in: ["CONFIRMED", "PICKING"] } },
      include: {
        items: { select: { sku: true, name: true, quantity: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <AdminPageHeaderI18n
        titleKey="warehouse.title"
        descriptionKey="warehouse.description"
      />

      <section>
        <h2 className="admin-section-title mb-4">Pick queue</h2>
        <ul className="space-y-3">
          {pickOrders.length === 0 && (
            <li className="admin-card admin-card-pad text-sm admin-muted">
              No confirmed orders to pick.
            </li>
          )}
          {pickOrders.map((order) => (
            <li key={order.id} className="admin-card admin-card-pad">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[var(--admin-gray-800)]">
                  {order.orderNumber} · {order.company.name}
                </p>
                <AdminBadge tone="brand">{order.status}</AdminBadge>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-[var(--admin-gray-600)]">
                {order.items.map((item) => (
                  <li key={item.sku}>
                    {item.sku} — {item.name}: <strong>{item.quantity}</strong>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <form action={updateOrderStatus.bind(null, order.id, "PICKING")}>
                  <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
                    Mark picking
                  </button>
                </form>
                <form action={updateOrderStatus.bind(null, order.id, "CONFIRMED")}>
                  <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
                    Back to confirmed
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="admin-section-title mb-4">Inventory</h2>
        <AdminTable
          headers={["SKU", "Name", "On hand", "Reserved", "Available", "Adjust"]}
        >
          {inventory.map((row) => (
            <tr key={row.id}>
              <td>{row.product.sku}</td>
              <td>{row.product.name}</td>
              <td>{row.quantity}</td>
              <td>{row.reserved}</td>
              <td className="font-semibold">{row.quantity - row.reserved}</td>
              <td>
                <form
                  action={async (fd) => {
                    "use server";
                    const qty = Number(fd.get("quantity"));
                    await adjustInventory(row.productId, qty);
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="quantity"
                    type="number"
                    min={0}
                    defaultValue={row.quantity}
                    className="admin-input w-24"
                  />
                  <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
                    Save
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
