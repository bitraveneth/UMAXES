import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { BankAccountsPanel } from "@/components/admin/BankAccountsPanel";

export const metadata = { title: "Invoices · UMAXES Ops" };

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/invoices")) {
    redirect("/admin");
  }

  const accounts = await prisma.bankAccount.findMany({
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="invoices.title"
        descriptionKey="invoices.description"
      />
      <BankAccountsPanel accounts={accounts} />
    </div>
  );
}
