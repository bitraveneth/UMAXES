import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, ExternalLink, FileText, Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AccountHeaderI18n from "@/components/account/AccountHeaderI18n";
import {
  buyerDocAvailability,
  buyerStatusClass,
  buyerStatusLabel,
  type BuyerDocType,
} from "@/lib/buyer-order";

export const metadata = { title: "Documents · UMAXES" };

const DOC_META: {
  type: BuyerDocType;
  label: string;
  short: string;
  icon: typeof FileText;
}[] = [
  { type: "pi", label: "Proforma", short: "PI", icon: FileText },
  { type: "invoice", label: "Invoice", short: "CI", icon: FileText },
  { type: "packing", label: "Packing list", short: "PL", icon: Package },
];

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/documents");
  if (session.user.status === "PENDING") redirect("/account/pending");
  if (!session.user.companyId) redirect("/account");

  const orders = await prisma.order.findMany({
    where: { companyId: session.user.companyId },
    include: {
      shipments: { select: { id: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <AccountHeaderI18n
        eyebrowKey="documents.eyebrow"
        titleKey="documents.title"
        descriptionKey="documents.description"
      />

      {orders.length === 0 ? (
        <div className="border border-black/10 bg-white px-6 py-16 text-center shadow-[0_8px_20px_rgba(61,22,5,0.04)]">
          <p className="font-display text-base font-semibold text-black">
            No documents yet
          </p>
          <Link
            href="/shop"
            className="mt-3 inline-block font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
          >
            Place an order →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const docs = buyerDocAvailability(
              order.status,
              order.shipments.length > 0,
            );
            const readyCount = DOC_META.filter((d) => docs[d.type].ready).length;

            return (
              <li
                key={order.id}
                className="group/card overflow-hidden border border-black/10 bg-white shadow-[0_8px_20px_rgba(61,22,5,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-umx-orange/50 hover:shadow-[0_14px_32px_rgba(255,91,4,0.12)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/8 px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/account/orders/${order.id}?tab=documents`}
                        className="font-display text-lg font-extrabold text-black transition hover:text-umx-orange"
                      >
                        {order.orderNumber}
                      </Link>
                      <span
                        className={`px-2.5 py-1 font-display text-[10px] font-bold tracking-wide uppercase ${buyerStatusClass(order.status)}`}
                      >
                        {buyerStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="mt-1 font-body text-sm text-black">
                      {order.createdAt.toISOString().slice(0, 10)}
                      <span className="mx-2">·</span>
                      {readyCount} of {DOC_META.length} ready
                      {order.piNumber ? (
                        <>
                          <span className="mx-2">·</span>
                          <span className="font-display font-semibold text-umx-orange">
                            {order.piNumber}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <Link
                    href={`/account/orders/${order.id}?tab=documents`}
                    className="font-display text-sm font-semibold text-umx-orange transition hover:gap-2 hover:text-umx-orange-deep"
                  >
                    Order detail →
                  </Link>
                </div>

                <ul className="grid gap-0 sm:grid-cols-3">
                  {DOC_META.map((doc, i) => {
                    const state = docs[doc.type];
                    const Icon = doc.icon;
                    const border =
                      i < DOC_META.length - 1
                        ? "border-b sm:border-b-0 sm:border-r border-black/8"
                        : "";

                    if (!state.ready) {
                      return (
                        <li
                          key={doc.type}
                          className={`flex items-start gap-3 bg-black/[0.015] px-5 py-4 opacity-55 sm:px-5 ${border}`}
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-black/10 bg-white">
                            <Icon
                              className="h-3.5 w-3.5 text-black"
                              strokeWidth={1.75}
                            />
                          </span>
                          <div>
                            <p className="font-display text-sm font-bold text-black">
                              {doc.label}
                            </p>
                            <p className="mt-0.5 font-body text-xs text-black">
                              {state.hint}
                            </p>
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li key={doc.type} className={border}>
                        <a
                          href={`/api/orders/${order.id}/docs?type=${doc.type}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/doc flex h-full items-start gap-3 px-5 py-4 transition duration-200 hover:bg-umx-orange-wash/70 sm:px-5"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-umx-orange-wash text-umx-orange transition duration-200 group-hover/doc:scale-105 group-hover/doc:bg-umx-orange group-hover/doc:text-white">
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.85} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-sm font-bold text-black transition group-hover/doc:text-umx-orange">
                              {doc.label}
                            </p>
                            <p className="mt-0.5 font-body text-xs text-black">
                              Ready to open
                            </p>
                            <span className="mt-2 inline-flex items-center gap-1 font-display text-xs font-semibold text-umx-orange transition duration-200 group-hover/doc:gap-1.5">
                              <Download className="h-3 w-3" strokeWidth={2} />
                              Open
                              <ExternalLink
                                className="h-3 w-3 transition group-hover/doc:translate-x-0.5"
                                strokeWidth={2}
                              />
                            </span>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
