"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  FileText,
  Package,
  Truck,
} from "lucide-react";
import {
  buyerDocAvailability,
  buyerStatusClass,
  buyerStatusLabel,
  type BuyerDocType,
} from "@/lib/buyer-order";
import BuyerPaymentSlip from "@/components/account/BuyerPaymentSlip";
import DocumentDownloadMenu from "@/components/account/DocumentDownloadMenu";
import PiNumberBlock from "@/components/account/PiNumberBlock";
import OrderProgressBar from "@/components/account/OrderProgressBar";
import type { OrderStatus } from "@/generated/prisma/enums";

type OrderLine = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  image: string | null;
};

type ShipmentInfo = {
  id: string;
  carrier: string | null;
  trackingNumber: string | null;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  packedAt: string | null;
  trackingStatus: string | null;
};

const DOCS: {
  type: BuyerDocType;
  label: string;
  description: string;
  icon: typeof FileText;
}[] = [
  {
    type: "pi",
    label: "Proforma invoice",
    description: "Quote / PI for payment",
    icon: FileText,
  },
  {
    type: "packing",
    label: "Packing list",
    description: "What ships in the boxes",
    icon: Package,
  },
];

export default function BuyerOrderDetail({
  order,
  paymentLabel,
  companyLevel,
  initialTab = "documents",
}: {
  order: {
    id: string;
    orderNumber: string;
    piNumber: string | null;
    status: OrderStatus;
    total: number;
    subtotal: number;
    discount: number;
    shipping: number;
    createdAt: string;
    items: OrderLine[];
    shipments: ShipmentInfo[];
    paymentStatus: string | null;
    paymentPaid: boolean;
    hasPaymentSlip: boolean;
    paymentSlipMime: string | null;
    paymentSlipName: string | null;
    paymentRef: string | null;
  };
  paymentLabel: string;
  companyLevel?: string | null;
  initialTab?: "documents" | "tracking";
}) {
  const [tab, setTab] = useState<"documents" | "tracking">(initialTab);
  const hasShipment = order.shipments.length > 0;
  const docs = buyerDocAvailability(order.status, hasShipment);
  const isCreditBuyer =
    companyLevel === "WHOLESALER" || companyLevel === "DISTRO";
  const primaryShipment = order.shipments[0] ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="border-b border-black/8 pb-8">
        <Link
          href="/account/orders"
          className="font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
        >
          ← All orders
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-black sm:text-[2.5rem]">
                {order.orderNumber}
              </h1>
              <span
                className={`inline-flex px-2.5 py-1 font-display text-[10px] font-semibold tracking-wide uppercase ${buyerStatusClass(order.status, { paid: order.paymentPaid, hasSlip: order.hasPaymentSlip })}`}
              >
                {buyerStatusLabel(order.status, {
                  paid: order.paymentPaid,
                  hasSlip: order.hasPaymentSlip,
                })}
              </span>
            </div>
            <p className="mt-2 font-body text-sm text-black">
              {order.createdAt.slice(0, 10)}
              <span className="mx-2 text-black">·</span>
              {paymentLabel}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="font-display text-[11px] font-semibold tracking-[0.14em] text-black uppercase">
              Total
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold tabular-nums tracking-tight text-umx-orange">
              ${order.total.toFixed(2)}
            </p>
          </div>
        </div>
      </header>

      {order.piNumber ? (
        <PiNumberBlock value={order.piNumber} orderNumber={order.orderNumber} />
      ) : null}

      {order.status !== "CANCELLED" ? (
        <BuyerPaymentSlip
          orderId={order.id}
          paid={order.paymentPaid}
          hasSlip={order.hasPaymentSlip}
          slipMime={order.paymentSlipMime}
          fileName={order.paymentSlipName}
          paymentRef={order.paymentRef}
        />
      ) : null}

      {isCreditBuyer && order.status === "PAYMENT_PENDING" && !order.hasPaymentSlip ? (
        <div className="border border-umx-orange/25 bg-umx-orange-wash/60 px-5 py-4 font-body text-sm text-black">
          <span className="font-display font-semibold text-umx-orange">
            Payment pending.
          </span>{" "}
          Download the proforma under Documents, send the TT, then upload the
          bank slip above.
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-black/8">
        {(
          [
            ["documents", "Documents"],
            ["tracking", "Tracking"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative pb-3 font-display text-sm font-semibold transition ${
              tab === id ? "text-umx-orange" : "text-black"
            }`}
          >
            {label}
            {tab === id ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-umx-orange" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "documents" ? (
        <section className="space-y-5">
          <p className="font-body text-sm text-black">
            Open a document to view it, or download PDF / Excel.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {DOCS.map((doc) => {
              const state = docs[doc.type];
              const Icon = doc.icon;
              if (!state.ready) {
                return (
                  <li
                    key={doc.type}
                    className="border border-dashed border-black/12 bg-white p-5"
                  >
                    <Icon className="h-5 w-5 text-black" strokeWidth={1.75} />
                    <p className="mt-4 font-display text-sm font-bold text-black">
                      {doc.label}
                    </p>
                    <p className="mt-1 font-body text-xs text-black">
                      {state.hint}
                    </p>
                  </li>
                );
              }
              return (
                <li key={doc.type}>
                  <div className="flex h-full flex-col border border-black/10 bg-white p-5">
                    <Icon
                      className="h-5 w-5 text-umx-orange"
                      strokeWidth={1.75}
                    />
                    <p className="mt-4 font-display text-sm font-bold text-black">
                      {doc.label}
                    </p>
                    <p className="mt-1 font-body text-xs text-black/55">
                      Download as PDF or Excel
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                      <DocumentDownloadMenu
                        orderId={order.id}
                        type={doc.type}
                        compact
                      />
                      <a
                        href={`/api/orders/${order.id}/docs?type=${doc.type}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-transparent px-2 py-1.5 font-display text-xs font-semibold text-umx-orange transition hover:border-umx-orange/25 hover:bg-umx-orange-wash/50"
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="space-y-8">
          {order.status === "CANCELLED" ? (
            <p className="border border-red-200 bg-red-50 px-5 py-4 font-body text-sm text-red-800">
              This order was cancelled. Tracking is not available.
            </p>
          ) : (
            <div className="border border-black/10 bg-umx-cream-bright p-5 sm:p-6">
              <OrderProgressBar status={order.status} variant="full" />
            </div>
          )}

          {primaryShipment ? (
            <div className="border border-black/10 bg-white p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-umx-orange-wash text-umx-orange">
                  <Truck className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-black">
                    Shipment
                  </p>
                  <p className="mt-1 font-body text-sm text-black">
                    {primaryShipment.carrier || "Carrier TBD"}
                    {primaryShipment.status
                      ? ` · ${primaryShipment.status}`
                      : ""}
                  </p>
                  {primaryShipment.trackingNumber ? (
                    <div className="mt-3">
                      <p className="font-display text-[10px] font-semibold tracking-[0.12em] text-black uppercase">
                        Tracking number
                      </p>
                      <p className="mt-1 break-all font-mono text-base font-semibold tracking-wide text-umx-orange">
                        {primaryShipment.trackingNumber}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 font-body text-sm text-black">
                      Tracking number will appear when handed to the carrier.
                    </p>
                  )}
                  {primaryShipment.trackingStatus ? (
                    <p className="mt-2 font-body text-sm text-black">
                      Latest:{" "}
                      <span className="font-display font-semibold text-black">
                        {primaryShipment.trackingStatus}
                      </span>
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-black">
                    {primaryShipment.packedAt ? (
                      <span>Packed {primaryShipment.packedAt.slice(0, 10)}</span>
                    ) : null}
                    {primaryShipment.shippedAt ? (
                      <span>
                        Shipped {primaryShipment.shippedAt.slice(0, 10)}
                      </span>
                    ) : null}
                    {primaryShipment.deliveredAt ? (
                      <span>
                        Delivered {primaryShipment.deliveredAt.slice(0, 10)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : order.status !== "CANCELLED" ? (
            <div className="border border-dashed border-black/15 bg-white px-5 py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center bg-umx-orange-wash text-umx-orange">
                <Truck className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="mt-4 font-display text-sm font-bold text-black">
                No shipment yet
              </p>
              <p className="mx-auto mt-1.5 max-w-sm font-body text-sm text-black">
                Tracking details show here once logistics creates a packing
                record.
              </p>
            </div>
          ) : null}
        </section>
      )}

      {/* Line items */}
      <section className="overflow-hidden border border-black/10 bg-white">
        <div className="border-b border-black/8 px-5 py-4 sm:px-6">
          <h2 className="font-display text-base font-bold text-black">
            Line items
          </h2>
        </div>

        <div
          className="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem_6.5rem] items-center gap-x-3 border-b border-black/8 px-5 py-2.5 sm:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_7rem] sm:gap-x-5 sm:px-6"
          role="row"
        >
          <span className="text-center font-display text-[10px] font-semibold tracking-[0.12em] text-black/45 uppercase">
            #
          </span>
          <span className="font-display text-[10px] font-semibold tracking-[0.12em] text-black/45 uppercase">
            Item
          </span>
          <span className="text-right font-display text-[10px] font-semibold tracking-[0.12em] text-black/45 uppercase">
            Qty
          </span>
          <span className="text-right font-display text-[10px] font-semibold tracking-[0.12em] text-black/45 uppercase">
            Price
          </span>
        </div>

        <ul className="divide-y divide-black/6">
          {order.items.map((line, index) => (
            <li
              key={line.id}
              className="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem_6.5rem] items-center gap-x-3 px-5 py-3.5 sm:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_7rem] sm:gap-x-5 sm:px-6"
            >
              <span className="text-center font-display text-sm font-semibold tabular-nums text-black/45">
                {index + 1}
              </span>
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-umx-cream sm:h-14 sm:w-14">
                  {line.image ? (
                    <Image
                      src={line.image}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="56px"
                    />
                  ) : null}
                </div>
                <p className="min-w-0 truncate font-display text-sm font-semibold text-black">
                  {line.name}
                </p>
              </div>
              <p className="text-right font-display text-sm font-semibold tabular-nums text-black">
                {line.quantity}
              </p>
              <div className="text-right">
                <p className="font-display text-sm font-bold tabular-nums text-black">
                  ${(line.unitPrice * line.quantity).toFixed(2)}
                </p>
                <p className="mt-0.5 font-body text-xs tabular-nums text-black/45">
                  ${line.unitPrice.toFixed(2)}/pc
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-black/8 bg-[#f7f9fb] px-5 py-4 font-body text-sm sm:px-6">
          <div className="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem_6.5rem] items-baseline gap-x-3 sm:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_7rem] sm:gap-x-5">
            <span aria-hidden />
            <span className="text-black/55">Subtotal</span>
            <span aria-hidden />
            <span className="text-right tabular-nums text-black">
              ${order.subtotal.toFixed(2)}
            </span>
          </div>
          {order.discount > 0 ? (
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem_6.5rem] items-baseline gap-x-3 sm:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_7rem] sm:gap-x-5">
              <span aria-hidden />
              <span className="text-black/55">Discount</span>
              <span aria-hidden />
              <span className="text-right tabular-nums text-black">
                −${order.discount.toFixed(2)}
              </span>
            </div>
          ) : null}
          {order.shipping > 0 ? (
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem_6.5rem] items-baseline gap-x-3 sm:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_7rem] sm:gap-x-5">
              <span aria-hidden />
              <span className="text-black/55">Shipping</span>
              <span aria-hidden />
              <span className="text-right tabular-nums text-black">
                ${order.shipping.toFixed(2)}
              </span>
            </div>
          ) : null}
          <div className="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem_6.5rem] items-baseline gap-x-3 border-t border-black/8 pt-3 font-display text-base font-bold sm:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_7rem] sm:gap-x-5">
            <span aria-hidden />
            <span className="text-black">Total</span>
            <span className="text-right tabular-nums text-black">
              {order.items.reduce((s, l) => s + l.quantity, 0)} pcs
            </span>
            <span className="text-right tabular-nums text-umx-orange">
              ${order.total.toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      <p className="flex items-center gap-2 font-body text-xs text-black">
        <Download className="h-3.5 w-3.5" />
        Documents open in a new tab — use print / download from there.
      </p>
    </div>
  );
}
