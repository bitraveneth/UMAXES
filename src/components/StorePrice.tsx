"use client";

import { useSession } from "next-auth/react";
import { product } from "@/lib/assets";
import { canSeeStorePrices } from "@/lib/store-pricing";
import { useCatalogPrices } from "@/context/CatalogPricesContext";

/** Static list price shown once under the account rate. Not used for totals. */
export const RETAIL_LIST_PRICE = product.price;

function formatUsd(amount: number, suffix = "") {
  return Number.isInteger(amount) && suffix === ".00"
    ? `$${amount}${suffix}`
    : `$${amount.toFixed(2)}${suffix}`;
}

/** Hides guest prices. Data is unchanged — display only. */
export function StorePrice({
  amount,
  className = "",
  suffix = "",
}: {
  amount: number;
  className?: string;
  suffix?: string;
}) {
  const show = useShowStorePrices();
  const { status } = useSession();
  const { ready } = useCatalogPrices();

  if (status === "authenticated" && !ready) {
    return <span className={className}>…</span>;
  }

  if (!show) {
    return <span className={className}>On request</span>;
  }

  return <span className={className}>{formatUsd(amount, suffix)}</span>;
}

/**
 * Hero price: account rate + retail pill on the same row.
 * Same block for wholesale, distro, shop, and staff storefront.
 */
export function DualStorePrice({
  amount,
  className = "",
}: {
  amount: number;
  className?: string;
}) {
  const show = useShowStorePrices();
  const { data: session, status } = useSession();
  const { ready, accountLevel } = useCatalogPrices();
  const level = accountLevel || session?.user?.companyLevel || null;
  const accountLabel =
    level === "DISTRO"
      ? "Distributor"
      : level === "WHOLESALER"
        ? "Wholesale"
        : null;

  if (status === "authenticated" && !ready) {
    return <span className={className}>…</span>;
  }

  if (!show) {
    return <span className={className}>On request</span>;
  }

  return (
    <span className="flex flex-wrap items-end gap-x-3 gap-y-2">
      <span className="flex min-w-0 flex-col">
        {accountLabel ? (
          <span className="mb-0.5 font-display text-[0.62rem] font-bold tracking-[0.16em] text-black/40 uppercase">
            {accountLabel}
          </span>
        ) : null}
        <span className={className}>{formatUsd(amount)}</span>
      </span>
      <span className="mb-0.5 inline-flex items-center gap-2 rounded-full bg-[#eef3f7] py-1 pr-3 pl-2.5 ring-1 ring-[#1b4f72]/12">
        <span className="rounded-full bg-[#1b4f72] px-2 py-0.5 font-display text-[0.62rem] font-bold tracking-[0.14em] text-white uppercase">
          Retail
        </span>
        <span className="font-display text-sm font-semibold tabular-nums tracking-tight text-black/70">
          {formatUsd(RETAIL_LIST_PRICE)}
        </span>
        <span className="font-body text-xs text-black/45">per piece</span>
      </span>
    </span>
  );
}

export function useShowStorePrices() {
  const { data: session, status } = useSession();
  if (status !== "authenticated") return false;
  return canSeeStorePrices({
    role: session?.user?.role,
    companyLevel: session?.user?.companyLevel,
    status: session?.user?.status,
  });
}
