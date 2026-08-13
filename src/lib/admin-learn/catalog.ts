export type LearnSlug =
  | "overview"
  | "approvals"
  | "customers"
  | "catalog"
  | "coupons"
  | "orders"
  | "suppliers"
  | "packing"
  | "credit"
  | "rma"
  | "commissions"
  | "reports"
  | "activity"
  | "staff-system";

export type LearnMeta = {
  slug: LearnSlug;
  relatedHref: string | null;
  /** Super-admin-only modules */
  saOnly?: boolean;
};

/** Ordered tutorials for the Learning Hub. */
export const LEARN_CATALOG: LearnMeta[] = [
  { slug: "overview", relatedHref: "/admin" },
  { slug: "approvals", relatedHref: "/admin/approvals" },
  { slug: "customers", relatedHref: "/admin/distributors" },
  { slug: "catalog", relatedHref: "/admin/catalog" },
  { slug: "coupons", relatedHref: "/admin/coupons" },
  { slug: "orders", relatedHref: "/admin/orders" },
  { slug: "suppliers", relatedHref: "/admin/suppliers" },
  { slug: "packing", relatedHref: "/admin/logistics" },
  { slug: "credit", relatedHref: "/admin/credit" },
  { slug: "rma", relatedHref: "/admin/rma" },
  { slug: "commissions", relatedHref: "/admin/commissions" },
  { slug: "reports", relatedHref: "/admin/reports" },
  { slug: "activity", relatedHref: "/admin/activity" },
  { slug: "staff-system", relatedHref: "/admin/system", saOnly: true },
];

export function isLearnSlug(value: string): value is LearnSlug {
  return LEARN_CATALOG.some((item) => item.slug === value);
}

export function learnIndex(slug: LearnSlug) {
  return LEARN_CATALOG.findIndex((item) => item.slug === slug);
}
