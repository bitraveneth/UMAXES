import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Truck, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  AccountStat,
  AccountStatGrid,
} from "@/components/account/AccountUI";
import AccountHeaderI18n from "@/components/account/AccountHeaderI18n";
import OrderProgressBar from "@/components/account/OrderProgressBar";
import CopyTrackingButton from "@/components/account/CopyTrackingButton";
import {
  BUYER_ORDER_STEPS,
  buyerTimelineIndex,
  buyerTrackingLane,
  buyerTrackingLaneLabel,
  type TrackingLane,
} from "@/lib/buyer-order";

export const metadata = { title: "Tracking · UMAXES" };

const LANE_ORDER: TrackingLane[] = ["moving", "preparing", "delivered"];

export default async function TrackingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/tracking");
  if (session.user.status === "PENDING") redirect("/account/pending");
  if (!session.user.companyId) redirect("/account");

  const orders = await prisma.order.findMany({
    where: {
      companyId: session.user.companyId,
      status: { not: "CANCELLED" },
    },
    include: {
      shipments: {
        select: {
          trackingNumber: true,
          carrier: true,
          status: true,
          trackingStatus: true,
          shippedAt: true,
          deliveredAt: true,
          packedAt: true,
        },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const grouped: Record<TrackingLane, typeof orders> = {
    moving: [],
    preparing: [],
    delivered: [],
  };
  for (const order of orders) {
    grouped[buyerTrackingLane(order.status)].push(order);
  }

  const movingCount = grouped.moving.length;
  const preparingCount = grouped.preparing.length;

  return (
    <div>
      <AccountHeaderI18n
        eyebrowKey="tracking.eyebrow"
        titleKey="tracking.title"
        descriptionKey="tracking.description"
      />

      <div className="mb-8">
        <AccountStatGrid cols={3}>
          <AccountStat
            label="On the way"
            value={movingCount}
            hint="Picking or shipped"
            icon={Truck}
            tone="orange"
          />
          <AccountStat
            label="Preparing"
            value={preparingCount}
            hint="Submitted to packing"
            icon={Package}
            tone="cream"
          />
          <AccountStat
            label="Delivered"
            value={grouped.delivered.length}
            hint="Completed orders"
            icon={CheckCircle2}
            tone="cream"
          />
        </AccountStatGrid>
      </div>

      {orders.length === 0 ? (
        <div className="border border-black/10 bg-umx-cream-bright px-6 py-16 text-center">
          <Truck className="mx-auto h-8 w-8 text-umx-orange" strokeWidth={1.75} />
          <p className="mt-4 font-display text-base font-semibold text-black">
            Nothing to track yet
          </p>
          <Link
            href="/shop"
            className="mt-3 inline-block font-display text-sm font-semibold text-umx-orange"
          >
            Place an order →
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {LANE_ORDER.map((lane) => {
            const rows = grouped[lane];
            if (rows.length === 0) return null;
            return (
              <section key={lane}>
                <div className="mb-4 flex items-end justify-between gap-3 border-b border-black/10 pb-3">
                  <div>
                    <p className="font-display text-[10px] font-semibold tracking-[0.16em] text-umx-orange uppercase">
                      {lane === "moving"
                        ? "01"
                        : lane === "preparing"
                          ? "02"
                          : "03"}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-extrabold text-black">
                      {buyerTrackingLaneLabel(lane)}
                    </h2>
                  </div>
                  <p className="font-display text-sm font-semibold tabular-nums text-black">
                    {rows.length}
                  </p>
                </div>

                <ul className="space-y-4">
                  {rows.map((order) => {
                    const shipment = order.shipments[0];
                    const tracking = shipment?.trackingNumber;
                    const step =
                      BUYER_ORDER_STEPS[
                        Math.max(0, buyerTimelineIndex(order.status))
                      ];

                    return (
                      <li key={order.id}>
                        <article className="overflow-hidden border border-black/10 bg-white shadow-[0_8px_24px_rgba(61,22,5,0.04)]">
                          <div className="flex flex-col lg:flex-row">
                            {/* Status rail */}
                            <div className="flex items-start gap-4 border-b border-black/10 bg-umx-orange-wash/50 px-5 py-5 lg:w-56 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-6">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-umx-orange text-white">
                                {lane === "preparing" ? (
                                  <Package className="h-5 w-5" strokeWidth={1.85} />
                                ) : (
                                  <Truck className="h-5 w-5" strokeWidth={1.85} />
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-black uppercase">
                                  Now
                                </p>
                                <p className="mt-0.5 font-display text-lg font-extrabold text-umx-orange">
                                  {step.label}
                                </p>
                                <p className="mt-1 font-body text-xs text-black">
                                  {order.orderNumber}
                                </p>
                              </div>
                            </div>

                            {/* Shipment body */}
                            <div className="min-w-0 flex-1 px-5 py-5 sm:px-6">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-black uppercase">
                                    Carrier
                                  </p>
                                  <p className="mt-0.5 font-display text-base font-bold text-black">
                                    {shipment?.carrier || "Carrier TBD"}
                                  </p>
                                  {shipment?.trackingStatus ? (
                                    <p className="mt-1 font-body text-sm text-black">
                                      Latest:{" "}
                                      <span className="font-display font-semibold">
                                        {shipment.trackingStatus}
                                      </span>
                                    </p>
                                  ) : null}
                                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-black">
                                    {shipment?.packedAt ? (
                                      <span>
                                        Packed{" "}
                                        {shipment.packedAt
                                          .toISOString()
                                          .slice(0, 10)}
                                      </span>
                                    ) : null}
                                    {shipment?.shippedAt ? (
                                      <span>
                                        Shipped{" "}
                                        {shipment.shippedAt
                                          .toISOString()
                                          .slice(0, 10)}
                                      </span>
                                    ) : null}
                                    {shipment?.deliveredAt ? (
                                      <span>
                                        Delivered{" "}
                                        {shipment.deliveredAt
                                          .toISOString()
                                          .slice(0, 10)}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <Link
                                  href={`/account/orders/${order.id}?tab=tracking`}
                                  className="font-display text-sm font-semibold text-umx-orange"
                                >
                                  Details →
                                </Link>
                              </div>

                              {tracking ? (
                                <div className="mt-4 flex flex-wrap items-center gap-3 border border-black/10 bg-white px-4 py-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-display text-[10px] font-semibold tracking-[0.12em] text-black uppercase">
                                      Tracking number
                                    </p>
                                    <p className="mt-0.5 break-all font-mono text-sm font-semibold tracking-wide text-umx-orange sm:text-base">
                                      {tracking}
                                    </p>
                                  </div>
                                  <CopyTrackingButton value={tracking} />
                                </div>
                              ) : (
                                <p className="mt-4 border border-dashed border-black/15 bg-white px-4 py-3 font-body text-sm text-black">
                                  {shipment
                                    ? "Packed — waiting for carrier tracking number."
                                    : "Not handed to logistics yet. Progress updates as the order moves."}
                                </p>
                              )}

                              <div className="mt-5 border-t border-black/8 pt-4">
                                <OrderProgressBar status={order.status} />
                              </div>
                            </div>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-8 font-body text-sm text-black">
        Looking for totals or invoices?{" "}
        <Link
          href="/account/orders"
          className="font-display font-semibold text-umx-orange"
        >
          Open Orders →
        </Link>
      </p>
    </div>
  );
}
