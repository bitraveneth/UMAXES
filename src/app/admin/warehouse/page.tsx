import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import WarehouseStockPanel from "@/components/admin/WarehouseStockPanel";
import { TEST_STATION_SKU } from "@/lib/pack";

export const metadata = { title: "Warehouse · UMAXES Ops" };

function formatWhen(d: Date) {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function WarehousePage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/warehouse")) {
    redirect("/admin");
  }

  const [products, logs] = await Promise.all([
    prisma.product.findMany({
      include: { inventory: true },
      orderBy: { name: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { action: "INVENTORY_ADJUST" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    image: p.image,
    quantity: p.inventory?.quantity ?? 0,
    reserved: p.inventory?.reserved ?? 0,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="warehouse.title"
        descriptionKey="warehouse.description"
      />
      <WarehouseStockPanel
        products={rows}
        hasTestStation={products.some((p) => p.sku === TEST_STATION_SKU)}
        logs={logs.map((row) => {
          let sku = "";
          let product = "—";
          let previousQuantity: number | null = null;
          let quantity: number | null = null;
          if (row.meta) {
            try {
              const m = JSON.parse(row.meta) as {
                sku?: string;
                name?: string;
                previousQuantity?: number;
                quantity?: number;
              };
              sku = m.sku || "";
              product = m.name
                ? `${m.name}${m.sku ? ` · ${m.sku}` : ""}`
                : m.sku || "—";
              previousQuantity = m.previousQuantity ?? null;
              quantity = m.quantity ?? null;
            } catch {
              /* ignore */
            }
          }
          return {
            id: row.id,
            when: formatWhen(row.createdAt),
            who: row.user?.name || row.user?.email || "—",
            sku,
            product,
            previousQuantity,
            quantity,
          };
        })}
      />
    </div>
  );
}
