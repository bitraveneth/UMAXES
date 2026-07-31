"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useBuyerI18n } from "@/components/account/BuyerI18n";

export function ContinueShoppingButton({
  href = "/shop",
  variant = "solid",
}: {
  href?: string;
  variant?: "solid" | "outline";
}) {
  const { t } = useBuyerI18n();
  const label =
    variant === "outline" ? t("common.shopAgain") : t("common.continueShopping");

  if (variant === "outline") {
    return (
      <Link
        href={href}
        className="border border-black/15 bg-umx-cream-bright px-5 py-3 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 bg-umx-orange px-5 py-3 font-display text-sm font-semibold text-white transition hover:bg-umx-orange-deep"
    >
      <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
