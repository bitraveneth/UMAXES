import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { companyScopeForStaff } from "@/lib/sales-scope";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import CreateOrderPanel from "@/components/admin/CreateOrderPanel";

export const metadata = { title: "Create order · UMAXES Ops" };

export default async function AdminCreateOrderPage() {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/orders/new")
  ) {
    redirect("/admin");
  }

  const companies = await prisma.company.findMany({
    where: {
      status: "APPROVED",
      ...companyScopeForStaff(session.user.role, session.user.id),
    },
    include: {
      users: {
        where: { role: "CUSTOMER", status: "APPROVED" },
        orderBy: [{ companyRole: "asc" }, { createdAt: "asc" }],
        take: 3,
        select: { name: true, companyRole: true },
      },
      _count: { select: { addresses: true } },
    },
    orderBy: { name: "asc" },
  });

  const options = companies.map((c) => {
    const owner =
      c.users.find((u) => u.companyRole === "OWNER") || c.users[0];
    const canSeeCredit =
      session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    return {
      id: c.id,
      name: c.name,
      level: c.level,
      creditAllowed: c.creditLimit > 0,
      ...(canSeeCredit
        ? {
            creditLimit: c.creditLimit,
            creditUsed: c.creditUsed,
            paymentTermsDays: c.paymentTermsDays,
          }
        : {}),
      addressCount: c._count.addresses,
      contactName: owner?.name || null,
    };
  });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="createOrder.title"
        descriptionKey="createOrder.description"
        actions={
          <Link href="/admin/orders" className="admin-btn admin-btn-secondary">
            Back to orders
          </Link>
        }
      />
      <CreateOrderPanel companies={options} />
    </div>
  );
}
