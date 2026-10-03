import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminCard } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminText } from "@/components/admin/AdminI18nBits";
import { BankAccountsPanel } from "@/components/admin/BankAccountsPanel";
import { CreditCard, Landmark, Sparkles } from "lucide-react";

export const metadata = { title: "Payments · UMAXES Ops" };

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/payments")) {
    redirect("/admin");
  }

  const accounts = await prisma.bankAccount.findMany({
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="payments.title"
        descriptionKey="payments.description"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
              <Landmark className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--admin-text)]">
                <AdminText id="payments.bankTitle" />
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                <AdminText id="payments.bankDescription" />
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-gray-100)] text-[var(--admin-muted)]">
              <CreditCard className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--admin-text)]">
                  <AdminText id="payments.onlineTitle" />
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-warning-50)] px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-[var(--admin-warning-700)] uppercase">
                  <Sparkles className="h-3 w-3" strokeWidth={2} />
                  <AdminText id="payments.onlineSoon" />
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                <AdminText id="payments.onlineDescription" />
              </p>
              <p className="mt-3 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-3.5 py-3 text-sm text-[var(--admin-muted)]">
                <AdminText id="payments.onlineSoonHint" />
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      <BankAccountsPanel accounts={accounts} />
    </div>
  );
}
