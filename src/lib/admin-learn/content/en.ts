import type { LearnSlug } from "../catalog";

export type LearnTutorial = {
  title: string;
  summary: string;
  what: string;
  steps: string[];
  tip?: string;
};

export const learnEn: Record<LearnSlug, LearnTutorial> = {
  overview: {
    title: "How UMAXES works",
    summary: "End-to-end flow from buyer signup to delivery and returns.",
    what: "UMAXES is a B2B ops platform: buyers (distributor, wholesaler, retail) register, get approved, then order from your catalog. Your team manages credit, payments, packing, shipments, and RMAs in this admin.",
    steps: [
      "Buyer registers (email or phone OTP) and waits for approval.",
      "Admin approves the company, sets customer level and credit terms.",
      "Buyer (or sales) places an order; payment and credit rules apply.",
      "Ops assigns supplier / packing; logistics ships and tracks delivery.",
      "Credit payments, aging, commissions, and RMAs keep the account healthy.",
    ],
    tip: "Use this Learning Hub for each module, then click Open module to practice on the real screen.",
  },
  approvals: {
    title: "Approvals",
    summary: "Approve new companies and set their trading terms.",
    what: "New buyer accounts stay pending until someone in Approvals reviews them. Approval unlocks ordering and storefront access.",
    steps: [
      "Open Approvals to see pending companies.",
      "Review company details and choose level (Distributor / Wholesaler / Retail).",
      "Set credit limit and payment terms if the account will buy on credit.",
      "Approve to activate — or reject if the application is invalid.",
    ],
    tip: "Level affects pricing; credit terms control how much they can order before paying.",
  },
  customers: {
    title: "Customer directories",
    summary: "Distributors, wholesalers, and retail shops in one place.",
    what: "After approval, companies appear under Distributors, Wholesalers, or Retail. These lists are your customer directory for contact, status, and credit overview.",
    steps: [
      "Pick the segment that matches the company level.",
      "Search or open a company to review members and account status.",
      "Admins can see credit used / limit; other roles only see whether credit is allowed.",
      "Update details or follow links into orders and credit as needed.",
    ],
  },
  catalog: {
    title: "Catalog",
    summary: "Products, SKUs, options, and images buyers can order.",
    what: "Catalog is the product master. Active products with prices for each customer level show in the storefront and when staff create orders.",
    steps: [
      "Open Catalog to list or search products.",
      "Add a product with name, SKU, options, images, and level prices.",
      "Activate products so buyers can purchase them.",
      "Keep options and images accurate so packing and sales stay clear.",
    ],
  },
  coupons: {
    title: "Coupons",
    summary: "Discount codes for checkout.",
    what: "Coupons reduce order totals when a valid code is applied at checkout (rules you define: amount, dates, eligibility).",
    steps: [
      "Create a coupon with code, discount type, and validity window.",
      "Share the code with customers or sales.",
      "Disable or expire codes that should no longer work.",
    ],
  },
  orders: {
    title: "Orders",
    summary: "Order desk — payments, status, and create-on-behalf.",
    what: "Orders is the main desk for every purchase. You track payment, assign fulfillment, and change status. Create order lets staff place an order for an approved customer.",
    steps: [
      "Open Orders to filter and review the pipeline.",
      "Mark payment, update status, and hand off to packing when ready.",
      "Use Create order to select a customer and build a cart for them.",
      "Open an order for line items, documents, and history.",
    ],
    tip: "Sales can create and follow orders; packing and shipments continue in Logistics.",
  },
  suppliers: {
    title: "Suppliers",
    summary: "Fulfillment partners who supply or ship goods.",
    what: "Suppliers are partner companies used when fulfilling orders. Link orders to the right supplier so packing and tracking stay organized.",
    steps: [
      "Maintain supplier company records.",
      "Assign the correct supplier when processing an order.",
      "Coordinate packing and shipment against that partner.",
    ],
  },
  packing: {
    title: "Packing & shipments",
    summary: "Packing queue, shipments, and packing lists.",
    what: "Logistics tools turn paid/ready orders into packed boxes and tracked deliveries. Packing lists help the warehouse without showing pricing.",
    steps: [
      "Open Packing for orders waiting to be packed.",
      "Work a logistics desk to pack and create shipment records.",
      "Use Shipments to add tracking and follow delivery status.",
      "Print or open Packing lists for warehouse-friendly documents.",
    ],
  },
  credit: {
    title: "Credit & aging",
    summary: "Limits, payments, and overdue buckets.",
    what: "Credit lets approved buyers order within a limit. Aging shows how balances age so you can collect. Only Admin and Super Admin see dollar amounts; others see allowed / not allowed.",
    steps: [
      "Set or adjust credit limits and terms on Credit.",
      "Record payments against outstanding balances.",
      "Use Aging to spot overdue buckets and follow up.",
      "Keep limits aligned with Approvals when onboarding.",
    ],
    tip: "Never share exact credit dollar figures with sales-facing or buyer UIs — amounts stay admin-only.",
  },
  rma: {
    title: "RMA",
    summary: "Returns, damage claims, and reship.",
    what: "RMA handles after-sales returns and damage. Staff open or review cases and decide refund, replacement, or reship.",
    steps: [
      "Open RMA to list open and closed cases.",
      "Review the related order and reason.",
      "Update status as you approve, receive goods, or close the case.",
      "Coordinate with packing if a reship is needed.",
    ],
  },
  commissions: {
    title: "Commissions",
    summary: "Sales reps and commission tracking.",
    what: "Assign sales ownership and track commissions earned on orders so reps are paid correctly.",
    steps: [
      "Link customers or orders to the right sales user.",
      "Review commission figures on the Commissions page.",
      "Adjust assignments when accounts move between reps.",
    ],
  },
  reports: {
    title: "Reports",
    summary: "Snapshot of orders, levels, SKUs, and credit.",
    what: "Reports give a quick read on volume by customer level, product mix, and credit exposure — useful for daily ops decisions.",
    steps: [
      "Open Reports for the current snapshot.",
      "Scan orders, levels, and SKU highlights.",
      "Cross-check credit totals with the Credit and Aging pages.",
    ],
  },
  activity: {
    title: "Activity",
    summary: "Who changed what — payments, shipments, status, credit.",
    what: "Activity is the operations log. Use it to audit edits and troubleshoot “who marked this paid?” style questions.",
    steps: [
      "Filter by category (orders, credit, shipments, etc.).",
      "Read the action, target, and who edited it.",
      "Open the linked record when you need the full screen.",
    ],
  },
  "staff-system": {
    title: "Staff & System",
    summary: "Internal users and database tools (Super Admin).",
    what: "Staff manages internal ops accounts. System tools export/import data and reset demo ops — Super Admin only. Use carefully; resets are destructive.",
    steps: [
      "Staff: create or review ADMIN, SALES, LOGISTICS, and other staff users.",
      "System: export backup JSON for the scopes you need.",
      "Import only with a confirmed backup and the IMPORT confirmation step.",
      "Reset ops (or ops + customers) only when you intentionally wipe demo/test data.",
    ],
    tip: "Regular Admins do not see Staff or System — ask a Super Admin for those tasks.",
  },
};
