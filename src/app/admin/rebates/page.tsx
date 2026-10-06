import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { listRebatePolicies } from "@/lib/rebate";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import RebateManager from "@/components/admin/RebateManager";

export const metadata = { title: "Volume rebate · UMAXES Ops" };

export default async function AdminRebatesPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/rebates")) {
    redirect("/admin");
  }

  const [policies, months, companies, ledger] = await Promise.all([
    listRebatePolicies(),
    prisma.rebateMonth.findMany({
      include: { company: { select: { name: true, level: true } } },
      orderBy: [{ yearMonth: "desc" }, { updatedAt: "desc" }],
      take: 80,
    }),
    prisma.company.findMany({
      where: { level: { in: ["WHOLESALER", "DISTRO"] }, status: "APPROVED" },
      select: {
        id: true,
        name: true,
        level: true,
        rebateBalanceUsd: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.rebateLedger.findMany({
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return (
    <div>
      <AdminPageHeaderI18n
        titleKey="rebates.title"
        descriptionKey="rebates.description"
      />
      <RebateManager
        policies={policies}
        months={months.map((m) => ({
          id: m.id,
          companyId: m.companyId,
          companyName: m.company.name,
          level: m.company.level,
          yearMonth: m.yearMonth,
          paidQty: m.paidQty,
          tierRate: m.tierRate,
          rebateAmount: m.rebateAmount,
          issuedAmount: m.issuedAmount,
          status: m.status,
        }))}
        companies={companies}
        ledger={ledger.map((row) => ({
          id: row.id,
          companyName: row.company.name,
          type: row.type,
          amount: row.amount,
          note: row.note,
          createdAt: row.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
