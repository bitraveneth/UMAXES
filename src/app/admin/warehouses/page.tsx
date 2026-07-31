import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import {
  upsertWarehouse,
  setWarehouseStock,
} from "@/lib/admin-actions";
import { AdminCard } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";

export const metadata = { title: "Warehouses · UMAXES Ops" };

export default async function WarehousesPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/warehouses")) {
    redirect("/admin");
  }

  const [warehouses, products] = await Promise.all([
    prisma.warehouse.findMany({
      include: { stocks: { include: { product: true } } },
      orderBy: { code: "asc" },
    }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeaderI18n
        titleKey="warehouses.title"
        descriptionKey="warehouses.description"
      />

      <form
        action={async (fd) => {
          "use server";
          await upsertWarehouse(
            String(fd.get("code")),
            String(fd.get("name")),
          );
        }}
        className="admin-card admin-card-pad flex flex-wrap gap-2"
      >
        <input
          name="code"
          placeholder="Code (LAX)"
          required
          className="admin-input"
        />
        <input name="name" placeholder="Name" required className="admin-input" />
        <button type="submit" className="admin-btn admin-btn-primary">
          Add warehouse
        </button>
      </form>

      {warehouses.map((wh) => (
        <AdminCard key={wh.id}>
          <h2 className="admin-section-title">
            {wh.code} · {wh.name}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--admin-gray-600)]">
            {wh.stocks.map((s) => (
              <li key={s.id} className="flex justify-between gap-3">
                <span>
                  {s.product.sku} · {s.product.name}
                </span>
                <span>
                  {s.quantity} on hand · {s.reserved} reserved
                </span>
              </li>
            ))}
            {wh.stocks.length === 0 && (
              <li className="admin-muted">No stock rows yet.</li>
            )}
          </ul>

          <form
            action={async (fd) => {
              "use server";
              await setWarehouseStock(
                wh.id,
                String(fd.get("productId")),
                Number(fd.get("quantity")),
              );
            }}
            className="mt-4 flex flex-wrap gap-2"
          >
            <select name="productId" required className="admin-input">
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} · {p.name}
                </option>
              ))}
            </select>
            <input
              name="quantity"
              type="number"
              min={0}
              defaultValue={0}
              className="admin-input w-24"
            />
            <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
              Set stock
            </button>
          </form>
        </AdminCard>
      ))}
    </div>
  );
}
