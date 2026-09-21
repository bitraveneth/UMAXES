"use client";

import { useSession } from "next-auth/react";
import { canSeeStorePrices } from "@/lib/store-pricing";
import { useCatalogPrices } from "@/context/CatalogPricesContext";

function formatUsd(amount: number, suffix = "") {
  return Number.isInteger(amount) && suffix === ".00"
    ? `$${amount}${suffix}`
    : `$${amount.toFixed(2)}${suffix}`;
}

function pricesDiffer(amount: number, retailAmount: number) {
  return Number.isFinite(retailAmount) && Math.abs(retailAmount - amount) > 0.009;
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
 * Account rate (large) with labeled retail compare underneath.
 * Totals must pass the account amount; retail is display-only.
 */
export function DualStorePrice({
  amount,
  retailAmount,
  className = "",
  retailClassName = "mt-0.5 block font-body text-sm font-medium text-black/45",
  suffix = "",
  compact = false,
}: {
  amount: number;
  retailAmount: number;
  className?: string;
  retailClassName?: string;
  suffix?: string;
  compact?: boolean;
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

  const label = compact ? "Retail" : "Retail price";

  return (
    <span className="block">
      <span className={className}>{formatUsd(amount, suffix)}</span>
      {pricesDiffer(amount, retailAmount) ? (
        <span className={retailClassName}>
          {label} {formatUsd(retailAmount)}
        </span>
      ) : null}
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
