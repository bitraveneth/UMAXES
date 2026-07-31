import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { paymentLabels } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { orderCompanyScopeForStaff } from "@/lib/sales-scope";
import {
  AdminStat,
  AdminCard,
  AdminBadge,
} from "@/components/admin/ui";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminLinkBtn, AdminText } from "@/components/admin/AdminI18nBits";
import { AdminAccessDeniedBanner } from "@/components/admin/AdminAccessDeniedBanner";
import LogisticsRecentFulfillment from "@/components/admin/LogisticsRecentFulfillment";
import LogisticsQueueCard from "@/components/admin/LogisticsQueueCard";
import LogisticsShipmentsChart from "@/components/admin/LogisticsShipmentsChart";
import { Building2, Package } from "@/components/admin/icons";
import {
  CheckCircle2,
  Clock3,
  Factory,
  RotateCcw,
  Truck,
  ShoppingBag,
  UserCheck,
} from "lucide-react";
import type { UserRole } from "@/generated/prisma/enums";

export const metadata = { title: "Dashboard · UMAXES Ops" };

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function orderTone(status: string) {
  if (status === "COMPLETED" || status === "CONFIRMED") return "success" as const;
  if (status === "SHIPPED") return "warning" as const;
  if (status === "CANCELLED" || status === "REJECTED") return "error" as const;
  if (status === "PAYMENT_PENDING" || status === "SUBMITTED")
    return "warning" as const;
  if (status === "SENT_TO_SUPPLIER" || status === "PICKING")
    return "brand" as const;
  return "neutral" as const;
}

function statusLabelKey(status: string) {
  return `orders.status${status}`;
}

