import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { saveCoupon } from "@/lib/admin-actions";
import { AdminBadge } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";

export const metadata = { title: "Coupons · UMAXES Ops" };

export default async function CouponsPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/coupons")) {
    redirect("/admin");
  }

  const coupons = await prisma.coupon.findMany({ orderBy: { code: "asc" } });

  return (
    <div>
      <AdminPageHeaderI18n
        titleKey="coupons.title"
        descriptionKey="coupons.description"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ul className="admin-list">
          {coupons.length === 0 && (
            <li className="admin-list-item text-sm admin-muted">No coupons yet.</li>
          )}
          {coupons.map((c) => (
            <li key={c.id} className="admin-list-item text-sm">
              <p className="font-semibold text-[var(--admin-gray-800)]">{c.code}</p>
              <p className="mt-1 admin-muted">
                {c.type} · {c.value} · min ${c.minOrder}
              </p>
              <div className="mt-2">
                <AdminBadge tone={c.active ? "success" : "neutral"}>
                  {c.active ? "active" : "off"}
                </AdminBadge>
              </div>
            </li>
          ))}
        </ul>

        <form
          action={async (fd) => {
            "use server";
            await saveCoupon({
              code: String(fd.get("code")),
              type: String(fd.get("type")),
              value: Number(fd.get("value")),
              minOrder: Number(fd.get("minOrder")),
              active: fd.get("active") === "on",
            });
          }}
          className="admin-card admin-card-pad h-fit"
        >
          <h2 className="admin-section-title">Create / update</h2>
          <label className="admin-label mt-4">
            Code
            <input name="code" required className="admin-input mt-1 w-full" />
          </label>
          <label className="admin-label mt-3">
            Type
            <select name="type" className="admin-input mt-1 w-full">
              <option value="percent">percent</option>
              <option value="fixed">fixed</option>
            </select>
          </label>
          <label className="admin-label mt-3">
            Value
            <input
              name="value"
              type="number"
              step="0.01"
              required
              className="admin-input mt-1 w-full"
            />
          </label>
          <label className="admin-label mt-3">
            Min order
            <input
              name="minOrder"
              type="number"
              step="0.01"
              defaultValue={0}
              className="admin-input mt-1 w-full"
            />
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--admin-gray-700)]">
            <input name="active" type="checkbox" defaultChecked /> Active
          </label>
          <button type="submit" className="admin-btn admin-btn-primary mt-5 w-full">
            Save coupon
          </button>
        </form>
      </div>
    </div>
  );
}
