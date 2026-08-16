"use client";

import { useSession } from "next-auth/react";
import { canSeeStorePrices } from "@/lib/store-pricing";

/** Hides retail/public prices. Data is unchanged — display only. */
export function StorePrice({
  amount,
  className = "",
  suffix = "",
}: {
  amount: number;
  className?: string;
  suffix?: string;
}) {
  const { data: session, status } = useSession();
  const show =
    status === "authenticated" &&
    canSeeStorePrices({
      role: session?.user?.role,
      companyLevel: session?.user?.companyLevel,
      status: session?.user?.status,
    });

  if (!show) {
    return (
      <span className={className}>
        On request
      </span>
    );
  }

  const formatted =
    Number.isInteger(amount) && suffix === ".00"
      ? `$${amount}${suffix}`
      : `$${amount.toFixed(2)}${suffix}`;

  return <span className={className}>{formatted}</span>;
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
