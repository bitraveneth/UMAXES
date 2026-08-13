import type { BuyerMessages } from "./types";

const en: BuyerMessages = {
  nav: {
    portal: "Buyer portal",
    menu: "Menu",
    account: "Account",
    overview: "Overview",
    orders: "Orders",
    documents: "Documents",
    tracking: "Tracking",
    wishlist: "Wishlist",
    shop: "Shop",
    profile: "Profile",
    addresses: "Shipping address",
    returns: "Returns",
    mediaKit: "Media kit",
    signOut: "Sign out",
    language: "Language",
    langEn: "English",
    langZh: "中文",
    viewProfile: "View profile",
  },
  common: {
    continueShopping: "Continue shopping",
    shopAgain: "Shop again",
    viewAll: "View all",
    open: "Open",
    total: "Total",
    view: "View",
  },
  overview: {
    eyebrow: "Buyer portal",
    welcome: "Welcome",
    description: "{company} · place orders, track shipments, and view invoices.",
    openOrders: "Open orders",
    openOrdersHint: "In progress",
    paymentPending: "Payment pending",
    paymentPendingHint: "Awaiting TT / check",
    wishlist: "Wishlist",
    wishlistHint: "Saved SKUs",
    availableCredit: "Credit",
    recentOrders: "Recent orders",
    recentOrdersHint: "Totals, payment, and status at a glance",
    activity: "Activity",
    noOrders: "No orders yet",
    browseCatalog: "Browse catalog",
  },
  orders: {
    eyebrow: "Purchases",
    title: "Orders",
    description:
      "Your purchase history — open any order for line items, documents, and payment details.",
    open: "Open",
    openHint: "Orders in progress",
    awaitingPay: "Awaiting pay",
    awaitingPayHint: "TT / check pending",
    spend: "Spend",
    spendHint: "All non-cancelled orders",
    needTracking: "Need shipment updates?",
    openTracking: "Open Tracking",
  },
  documents: {
    eyebrow: "Paperwork",
    title: "Documents",
    description:
      "Proformas, invoices, and packing lists across your orders. Open any ready file to view or download.",
  },
  tracking: {
    eyebrow: "Shipments",
    title: "Tracking",
    description:
      "Where each order is in fulfillment — carrier, tracking number, and next step. Prices live under Orders.",
    needOrders: "Looking for totals or invoices?",
    openOrders: "Open Orders",
  },
  profile: {
    eyebrow: "Your account",
    title: "Profile",
    description:
      "Photo, contact details, and company info for your buyer portal.",
  },
  favorites: {
    eyebrow: "Saved",
    title: "Wishlist",
    description:
      "Flavors you heart on the shop show up here — ready to reorder into your cart.",
  },
  assets: {
    eyebrow: "Dealer kit",
    title: "Media kit",
    description:
      "Download UMAXES logos, brand colors, and POS imagery for approved dealers.",
  },
  addresses: {
    eyebrow: "Shipping",
    title: "Shipping address",
    description: "Save delivery locations for checkout — up to 10 per company.",
  },
  returns: {
    eyebrow: "After sales",
    title: "Returns",
    description: "Request RMA for return or damage, and refill your cart from past orders.",
  },
};

export default en;
