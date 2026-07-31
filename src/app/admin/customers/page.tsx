import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminCard } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminText } from "@/components/admin/AdminI18nBits";
import { Boxes, Network, Store } from "lucide-react";

export const metadata = { title: "Customers · UMAXES Ops" };

export default async function CustomersHubPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/customers")) {
    redirect("/admin");
  }

  const [distro, wholesaler, retail] = await Promise.all([
    prisma.company.count({ where: { level: "DISTRO" } }),
    prisma.company.count({ where: { level: "WHOLESALER" } }),
    prisma.company.count({ where: { level: "SHOP" } }),
  ]);

  const cards = [
    {
      href: "/admin/distributors",
      titleKey: "customers.distroTitle",
      descKey: "customers.distroDescription",
      count: distro,
      icon: Network,
    },
    {
      href: "/admin/wholesalers",
      titleKey: "customers.wholesalerTitle",
      descKey: "customers.wholesalerDescription",
      count: wholesaler,
      icon: Boxes,
    },
    {
      href: "/admin/retail",
      titleKey: "customers.retailTitle",
      descKey: "customers.retailDescription",
      count: retail,
      icon: Store,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="customers.title"
        descriptionKey="customers.description"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="block">
              <AdminCard className="h-full transition hover:border-[var(--admin-brand-200)] hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <AdminText
                      id={card.titleKey}
                      as="h2"
                      className="text-base font-semibold text-[var(--admin-text)]"
                    />
                    <AdminText
                      id={card.descKey}
                      as="p"
                      className="mt-1 text-sm text-[var(--admin-muted)]"
                    />
                    <p className="mt-4 text-2xl font-semibold tabular-nums text-[var(--admin-text)]">
                      {card.count}
                    </p>
                    <p className="text-xs text-[var(--admin-muted)]">
                      <AdminText id="customers.openDirectory" />
                    </p>
                  </div>
                </div>
              </AdminCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
