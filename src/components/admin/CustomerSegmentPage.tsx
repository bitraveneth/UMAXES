import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import type { CustomerLevel } from "@/generated/prisma/enums";
import { CUSTOMER_SEGMENTS } from "@/lib/customer-segments";
import { companyScopeForStaff } from "@/lib/sales-scope";
import { AdminStat } from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminText } from "@/components/admin/AdminI18nBits";
import CustomersDirectory from "@/components/admin/CustomersDirectory";
import {
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
} from "lucide-react";

export async function CustomerSegmentPage({
  level,
}: {
  level: CustomerLevel;
}) {
  const segment = CUSTOMER_SEGMENTS[level];
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, segment.path)) {
    redirect("/admin");
  }

  const canSeeCreditAmounts =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  const companies = await prisma.company.findMany({
    where: {
      level,
      ...companyScopeForStaff(session.user.role, session.user.id),
    },
    include: {
      users: {
        where: { role: "CUSTOMER" },
        orderBy: { createdAt: "asc" },
        take: 8,
      },
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
      salesRep: { select: { name: true, email: true } },
      _count: { select: { orders: true, addresses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const approved = companies.filter((c) => c.status === "APPROVED").length;
  const pending = companies.filter((c) => c.status === "PENDING").length;
  const creditExposure = canSeeCreditAmounts
    ? companies.reduce((s, c) => s + c.creditUsed, 0)
    : companies.filter((c) => c.creditLimit > 0).length;

  const rows = companies.map((c) => ({
    id: c.id,
    name: c.name,
    level: c.level,
    status: c.status,
    taxId: c.taxId,
    creditEnabled: c.creditLimit > 0,
    ...(canSeeCreditAmounts
      ? {
          creditLimit: c.creditLimit,
          creditUsed: c.creditUsed,
          paymentTermsDays: c.paymentTermsDays,
        }
      : {}),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    orderCount: c._count.orders,
    addressCount: c._count.addresses,
    salesRepName: c.salesRep?.name || c.salesRep?.email || null,
    contacts: c.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      status: u.status,
      companyRole: u.companyRole,
    })),
    addresses: c.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      region: a.region,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    })),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey={segment.titleKey}
        descriptionKey={segment.descriptionKey}
      />

      <div
        className={`grid gap-4 sm:grid-cols-2 ${
          level === "SHOP" ? "xl:grid-cols-3" : "xl:grid-cols-4"
        }`}
      >
        <AdminStat
          label={<AdminText id="customers.statTotal" />}
          value={companies.length.toLocaleString()}
          icon={Building2}
        />
        <AdminStat
          label={<AdminText id="customers.statApproved" />}
          value={approved.toLocaleString()}
          icon={CheckCircle2}
          trendUp
        />
        <AdminStat
          label={<AdminText id="customers.statPending" />}
          value={pending.toLocaleString()}
          icon={Clock3}
          trendUp={pending === 0}
        />
        {level !== "SHOP" ? (
          <AdminStat
            label={<AdminText id="customers.statExposure" />}
            value={
              canSeeCreditAmounts
                ? `$${Math.round(creditExposure).toLocaleString()}`
                : `${creditExposure} on`
            }
            icon={CreditCard}
          />
        ) : null}
      </div>

      <CustomersDirectory
        level={level}
        rows={rows}
        canSeeCreditAmounts={canSeeCreditAmounts}
      />
    </div>
  );
}
