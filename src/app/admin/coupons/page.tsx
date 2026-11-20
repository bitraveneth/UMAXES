import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import CouponsPanel from "@/components/admin/CouponsPanel";

export const metadata = { title: "Coupons · UMAXES Ops" };

export default async function CouponsPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/coupons")) {
    redirect("/admin");
  }

  const coupons = await prisma.coupon.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="coupons.title"
        descriptionKey="coupons.description"
      />
      <CouponsPanel
        coupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: c.value,
          minOrder: c.minOrder,
          active: c.active,
        }))}
      />
    </div>
  );
}
