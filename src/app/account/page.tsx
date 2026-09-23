import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import OverviewHeader from "@/components/account/OverviewHeader";
import OverviewStatCards from "@/components/account/OverviewStatCards";
import {
  buyerStatusClass,
  buyerStatusLabel,
} from "@/lib/buyer-order";
import { Package } from "lucide-react";
import OverviewRebateCard from "@/components/account/OverviewRebateCard";
import { isChannelBuyerLevel } from "@/lib/channel-level";
import { formatPack } from "@/lib/pack";

export const metadata = {
  title: "Account · UMAXES",
};

function shortPayment(method: string) {
  switch (method) {
    case "TT":
      return "TT";
    case "CHECK":
      return "Check";
    case "ONLINE":
      return "Online";
    case "CREDIT":
      return "Credit";
    default:
      return method;
  }
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const { role, status, name, companyId } = session.user;

  if (isStaff(role)) redirect("/admin");
  if (status === "PENDING") redirect("/account/pending");
  if (status === "REJECTED" || status === "DISABLED") {
    return (
      <>
        <Header />
        <main className="flex-1 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-lg">
            <h1 className="font-display text-3xl font-bold">Account inactive</h1>
            <p className="mt-3 font-body text-black">
              This account cannot place orders. Contact sales if you need help.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const [company, openOrders, paymentPending, wishlistCount, recentOrders, addresses] =
    await Promise.all([
      companyId
        ? prisma.company.findUnique({
            where: { id: companyId },
            select: {
              name: true,
              level: true,
              rebateBalanceUsd: true,
            },
          })
        : null,
      companyId
        ? prisma.order.count({
            where: {
              companyId,
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
            },
          })
        : 0,
      companyId
        ? prisma.order.count({
            where: { companyId, status: "PAYMENT_PENDING" },
          })
        : 0,
      prisma.favorite.count({ where: { userId: session.user.id } }),
      companyId
        ? prisma.order.findMany({
            where: { companyId },
            include: {
              shipments: {
                select: {
                  trackingNumber: true,
                  carrier: true,
                  trackingStatus: true,
                  status: true,
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              payments: {
                select: { status: true, paidAt: true, slipUrl: true },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
              _count: { select: { items: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          })
        : [],
      companyId
        ? prisma.address.findMany({
            where: { companyId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
            take: 3,
            select: {
              id: true,
              label: true,
              recipientName: true,
              phone: true,
              line1: true,
              city: true,
              region: true,
              postalCode: true,
              country: true,
              isDefault: true,
            },
          })
        : [],
    ]);

  return (
    <div>
      <OverviewHeader name={name} companyName={company?.name} />

      <OverviewStatCards
        openOrders={openOrders}
        paymentPending={paymentPending}
        wishlistCount={wishlistCount}
      />

      {isChannelBuyerLevel(company?.level) ? (
        <OverviewRebateCard walletUsd={company?.rebateBalanceUsd ?? 0} />
      ) : null}

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-[10px] font-semibold tracking-[0.16em] text-umx-orange uppercase">
              Delivery
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold text-black sm:text-2xl">
              Shipping address
            </h2>
            <p className="mt-1 font-body text-sm text-black">
              Used at checkout for delivery
            </p>
          </div>
          <Link
            href="/account/addresses"
            className="font-display text-sm font-semibold text-umx-orange"
          >
            {addresses.length === 0 ? "Add address →" : "Manage →"}
          </Link>
        </div>

        {addresses.length === 0 ? (
          <div className="border border-dashed border-black/15 bg-white px-6 py-10 text-center shadow-[0_10px_28px_rgba(14,36,56,0.04)]">
            <p className="font-display text-base font-semibold text-black">
              No shipping address yet
            </p>
            <p className="mt-2 font-body text-sm text-black/65">
              Add one so you can place orders at checkout.
            </p>
            <Link
              href="/account/addresses"
              className="mt-4 inline-flex rounded-full bg-umx-orange px-5 py-2.5 font-display text-sm font-semibold text-white"
            >
              Add shipping address
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {addresses.map((a) => (
              <li
                key={a.id}
                className="border border-black/10 bg-white p-4 shadow-[0_8px_24px_rgba(14,36,56,0.04)]"
              >
                {a.isDefault ? (
                  <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-umx-orange uppercase">
                    Default
                  </p>
                ) : null}
                <p className="mt-1 font-display text-sm font-bold text-black">
                  {a.recipientName || a.label || "Shipping address"}
                </p>
                <div className="mt-2 space-y-0.5 font-body text-sm leading-relaxed text-black/75">
                  {a.phone ? <p>{a.phone}</p> : null}
                  <p>{a.line1}</p>
                  <p>
                    {a.city}
                    {a.region ? `, ${a.region}` : ""} {a.postalCode}
                  </p>
                  <p>{a.country}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-[10px] font-semibold tracking-[0.16em] text-umx-orange uppercase">
              Activity
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold text-black sm:text-2xl">
              Recent orders
            </h2>
            <p className="mt-1 font-body text-sm text-black">
              Status, payment, PI, and tracking — no product pictures
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/account/tracking"
              className="font-display text-sm font-semibold text-black transition hover:text-umx-orange"
            >
              Tracking
            </Link>
            <Link
              href="/account/orders"
              className="font-display text-sm font-semibold text-umx-orange"
            >
              View all →
            </Link>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="border border-dashed border-black/15 bg-white px-6 py-14 text-center shadow-[0_10px_28px_rgba(14,36,56,0.04)]">
            <Package className="mx-auto h-8 w-8 text-umx-orange" strokeWidth={1.75} />
            <p className="mt-4 font-display text-base font-semibold text-black">
              No orders yet
            </p>
            <Link
              href="/shop"
              className="mt-3 inline-block font-display text-sm font-semibold text-umx-orange"
            >
              Browse catalog →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentOrders.map((order) => {
              const shipment = order.shipments[0];
              const payment = order.payments[0];
              const paid =
                payment?.status === "paid" && Boolean(payment.paidAt);
              const hasSlip = Boolean(payment?.slipUrl);
              const tracking = shipment?.trackingNumber;
              const carrier = shipment?.carrier;

              return (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="group block overflow-hidden border border-black/10 bg-white shadow-[0_8px_24px_rgba(14,36,56,0.04)] transition hover:border-umx-orange hover:shadow-[0_12px_28px_rgba(27,79,114,0.1)]"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-base font-extrabold text-black sm:text-lg">
                            {order.orderNumber}
                          </p>
                          <span
                            className={`px-2.5 py-1 font-display text-[10px] font-bold tracking-wide uppercase ${buyerStatusClass(order.status, { paid, hasSlip })}`}
                          >
                            {buyerStatusLabel(order.status, { paid, hasSlip })}
                          </span>
                        </div>

                        <p className="mt-1.5 font-body text-sm text-black/75">
                          {order.createdAt.toISOString().slice(0, 10)}
                          <span className="mx-1.5 text-black/30">·</span>
                          {shortPayment(order.paymentMethod)}
                          {order.sellingQty > 0 ? (
                            <>
                              <span className="mx-1.5 text-black/30">·</span>
                              {formatPack(order.sellingQty)}
                            </>
                          ) : (
                            <>
                              <span className="mx-1.5 text-black/30">·</span>
                              {order._count.items} line
                              {order._count.items === 1 ? "" : "s"}
                            </>
                          )}
                          {order.testStationQty > 0 ? (
                            <>
                              <span className="mx-1.5 text-black/30">·</span>
                              {order.testStationQty} test station
                              {order.testStationQty === 1 ? "" : "s"}
                            </>
                          ) : null}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-sm">
                          {order.piNumber ? (
                            <p className="min-w-0">
                              <span className="font-display text-[10px] font-semibold tracking-[0.12em] text-black/45 uppercase">
                                PI
                              </span>{" "}
                              <span className="break-all font-display text-sm font-semibold text-[#1b4f72]">
                                {order.piNumber}
                              </span>
                            </p>
                          ) : null}
                          {tracking ? (
                            <p className="min-w-0">
                              <span className="font-display text-[10px] font-semibold tracking-[0.12em] text-black/45 uppercase">
                                Tracking
                              </span>{" "}
                              <span className="break-all font-mono text-sm font-semibold text-umx-orange">
                                {carrier ? `${carrier} · ` : ""}
                                {tracking}
                              </span>
                            </p>
                          ) : (
                            <p className="font-body text-sm text-black/45">
                              Tracking not assigned yet
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                        <div className="sm:text-right">
                          <p className="font-display text-[10px] font-semibold tracking-[0.12em] text-black uppercase">
                            Total
                          </p>
                          <p className="font-display text-xl font-extrabold tabular-nums text-umx-orange sm:text-2xl">
                            ${order.total.toFixed(2)}
                          </p>
                        </div>
                        <span className="font-display text-sm font-semibold text-umx-orange transition group-hover:translate-x-0.5">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
