export type BuyerLocale = "en" | "zh";

export const BUYER_LOCALE_KEY = "umaxes-buyer-locale";
export const BUYER_LOCALE_COOKIE = "umaxes_buyer_locale";

export type BuyerMessages = {
  nav: {
    portal: string;
    menu: string;
    account: string;
    overview: string;
    orders: string;
    documents: string;
    tracking: string;
    wishlist: string;
    shop: string;
    profile: string;
    addresses: string;
    returns: string;
    mediaKit: string;
    signOut: string;
    language: string;
    langEn: string;
    langZh: string;
    viewProfile: string;
  };
  common: {
    continueShopping: string;
    shopAgain: string;
    viewAll: string;
    open: string;
    total: string;
    view: string;
  };
  overview: {
    eyebrow: string;
    welcome: string;
    description: string;
    openOrders: string;
    openOrdersHint: string;
    paymentPending: string;
    paymentPendingHint: string;
    wishlist: string;
    wishlistHint: string;
    availableCredit: string;
    recentOrders: string;
    recentOrdersHint: string;
    activity: string;
    noOrders: string;
    browseCatalog: string;
  };
  orders: {
    eyebrow: string;
    title: string;
    description: string;
    open: string;
    openHint: string;
    awaitingPay: string;
    awaitingPayHint: string;
    spend: string;
    spendHint: string;
    needTracking: string;
    openTracking: string;
  };
  documents: {
    eyebrow: string;
    title: string;
    description: string;
  };
  tracking: {
    eyebrow: string;
    title: string;
    description: string;
    needOrders: string;
    openOrders: string;
  };
  profile: {
    eyebrow: string;
    title: string;
    description: string;
  };
  favorites: {
    eyebrow: string;
    title: string;
    description: string;
  };
  assets: {
    eyebrow: string;
    title: string;
    description: string;
  };
  addresses: {
    eyebrow: string;
    title: string;
    description: string;
  };
  returns: {
    eyebrow: string;
    title: string;
    description: string;
  };
};

export function getMessage(
  dict: BuyerMessages,
  path: string,
  values?: Record<string, string | number>,
): string {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  if (typeof cur !== "string") return path;
  if (!values) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, key: string) =>
    values[key] != null ? String(values[key]) : `{${key}}`,
  );
}
