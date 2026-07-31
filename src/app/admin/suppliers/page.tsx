import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { upsertSupplier } from "@/lib/admin-actions";
import { AdminBadge, AdminCard, AdminStat } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminText } from "@/components/admin/AdminI18nBits";
import { Factory } from "lucide-react";

export const metadata = { title: "Suppliers · UMAXES Ops" };

export default async function SuppliersPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/suppliers")) {
    redirect("/admin");
  }

  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  const active = suppliers.filter((s) => s.active).length;
  const withOrders = suppliers.filter((s) => s._count.orders > 0).length;
  const openAssigned = await prisma.order.count({
    where: {
      supplierId: { not: null },
      status: { in: ["SENT_TO_SUPPLIER", "PICKING"] },
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="suppliers.title"
        descriptionKey="suppliers.description"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStat
          label={<AdminText id="suppliers.statActive" />}
          value={active.toLocaleString()}
          icon={Factory}
          trendUp={active > 0}
        />
        <AdminStat
          label={<AdminText id="suppliers.statWithOrders" />}
          value={withOrders.toLocaleString()}
          icon={Factory}
        />
        <AdminStat
          label={<AdminText id="suppliers.statOpenAssigned" />}
          value={openAssigned.toLocaleString()}
          icon={Factory}
        />
      </div>

      <AdminCard padded={false}>
        <div className="border-b border-[var(--admin-border)] px-5 py-4">
          <AdminText
            id="suppliers.listed"
            as="h2"
            className="admin-section-title mb-0"
          />
          <AdminText
            id="suppliers.listedHint"
            as="p"
            className="mt-1 text-sm text-[var(--admin-muted)]"
            values={{ count: suppliers.length }}
          />
        </div>

        {suppliers.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--admin-muted)]">
            <AdminText id="suppliers.empty" />
          </p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {suppliers.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-start justify-between gap-4 px-5 py-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--admin-text)]">
                      {s.name}
                    </p>
                    <AdminBadge tone={s.active ? "success" : "neutral"}>
                      {s.active ? (
                        <AdminText id="suppliers.active" />
                      ) : (
                        "Off"
                      )}
                    </AdminBadge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">
                    {[s.contactName, s.email, s.phone].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                  {s.notes ? (
                    <p className="mt-1 text-sm text-[var(--admin-text)]">{s.notes}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--admin-muted)]">
                    Orders: {s._count.orders}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
            <Factory className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <AdminText
            id="suppliers.add"
            as="h2"
            className="text-base font-semibold text-[var(--admin-text)]"
          />
        </div>
        <form
          action={async (fd) => {
            "use server";
            await upsertSupplier({
              name: String(fd.get("name") || ""),
              contactName: String(fd.get("contactName") || ""),
              email: String(fd.get("email") || ""),
              phone: String(fd.get("phone") || ""),
              notes: String(fd.get("notes") || ""),
              active: true,
            });
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="admin-label text-xs">
            <AdminText id="suppliers.name" />
            <input name="name" required className="admin-input mt-1.5 w-full" />
          </label>
          <label className="admin-label text-xs">
            <AdminText id="suppliers.contact" />
            <input name="contactName" className="admin-input mt-1.5 w-full" />
          </label>
          <label className="admin-label text-xs">
            <AdminText id="suppliers.email" />
            <input
              name="email"
              type="email"
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="admin-label text-xs">
            <AdminText id="suppliers.phone" />
            <input name="phone" className="admin-input mt-1.5 w-full" />
          </label>
          <label className="admin-label text-xs sm:col-span-2">
            <AdminText id="suppliers.notes" />
            <input name="notes" className="admin-input mt-1.5 w-full" />
          </label>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="admin-btn admin-btn-primary">
              <AdminText id="suppliers.create" />
            </button>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
