import type { CustomerLevel } from "@/generated/prisma/enums";

export type CustomerSegment = {
  level: CustomerLevel;
  path: string;
  titleKey: string;
  descriptionKey: string;
  navLabel: string;
};

export const CUSTOMER_SEGMENTS: Record<
  "DISTRO" | "WHOLESALER" | "SHOP",
  CustomerSegment
> = {
  DISTRO: {
    level: "DISTRO",
    path: "/admin/distributors",
    titleKey: "customers.distroTitle",
    descriptionKey: "customers.distroDescription",
    navLabel: "Distributors",
  },
  WHOLESALER: {
    level: "WHOLESALER",
    path: "/admin/wholesalers",
    titleKey: "customers.wholesalerTitle",
    descriptionKey: "customers.wholesalerDescription",
    navLabel: "Wholesalers",
  },
  SHOP: {
    level: "SHOP",
    path: "/admin/retail",
    titleKey: "customers.retailTitle",
    descriptionKey: "customers.retailDescription",
    navLabel: "Retail",
  },
};

export const creditDefaultsByLevel: Record<
  CustomerLevel,
  { creditLimit: number; paymentTermsDays: number }
> = {
  DISTRO: { creditLimit: 20000, paymentTermsDays: 30 },
  WHOLESALER: { creditLimit: 8000, paymentTermsDays: 15 },
  /** Retail pays up-front — no trade credit. */
  SHOP: { creditLimit: 0, paymentTermsDays: 0 },
};