type DashCard = {
  label: string;
  value: number;
  href: string;
  icon: typeof Clock3;
  trendUp?: boolean;
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ denied?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const deniedPath =
    typeof params.denied === "string" && params.denied.startsWith("/admin/")
      ? params.denied
      : null;

  const role = session.user.role as UserRole;
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const isOps = role === "ADMIN" || role === "SUPER_ADMIN";
  const isSales = isOps || role === "SALES";
  const isLogistics = role === "LOGISTICS";
  const isWarehouse = role === "WAREHOUSE";
  const canSeeMoney = isOps || role === "SALES";

  const salesScope = orderCompanyScopeForStaff(role, session.user.id);

  if (isLogistics) {
    const [awaitingPacking, awaitingTracking, inTransit, deliveredYtd, shipEvents, recent] =
      await Promise.all([
        prisma.order.count({
          where: {
            status: { in: ["CONFIRMED", "SENT_TO_SUPPLIER", "PICKING"] },
            shipments: { none: { OR: [{ packedAt: { not: null } }, { boxCount: { not: null } }] } },
          },
        }),
        prisma.order.count({
          where: {
            status: { notIn: ["SHIPPED", "COMPLETED", "CANCELLED"] },
            shipments: {
              some: {
                OR: [{ packedAt: { not: null } }, { boxCount: { not: null } }],
                trackingNumber: null,
              },
            },
          },
        }),
        prisma.order.count({ where: { status: "SHIPPED" } }),
        prisma.order.count({
          where: { status: "COMPLETED", updatedAt: { gte: yearStart } },
        }),
        prisma.order.findMany({
          where: {
            status: { in: ["SHIPPED", "COMPLETED"] },
          },
          select: { updatedAt: true, status: true },
          orderBy: { updatedAt: "asc" },
          take: 5000,
        }),
        prisma.order.findMany({
          where: {
            status: {
              in: ["CONFIRMED", "SENT_TO_SUPPLIER", "PICKING", "SHIPPED", "COMPLETED"],
            },
          },
          include: {
            company: { select: { name: true } },
            items: { select: { name: true, image: true, quantity: true } },
            shipments: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                trackingNumber: true,
                carrier: true,
                packedAt: true,
                boxCount: true,
                cbm: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),
      ]);

    function parseRoute(snap: string) {
      try {
        const a = JSON.parse(snap) as { city?: string; country?: string };
        return [a.city, a.country].filter(Boolean).join(" → ") || "—";
      } catch {
        return "—";
      }
    }

    const cards: DashCard[] = [
      {
        label: "dashboard.awaitingPacking",
        value: awaitingPacking,
        href: "/admin/logistics",
        icon: Package,
      },
      {
        label: "dashboard.awaitingTracking",
        value: awaitingTracking,
        href: "/admin/logistics/shipments",
        icon: Factory,
      },
      {
        label: "dashboard.shipped",
        value: inTransit,
        href: "/admin/logistics/shipments",
        icon: Truck,
        trendUp: inTransit > 0,
      },
      {
        label: "dashboard.deliveredYtd",
        value: deliveredYtd,
        href: "/admin/logistics/shipments",
        icon: CheckCircle2,
        trendUp: true,
      },
    ];

    const recentRows = recent.map((o) => {
      const ship = o.shipments[0];
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        updatedAt: o.updatedAt.toISOString(),
        companyName: o.company.name,
        route: parseRoute(o.addressSnap),
        totalUnits: o.items.reduce((n, i) => n + i.quantity, 0),
        lineCount: o.items.length,
        hasPacking: Boolean(ship?.packedAt || ship?.boxCount),
        boxCount: ship?.boxCount ?? null,
        cbm: ship?.cbm ?? null,
        trackingNumber: ship?.trackingNumber ?? null,
        carrier: ship?.carrier ?? null,
        firstItemName: o.items[0]?.name ?? null,
        firstItemImage: o.items[0]?.image ?? null,
      };
    });

    return (
      <div>
        {deniedPath ? <AdminAccessDeniedBanner deniedPath={deniedPath} /> : null}
        <AdminPageHeaderI18n
          titleKey="dashboard.title"
          descriptionKey="dashboard.descriptionLogistics"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <AdminStat
              key={card.label}
              label={<AdminText id={card.label} />}
              value={card.value.toLocaleString()}
              href={card.href}
              icon={card.icon}
              trendUp={card.trendUp}
            />
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <LogisticsShipmentsChart
            events={shipEvents.map((e) => ({
              updatedAt: e.updatedAt.toISOString(),
              status: e.status,
            }))}
          />

          <LogisticsQueueCard
            awaitingPacking={awaitingPacking}
            awaitingTracking={awaitingTracking}
            inTransit={inTransit}
            deliveredYtd={deliveredYtd}
          />
        </div>

        <div className="mt-6">
          <AdminCard padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
              <div>
                <AdminText
                  id="dashboard.recentShipments"
                  as="h2"
                  className="admin-section-title"
                />
                <AdminText
                  id="dashboard.recentShipmentsHint"
                  as="p"
                  className="text-sm text-[var(--admin-muted)]"
                />
              </div>
              <AdminLinkBtn
                href="/admin/logistics/shipments"
                labelKey="dashboard.seeAll"
              />
            </div>
            <LogisticsRecentFulfillment orders={recentRows} />
          </AdminCard>
        </div>
      </div>
    );
  }

  // —— Sales / warehouse / admin dashboards ——
  const [
    paymentPending,
    openOrders,
    needsSupplier,
    shippedInTransit,
    companies,
    openRmas,
    pendingApprovals,
    creditAgg,
    revenueAgg,
    yearOrders,
    recentOrders,
  ] = await Promise.all([
    canSeeMoney
      ? prisma.order.count({
          where: { status: "PAYMENT_PENDING", ...salesScope },
        })
      : Promise.resolve(0),
    prisma.order.count({
      where: {
        status: {
          in: [
            "SUBMITTED",
            "PAYMENT_PENDING",
            "CONFIRMED",
            "SENT_TO_SUPPLIER",
            "PICKING",
            "SHIPPED",
          ],
        },
        ...salesScope,
      },
    }),
    prisma.order.count({
      where: { status: "CONFIRMED", supplierId: null, ...salesScope },
    }),
    prisma.order.count({
      where: { status: "SHIPPED", ...salesScope },
    }),
    isSales
      ? prisma.company.count({
          where: {
            status: "APPROVED",
            ...(role === "SALES" ? { salesRepId: session.user.id } : {}),
          },
        })
      : Promise.resolve(0),
    isSales
      ? prisma.rma.count({
          where: { status: { in: ["REQUESTED", "APPROVED", "RECEIVED"] } },
        })
      : Promise.resolve(0),
    isSales
      ? prisma.user.count({ where: { status: "PENDING", role: "CUSTOMER" } })
      : Promise.resolve(0),
    canSeeMoney
      ? prisma.company.aggregate({
          where: {
            status: "APPROVED",
            ...(role === "SALES" ? { salesRepId: session.user.id } : {}),
          },
          _sum: { creditUsed: true, creditLimit: true },
        })
      : Promise.resolve({ _sum: { creditUsed: 0, creditLimit: 0 } }),
    canSeeMoney
      ? prisma.order.aggregate({
          where: {
            status: {
              in: [
                "CONFIRMED",
                "SENT_TO_SUPPLIER",
                "PICKING",
                "SHIPPED",
                "COMPLETED",
              ],
            },
            ...salesScope,
          },
          _sum: { total: true },
        })
      : Promise.resolve({ _sum: { total: 0 } }),
    prisma.order.findMany({
      where: { createdAt: { gte: yearStart }, ...salesScope },
      select: { createdAt: true, total: true, status: true },
    }),
    prisma.order.findMany({
      where: { ...salesScope },
      include: {
        company: { select: { name: true } },
        items: { take: 1, select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const monthlyCounts = Array.from({ length: 12 }, () => 0);
  const monthlyRevenue = Array.from({ length: 12 }, () => 0);
  for (const o of yearOrders) {
    const m = o.createdAt.getMonth();
    monthlyCounts[m] += 1;
    if (
      canSeeMoney &&
      [
        "CONFIRMED",
        "SENT_TO_SUPPLIER",
        "PICKING",
        "SHIPPED",
        "COMPLETED",
      ].includes(o.status)
    ) {
      monthlyRevenue[m] += o.total;
    }
  }
  const maxCount = Math.max(...monthlyCounts, 1);
  const revenue = revenueAgg._sum.total || 0;
  const target = 50000;
  const targetPct = Math.min(100, Math.round((revenue / target) * 1000) / 10);
  const gaugeRotation = Math.round((targetPct / 100) * 180);
  const creditUsed = creditAgg._sum.creditUsed || 0;
  const creditLimit = creditAgg._sum.creditLimit || 0;

  const cards: DashCard[] = [];

  if (canSeeMoney) {
    cards.push({
      label: "dashboard.paymentPending",
      value: paymentPending,
      href: "/admin/orders",
      icon: Clock3,
      trendUp: paymentPending === 0,
    });
  }

  if (isSales || isWarehouse) {
    cards.push({
      label: "dashboard.openOrders",
      value: openOrders,
      href: "/admin/orders",
      icon: ShoppingBag,
    });
  }

  if (isSales) {
    cards.push({
      label: "dashboard.needsSupplier",
      value: needsSupplier,
      href: "/admin/orders",
      icon: Factory,
    });
  }

  cards.push({
    label: "dashboard.shipped",
    value: shippedInTransit,
    href: isWarehouse ? "/admin/orders" : "/admin/logistics",
    icon: Truck,
  });

  if (isSales) {
    cards.push({
      label: "dashboard.customers",
      value: companies,
      href: "/admin/customers",
      icon: Building2,
    });
    cards.push({
      label: "dashboard.openReturns",
      value: openRmas,
      href: "/admin/rma",
      icon: RotateCcw,
      trendUp: openRmas === 0,
    });
    cards.push({
      label: "dashboard.pendingApprovals",
      value: pendingApprovals,
      href: "/admin/approvals",
      icon: UserCheck,
      trendUp: pendingApprovals === 0,
    });
  }

  const descriptionKey = isOps
    ? "dashboard.description"
    : isSales
      ? "dashboard.descriptionSales"
      : "dashboard.descriptionWarehouse";

  return (
    <div>
      {deniedPath ? <AdminAccessDeniedBanner deniedPath={deniedPath} /> : null}
      <AdminPageHeaderI18n
        titleKey="dashboard.title"
        descriptionKey={descriptionKey}
        actions={
          canSeeMoney ? (
            <a
              href="/api/admin/export/orders"
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              <AdminText id="dashboard.export" />
            </a>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <AdminStat
            key={card.label}
            label={<AdminText id={card.label} />}
            value={card.value.toLocaleString()}
            href={card.href}
            icon={card.icon}
            trendUp={card.trendUp}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <AdminCard className={canSeeMoney ? "xl:col-span-2" : "xl:col-span-3"}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <AdminText
                id="dashboard.monthlyOrders"
                as="h2"
                className="admin-section-title"
              />
              <AdminText
                id="dashboard.monthlyOrdersHint"
                as="p"
                className="admin-subtitle mt-0"
              />
            </div>
            <AdminBadge tone="brand">{new Date().getFullYear()}</AdminBadge>
          </div>
          <div className="admin-bar-chart">
            {monthlyCounts.map((count, i) => (
              <div key={MONTHS[i]} className="admin-bar-chart-col">
                <div
                  className="admin-bar-chart-bar"
                  style={{
                    height: `${Math.max(4, (count / maxCount) * 100)}%`,
                  }}
                  title={`${MONTHS[i]}: ${count}`}
                />
                <span className="admin-bar-chart-label">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </AdminCard>

        {canSeeMoney ? (
          <AdminCard>
            <AdminText
              id="dashboard.monthlyTarget"
              as="h2"
              className="admin-section-title"
            />
            <AdminText
              id="dashboard.monthlyTargetHint"
              as="p"
              className="admin-subtitle mt-0"
            />
            <div className="mt-8 admin-gauge">
              <div
                className="admin-gauge-fill"
                style={{ transform: `rotate(${gaugeRotation - 180}deg)` }}
              />
              <div className="admin-gauge-value">{targetPct}%</div>
            </div>
            <AdminText
              id="dashboard.revenueNote"
              as="p"
              className="mt-4 text-center text-sm text-[var(--admin-muted)]"
              values={{
                amount: `$${revenue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`,
              }}
            />
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-[var(--admin-border)] pt-4 text-center text-sm">
              <div>
                <AdminText
                  id="dashboard.targetLabel"
                  as="p"
                  className="text-[var(--admin-muted)]"
                />
                <p className="mt-1 font-semibold text-[var(--admin-text)]">$50K</p>
              </div>
              <div>
                <AdminText
                  id="dashboard.revenueLabel"
                  as="p"
                  className="text-[var(--admin-muted)]"
                />
                <p className="mt-1 font-semibold text-[var(--admin-text)]">
                  ${(revenue / 1000).toFixed(1)}K
                </p>
              </div>
              <div>
                <AdminText
                  id="dashboard.creditLabel"
                  as="p"
                  className="text-[var(--admin-muted)]"
                />
                <p className="mt-1 font-semibold text-[var(--admin-text)]">
                  ${(creditUsed / 1000).toFixed(1)}K
                  <span className="block text-[10px] font-normal text-[var(--admin-muted)]">
                    / ${(creditLimit / 1000).toFixed(0)}K
                  </span>
                </p>
              </div>
            </div>
          </AdminCard>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <AdminCard
          className={canSeeMoney ? "xl:col-span-2" : "xl:col-span-3"}
          padded={false}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
            <div>
              <AdminText
                id="dashboard.recentOrders"
                as="h2"
                className="admin-section-title"
              />
              <AdminText
                id="dashboard.recentOrdersHint"
                as="p"
                className="text-sm text-[var(--admin-muted)]"
              />
            </div>
            <AdminLinkBtn href="/admin/orders" labelKey="dashboard.seeAll" />
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <AdminText id="dashboard.colOrder" />
                  </th>
                  <th>
                    <AdminText id="dashboard.colCompany" />
                  </th>
                  {canSeeMoney ? (
                    <>
                      <th>
                        <AdminText id="dashboard.colPayment" />
                      </th>
                      <th>
                        <AdminText id="dashboard.colTotal" />
                      </th>
                    </>
                  ) : null}
                  <th>
                    <AdminText id="dashboard.colStatus" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={canSeeMoney ? 5 : 3} className="admin-muted">
                      <AdminText id="dashboard.noOrders" />
                    </td>
                  </tr>
                )}
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[var(--admin-gray-100)]">
                          {order.items[0]?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={order.items[0].image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-4 w-4 text-[var(--admin-muted)]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--admin-text)]">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-[var(--admin-muted)]">
                            {order.items[0]?.name || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{order.company.name}</td>
                    {canSeeMoney ? (
                      <>
                        <td>{paymentLabels[order.paymentMethod]}</td>
                        <td>${order.total.toFixed(2)}</td>
                      </>
                    ) : null}
                    <td>
                      <AdminBadge tone={orderTone(order.status)}>
                        <AdminText id={statusLabelKey(order.status)} />
                      </AdminBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        {canSeeMoney ? (
          <AdminCard>
            <AdminText
              id="dashboard.revenueByMonth"
              as="h2"
              className="admin-section-title"
            />
            <AdminText
              id="dashboard.revenueByMonthHint"
              as="p"
              className="admin-subtitle mt-0"
            />
            <ul className="mt-4 space-y-3">
              {MONTHS.map((label, i) => ({ label, amount: monthlyRevenue[i], i }))
                .filter((row) => row.i <= new Date().getMonth())
                .slice(-6)
                .map((row) => {
                  const max = Math.max(
                    ...monthlyRevenue.slice(0, new Date().getMonth() + 1),
                    1,
                  );
                  return (
                    <li key={row.label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-[var(--admin-muted)]">
                          {row.label}
                        </span>
                        <span className="font-medium text-[var(--admin-text)]">
                          ${row.amount.toFixed(0)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-gray-100)]">
                        <div
                          className="h-full rounded-full bg-[var(--admin-brand-500)]"
                          style={{ width: `${(row.amount / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          </AdminCard>
        ) : null}
      </div>
    </div>
  );
}
