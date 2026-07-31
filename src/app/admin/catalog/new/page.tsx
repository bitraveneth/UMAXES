import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { createProduct } from "@/lib/admin-actions";
import { AdminCard } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminLinkBtn, AdminText } from "@/components/admin/AdminI18nBits";
import { ProductImageField } from "@/components/admin/ProductImageField";
import { PRODUCT_IMAGE_HELP } from "@/lib/product-image";
import { Plus } from "lucide-react";

export const metadata = { title: "Add product · UMAXES Ops" };

export default async function NewCatalogProductPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/catalog")) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="catalog.newTitle"
        descriptionKey="catalog.newDescription"
        actions={
          <AdminLinkBtn
            href="/admin/catalog"
            labelKey="catalog.backToCatalog"
          />
        }
      />

      <AdminCard>
        <AdminText
          id="catalog.imageGuidelines"
          as="p"
          className="text-sm font-medium text-[var(--admin-text)]"
        />
        <p className="mt-1 text-sm admin-muted">
          {PRODUCT_IMAGE_HELP.formats} · {PRODUCT_IMAGE_HELP.maxUpload} ·{" "}
          {PRODUCT_IMAGE_HELP.output}. Current shop flavors are ~430–540 KB WebP —{" "}
          {PRODUCT_IMAGE_HELP.recommended}.
        </p>
      </AdminCard>

      <AdminCard>
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
            <Plus className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <AdminText
              id="catalog.newProduct"
              as="h2"
              className="text-base font-semibold text-[var(--admin-text)]"
            />
            <AdminText
              id="catalog.newHint"
              as="p"
              className="text-xs text-[var(--admin-muted)]"
            />
          </div>
        </div>

        <form
          action={async (fd) => {
            "use server";
            await createProduct({
              sku: String(fd.get("sku") || ""),
              name: String(fd.get("name") || ""),
              description: String(fd.get("description") || ""),
              image: String(fd.get("image") || ""),
              active: fd.get("active") === "on",
              stock: Number(fd.get("stock") || 0),
              distroPrice: Number(fd.get("distroPrice") || 0),
              wholesalerPrice: Number(fd.get("wholesalerPrice") || 0),
              shopPrice: Number(fd.get("shopPrice") || 0),
              distroMoq: Number(fd.get("distroMoq") || 50),
              wholesalerMoq: Number(fd.get("wholesalerMoq") || 20),
              shopMoq: Number(fd.get("shopMoq") || 5),
            });
            redirect("/admin/catalog");
          }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="admin-label">
            <AdminText id="catalog.sku" />
            <input
              name="sku"
              required
              placeholder="peach-mango"
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="admin-label">
            <AdminText id="catalog.name" />
            <input
              name="name"
              required
              placeholder="Peach Mango"
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="admin-label sm:col-span-2 lg:col-span-3">
            <AdminText id="catalog.descriptionLabel" />
            <textarea
              name="description"
              rows={3}
              className="admin-input mt-1.5 w-full"
              placeholder="Short product description for the storefront"
            />
          </label>

          <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4">
            <AdminText
              id="catalog.image"
              as="p"
              className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase"
            />
            <ProductImageField name="image" />
          </div>

          <label className="admin-label">
            <AdminText id="catalog.initialStock" />
            <input
              name="stock"
              type="number"
              min={0}
              defaultValue={0}
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="admin-label">
            <AdminText id="catalog.distroPrice" />
            <input
              name="distroPrice"
              type="number"
              step="0.01"
              min={0}
              defaultValue={0}
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="admin-label">
            <AdminText id="catalog.distroMoq" />
            <input
              name="distroMoq"
              type="number"
              min={1}
              defaultValue={50}
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="admin-label">
            <AdminText id="catalog.wholesalerPrice" />
            <input
              name="wholesalerPrice"
              type="number"
              step="0.01"
              min={0}
              defaultValue={0}
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="admin-label">
            <AdminText id="catalog.wholesalerMoq" />
            <input
              name="wholesalerMoq"
              type="number"
              min={1}
              defaultValue={20}
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="admin-label">
            <AdminText id="catalog.shopPriceField" />
            <input
              name="shopPrice"
              type="number"
              step="0.01"
              min={0}
              defaultValue={0}
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="admin-label">
            <AdminText id="catalog.shopMoq" />
            <input
              name="shopMoq"
              type="number"
              min={1}
              defaultValue={5}
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-[var(--admin-text)]">
            <input name="active" type="checkbox" defaultChecked />{" "}
            <AdminText id="catalog.activeStorefront" />
          </label>

          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-2 border-t border-[var(--admin-border)] pt-4">
            <button type="submit" className="admin-btn admin-btn-primary">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              <AdminText id="catalog.createProduct" />
            </button>
            <AdminLinkBtn href="/admin/catalog" labelKey="common.cancel" />
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
