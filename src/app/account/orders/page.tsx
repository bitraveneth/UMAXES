import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FileText, Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { paymentLabels } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import {
  OrdersPageHeader,
  OrdersStatCards,
} from "@/components/account/OrdersPageChrome";
import {
  buyerStatusClass,
  buyerStatusLabel,
} from "@/lib/buyer-order";

export const metadata = { title: "Orders · UMAXES" };

function shortPayment(method: keyof typeof paymentLabels) {
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
      return paymentLabels[method];
  }
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/orders");
  if (session.user.status === "PENDING") redirect("/account/pending");
  if (!session.user.companyId) redirect("/account");

  const orders = await prisma.order.findMany({
    where: { companyId: session.user.companyId },
    include: {
      items: {
        select: { id: true, name: true, image: true, quantity: true },
        take: 3,
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const openCount = orders.filter((o) =>
    [
      "SUBMITTED",
      "PAYMENT_PENDING",
      "CONFIRMED",
      "SENT_TO_SUPPLIER",
      "PICKING",
      "SHIPPED",
    ].includes(o.status),
  ).length;
  const pendingPay = orders.filter((o) => o.status === "PAYMENT_PENDING").length;
  const spend = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <OrdersPageHeader />

      {orders.length > 0 ? (
        <OrdersStatCards
          openCount={openCount}
          pendingPay={pendingPay}
          spend={spend}
        />
      ) : null}

      {orders.length === 0 ? (
        <div className="border border-black/10 bg-umx-cream-bright px-6 py-16 text-center">
          <Package className="mx-auto h-8 w-8 text-umx-orange" strokeWidth={1.75} />
          <p className="mt-4 font-display text-base font-semibold text-black">
            No orders yet
          </p>
          <p className="mx-auto mt-2 max-w-sm font-body text-sm text-black">
            When you place a wholesale order, it will show up here with totals
            and payment info.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 bg-umx-orange px-5 py-3 font-display text-sm font-semibold text-white"
          >
            Browse catalog
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const itemCount = order._count.items;
            const preview = order.items;
            const extra = Math.max(0, itemCount - preview.length);

            return (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="group block overflow-hidden border border-black/10 bg-white shadow-[0_8px_24px_rgba(61,22,5,0.04)] transition hover:border-umx-orange hover:shadow-[0_12px_28px_rgba(255,91,4,0.1)]"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Left: identity */}
                    <div className="flex items-start gap-3 border-b border-black/10 bg-umx-orange-wash/40 px-4 py-4 sm:w-52 sm:shrink-0 sm:border-r sm:border-b-0 sm:px-5 sm:py-5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-umx-orange text-white sm:h-11 sm:w-11">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.85} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-black uppercase">
                          Order
                        </p>
                        <p className="mt-0.5 truncate font-display text-base font-extrabold text-black sm:text-lg">
                          {order.orderNumber}
                        </p>
                        <p className="mt-1 font-body text-xs text-black">
                          {order.createdAt.toISOString().slice(0, 10)}
                        </p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex px-2.5 py-1 font-display text-[10px] font-bold tracking-wide uppercase ${buyerStatusClass(order.status)}`}
                        >
                          {buyerStatusLabel(order.status)}
                        </span>
                        <span className="font-display text-[10px] font-semibold tracking-wide text-black uppercase">
                          {shortPayment(order.paymentMethod)}
                        </span>
                        {order.piNumber ? (
                          <span className="font-display text-[10px] font-semibold text-umx-orange">
                            {order.piNumber}
                          </span>
                        ) : null}
                      </div>

                      {/* Product thumbs — visual, mobile friendly */}
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {preview.map((item) => (
                            <div
                              key={item.id}
                              className="relative h-12 w-12 overflow-hidden border-2 border-umx-cream-bright bg-umx-cream sm:h-14 sm:w-14"
                            >
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt=""
                                  fill
                                  className="object-contain p-1"
                                  sizes="56px"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center">
                                  <Package
                                    className="h-4 w-4 text-black"
                                    strokeWidth={1.75}
                                  />
                                </span>
                              )}
                            </div>
                          ))}
                          {extra > 0 ? (
                            <div className="flex h-12 w-12 items-center justify-center border-2 border-umx-cream-bright bg-black font-display text-xs font-bold text-white sm:h-14 sm:w-14">
                              +{extra}
                            </div>
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-semibold text-black">
                            {preview[0]?.name || "Order items"}
                            {itemCount > 1 ? ` +${itemCount - 1}` : ""}
                          </p>
                          <p className="mt-0.5 font-body text-xs text-black">
                            {itemCount} item{itemCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      {/* Total + CTA row */}
                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-black/8 pt-4">
                        <div>
                          <p className="font-display text-[10px] font-semibold tracking-[0.12em] text-black uppercase">
                            Total
                          </p>
                          <p className="mt-0.5 font-display text-2xl font-extrabold tabular-nums text-umx-orange sm:text-[1.75rem]">
                            ${order.total.toFixed(2)}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 font-display text-sm font-semibold text-umx-orange transition group-hover:gap-2">
                          View
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 font-body text-sm text-black">
        Need shipment updates?{" "}
        <Link
          href="/account/tracking"
          className="font-display font-semibold text-umx-orange"
        >
          Open Tracking →
        </Link>
      </p>
    </div>
  );
}
