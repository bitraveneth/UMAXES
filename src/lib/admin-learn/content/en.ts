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
    summary: "Signup → approve → order → pay → ship → rebate / credit.",
    what: "UMAXES is B2B ops for distributors, wholesalers, and retail. Buyers register, get approved, then order. Your team confirms payment, ships, and manages credit and volume rebates in this admin.",
    steps: [
      "Buyer registers and waits in Approvals.",
      "Admin sets level + credit (if needed) and approves.",
      "Order is placed (buyer or sales on behalf).",
      "Confirm Payment on Orders (separate from Shipping).",
      "Update Shipping when fulfillment moves; pack and ship in Logistics.",
      "Wholesaler / Distro: Issue monthly rebate to wallet after paid pcs update — checkout uses it automatically.",
    ],
    tip: "Start with Simple daily SOP on the hub, then open each course when you need detail.",
  },
  approvals: {
    title: "Approvals",
    summary: "Turn pending signups into live trade accounts.",
    what: "New companies stay pending until Approvals. Approving unlocks ordering and the storefront for that level.",
    steps: [
      "Open Approvals and review the company.",
      "Choose level: Distributor, Wholesaler, or Retail.",
      "Set credit limit / terms only if they buy on credit.",
      "Approve to activate, or reject invalid applications.",
    ],
    tip: "Level controls catalog price. Credit is separate from volume rebate wallets.",
  },
  customers: {
    title: "Customer directories",
    summary: "Distributors, wholesalers, and retail shops.",
    what: "Approved companies live under Distributors, Wholesalers, or Retail. Admins can also Add user (Users or directory forms) with an immediate password — no email verify.",
    steps: [
      "Use Add user (or the form on a directory) for company + login.",
      "Pick level and a ship-to address so you can Create order next.",
      "Approved accounts show in Create order customer lists.",
      "Admins see credit used/limit; other roles only see credit allowed or not.",
    ],
  },
  catalog: {
    title: "Catalog",
    summary: "Products, SKUs, case qty, and level prices.",
    what: "Catalog is the product master. Distro / Wholesaler / Shop prices can differ. Shop prices stay in the DB but are not shown on the public storefront to guests.",
    steps: [
      "Add or edit products: name, SKU, images, case quantity, prices.",
      "Keep Shop prices filled for internal use even if the website hides them.",
      "Activate products so approved trade accounts can buy.",
      "Warehouse stock is managed separately under Warehouse.",
    ],
    tip: "Do not delete Shop prices to hide them — leave them; the website simply does not show guest retail dollars.",
  },
  warehouse: {
    title: "Warehouse stock",
    summary: "On-hand inventory for ops — not the buyer catalog.",
    what: "Warehouse tracks stock levels and adjustments. Use it so packing and sales know what is available.",
    steps: [
      "Open Warehouse to see stock by SKU / location.",
      "Adjust quantities when goods arrive or leave.",
      "Keep catalog products linked so stock matches what buyers order.",
    ],
    tip: "Catalog = what they can buy. Warehouse = how many you have.",
  },
  orders: {
    title: "Orders",
    summary: "Payment and shipping are two separate saves.",
    what: "Orders is the main desk. Expand a row to edit Payment and Shipping independently. Saving Paid does not auto-advance shipping to Confirmed or Shipped.",
    steps: [
      "Filter by payment or shipping stage (e.g. Slip submitted).",
      "Payment panel: Pending / Slip submitted / Paid / Rejected → Save payment only.",
      "Shipping panel: Confirmed / With supplier / Shipped / Completed → Save shipping only.",
      "Assign supplier when ready; download PI / packing as PDF or Excel.",
      "Create order places a cart for an approved customer.",
    ],
    tip: "If payment looks Paid but shipping stayed Pending payment, that is correct until you save shipping separately.",
  },
  payments: {
    title: "Payments hub",
    summary: "Bank accounts and payment-slip review shortcuts.",
    what: "Payments is the money hub: active bank details for invoices, and a path into orders waiting on slips or confirmation.",
    steps: [
      "Keep the active bank account correct for PI / Excel / PDF.",
      "Jump to orders that need slip review or Paid confirmation.",
      "Confirm funds on Orders — that is what counts rebate paid pcs.",
    ],
    tip: "Buyer uploads a slip; Admin/Sales confirm Paid. Super Admin can confirm without a slip when needed.",
  },
  coupons: {
    title: "Coupons",
    summary: "Discount codes at checkout.",
    what: "Coupons reduce totals when a valid code is applied (amount, dates, rules you set).",
    steps: [
      "Create code, discount type, and validity.",
      "Share with customers or sales.",
      "Disable codes that should stop working.",
    ],
  },
  suppliers: {
    title: "Suppliers",
    summary: "Fulfillment partners for orders.",
    what: "Suppliers are partners you assign so packing and tracking stay organized.",
    steps: [
      "Maintain supplier company records.",
      "Assign a supplier from the order Shipping / supplier section.",
      "Coordinate packing against that partner.",
    ],
  },
  packing: {
    title: "Packing & shipments",
    summary: "Packing queue, lists, and tracking.",
    what: "Logistics turns ready orders into packed boxes and tracked deliveries. Packing lists are warehouse-friendly (no pricing).",
    steps: [
      "Open Packing for work waiting on the warehouse.",
      "Build packing lists; record boxes / CBM / weight when needed.",
      "Shipments: add carrier + tracking and update delivery status.",
    ],
  },
  credit: {
    title: "Credit & aging",
    summary: "Limits, payments, and overdue buckets.",
    what: "Credit lets approved buyers order within a limit. Aging shows how balances age. Dollar amounts stay Admin / Super Admin only.",
    steps: [
      "Set limits and terms on Credit.",
      "Record payments against open balances.",
      "Use Aging to chase overdue buckets.",
      "Align limits with Approvals when onboarding.",
    ],
    tip: "Credit terms ≠ volume rebate wallet. Rebate cash-back is on Volume rebate.",
  },
  rebates: {
    title: "Volume rebate",
    summary: "Paid pcs → Issue to wallet → auto use on next order.",
    what: "Wholesaler and distributor cash-back. Confirming Paid updates monthly paid pcs. Issue puts money in their rebate wallet. Checkout spends it automatically. Manual correction is rare only.",
    steps: [
      "Set SOP: unit price, 95+1 test stations, first-order unpaid pcs, monthly tiers.",
      "Confirm order Paid on Orders — that counts pcs.",
      "This month’s rebates: click Issue to wallet when ready.",
      "Buyer’s next order applies wallet balance at checkout.",
      "Manual correction form = exceptions only (fix, goodwill, clawback) — not normal payments.",
    ],
    tip: "You do not type Company + Amount after every payment. Use Issue to wallet.",
  },
  rma: {
    title: "RMA",
    summary: "Returns, damage, and reship.",
    what: "RMA covers after-sales returns and damage claims.",
    steps: [
      "Open RMA for open and closed cases.",
      "Review the order and reason.",
      "Update status as you approve, receive goods, or close.",
      "Coordinate packing if a reship is needed.",
    ],
  },
  commissions: {
    title: "Commissions",
    summary: "Sales ownership and commission tracking.",
    what: "Track who owns an account and commissions earned on orders.",
    steps: [
      "Link customers or orders to the right sales user.",
      "Review figures on Commissions.",
      "Update ownership when accounts move.",
    ],
  },
  reports: {
    title: "Reports",
    summary: "Orders, levels, SKUs, and credit snapshot.",
    what: "Quick read on volume by level, product mix, and credit exposure.",
    steps: [
      "Open Reports for the current snapshot.",
      "Scan orders, levels, and SKU highlights.",
      "Cross-check credit with Credit and Aging.",
    ],
  },
  activity: {
    title: "Activity",
    summary: "Audit trail — who changed payment, status, credit.",
    what: "Ops log for troubleshooting “who marked this paid?”",
    steps: [
      "Filter by category.",
      "Read action, target, and editor.",
      "Open the linked record when needed.",
    ],
  },
  "staff-system": {
    title: "Staff & System",
    summary: "Internal users and DB tools (Super Admin).",
    what: "Staff manages ops accounts. System export/import/reset is Super Admin only and can be destructive.",
    steps: [
      "Staff: create ADMIN, SALES, LOGISTICS, and other roles.",
      "System: export backup JSON for the scopes you need.",
      "Import only with a confirmed backup.",
      "Reset ops only when you intentionally wipe demo/test data.",
    ],
    tip: "Regular Admins do not see Staff or System.",
  },
};
