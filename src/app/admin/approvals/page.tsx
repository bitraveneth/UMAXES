import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import ApprovalsPanel from "@/components/admin/ApprovalsPanel";

export const metadata = { title: "Approvals · UMAXES Ops" };

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/approvals")) {
    redirect("/admin");
  }

  const pendingUsers = await prisma.user.findMany({
    where: { status: "PENDING", role: "CUSTOMER" },
    include: {
      company: {
        include: {
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = pendingUsers.map((user) => {
    const address = user.company?.addresses[0];
    const addressSummary = address
      ? [address.city, address.region, address.country]
          .filter(Boolean)
          .join(", ")
      : null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
      companyName: user.company?.name || null,
      companyLevel: user.company?.level || null,
      taxId: user.company?.taxId || null,
      addressSummary,
    };
  });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="approvals.title"
        descriptionKey="approvals.description"
      />
      <ApprovalsPanel rows={rows} />
    </div>
  );
}
