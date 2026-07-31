import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminStat } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminLinkBtn, AdminText } from "@/components/admin/AdminI18nBits";
import CatalogProductsPanel, {
  optionValuesLabel,
} from "@/components/admin/CatalogProductsPanel";
import { Box, Package, Plus, ShoppingBag } from "lucide-react";

export const metadata = { title: "Catalog · UMAXES Ops" };

export default async function CatalogPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/catalog")) {
    redirect("/admin");
  }

  const products = await prisma.product.findMany({
    include: {
      prices: true,
      inventory: true,
      options: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const activeCount = products.filter((p) => p.active).length;
  const inactiveCount = products.length - activeCount;
  const lowStock = products.filter(
    (p) => (p.inventory?.quantity ?? 0) > 0 && (p.inventory?.quantity ?? 0) < 20,
  ).length;
  const outOfStock = products.filter(
    (p) => (p.inventory?.quantity ?? 0) <= 0,
  ).length;

  return (
    <div className="space-y-8">
      <AdminPageHeaderI18n
        titleKey="catalog.title"
        descriptionKey="catalog.description"
        actions={
          <AdminLinkBtn
            href="/admin/catalog/new"
            labelKey="catalog.addProduct"
            variant="primary"
            icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          label={<AdminText id="catalog.totalProducts" />}
          value={String(products.length)}
          icon={Package}
        />
        <AdminStat
          label={<AdminText id="catalog.active" />}
          value={String(activeCount)}
          icon={ShoppingBag}
          trend={<AdminText id="catalog.inactiveCount" values={{ count: inactiveCount }} />}
          trendUp={inactiveCount === 0}
        />
        <AdminStat
          label={<AdminText id="catalog.lowStock" />}
          value={String(lowStock)}
          icon={Box}
        />
        <AdminStat
          label={<AdminText id="catalog.outOfStock" />}
          value={String(outOfStock)}
          icon={Box}
          trend={
            outOfStock > 0 ? (
              <AdminText id="catalog.needsRestock" />
            ) : (
              <AdminText id="catalog.allStocked" />
            )
          }
          trendUp={outOfStock === 0}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <AdminText id="catalog.listed" as="h2" className="admin-section-title mb-0" />
          <AdminText
            id="catalog.listedHint"
            values={{ count: products.length }}
            as="p"
            className="text-xs text-[var(--admin-muted)]"
          />
        </div>

        <CatalogProductsPanel
          products={products.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            description: p.description,
            image: p.image,
            active: p.active,
            visibleLevels: p.visibleLevels,
            stock: p.inventory?.quantity ?? 0,
            reserved: p.inventory?.reserved ?? 0,
            optionCount: p.options.length,
            options: p.options.map((o) => ({
              id: o.id,
              name: o.name,
              valuesLabel: optionValuesLabel(o.values),
            })),
            prices: p.prices.map((pr) => ({
              level: pr.level,
              unitPrice: pr.unitPrice,
              moq: pr.moq,
            })),
          }))}
        />
      </section>
    </div>
  );
}
