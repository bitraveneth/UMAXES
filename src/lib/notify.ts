import { prisma } from "@/lib/db";

export type NotifyType =
  | "general"
  | "order"
  | "credit"
  | "shipment"
  | "account";

type NotifyInput = {
  to: string;
  subject: string;
  body: string;
  userId?: string | null;
  channel?: "email" | "sms" | "log" | "in_app";
  type?: NotifyType;
  /** Admin or account path to open when the notification is clicked */
  href?: string | null;
};

/** Fallback deep link when older rows have no `href` stored. */
export function hrefForNotificationType(type: string): string {
  switch (type) {
    case "order":
      return "/admin/orders";
    case "credit":
      return "/admin/credit";
    case "shipment":
      return "/admin/logistics";
    case "account":
      return "/admin/approvals";
    default:
      return "/admin/notifications";
  }
}

export function resolveNotificationHref(n: {
  href?: string | null;
  type: string;
}): string {
  return n.href || hrefForNotificationType(n.type);
}

/**
 * Lightweight notifier: always stores a Notification row.
 * If SMTP_HOST is set later, can be extended to real email.
 */
export async function notify(input: NotifyInput) {
  const channel = input.channel || "email";
  const type = input.type || "general";

  const row = await prisma.notification.create({
    data: {
      userId: input.userId || null,
      channel,
      type,
      to: input.to,
      subject: input.subject,
      body: input.body,
      href: input.href || hrefForNotificationType(type),
      status: process.env.SMTP_HOST ? "queued" : "logged",
    },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[notify:${channel}/${type}]`, input.to, input.subject);
  }

  return row;
}

/** In-app + email-style rows for staff users by role. */
export async function notifyStaff(opts: {
  subject: string;
  body: string;
  type?: NotifyType;
  href?: string | null;
  includeSales?: boolean;
  includeLogistics?: boolean;
  /** Override role list (takes precedence over include* flags) */
  roles?: Array<
    "SUPER_ADMIN" | "ADMIN" | "SALES" | "WAREHOUSE" | "LOGISTICS"
  >;
}) {
  const roles =
    opts.roles ||
    ([
      "SUPER_ADMIN",
      "ADMIN",
      ...(opts.includeSales ? (["SALES"] as const) : []),
      ...(opts.includeLogistics ? (["LOGISTICS"] as const) : []),
    ] as const);
  const staff = await prisma.user.findMany({
    where: {
      role: { in: [...roles] },
      status: "APPROVED",
    },
    select: { id: true, email: true, phone: true },
  });

  await Promise.all(
    staff.map((u) =>
      notify({
        userId: u.id,
        to: u.email || u.phone || `staff:${u.id}`,
        subject: opts.subject,
        body: opts.body,
        channel: "in_app",
        type: opts.type || "general",
        href: opts.href,
      }),
    ),
  );
}

export async function notifyUserApproved(opts: {
  email?: string | null;
  phone?: string | null;
  userId: string;
  companyName: string;
  level: string;
}) {
  if (opts.email) {
    await notify({
      userId: opts.userId,
      to: opts.email,
      subject: "UMAXES account approved",
      body: `Your company ${opts.companyName} is approved as ${opts.level}. You can now place wholesale orders.`,
      type: "account",
      href: "/account",
    });
  }

  await notifyStaff({
    type: "account",
    includeSales: true,
    href: "/admin/customers",
    subject: `Account approved: ${opts.companyName}`,
    body: `${opts.companyName} approved as ${opts.level}.`,
  });
}

export async function notifyOrderPlaced(opts: {
  email?: string | null;
  userId: string;
  orderNumber: string;
  piNumber?: string | null;
  total: number;
  companyName?: string;
  paymentMethod?: string;
  placedByStaff?: boolean;
  salesRepUserId?: string | null;
}) {
  if (opts.email) {
    await notify({
      userId: opts.userId,
      to: opts.email,
      subject: `Order ${opts.orderNumber} received`,
      body: opts.placedByStaff
        ? `An order ${opts.orderNumber}${opts.piNumber ? ` (${opts.piNumber})` : ""} totaling $${opts.total.toFixed(2)} was placed for your account. Download PI from your account.`
        : `Your order ${opts.orderNumber}${opts.piNumber ? ` (${opts.piNumber})` : ""} totaling $${opts.total.toFixed(2)} was submitted. Download PI from your account.`,
      type: "order",
      href: "/account/orders",
    });
  }

  if (opts.salesRepUserId) {
    const rep = await prisma.user.findUnique({
      where: { id: opts.salesRepUserId },
      select: { id: true, email: true },
    });
    if (rep) {
      await notify({
        userId: rep.id,
        to: rep.email || `staff:${rep.id}`,
        subject: `Your account ordered ${opts.orderNumber}`,
        body: `${opts.companyName || "Customer"} placed ${opts.orderNumber} for $${opts.total.toFixed(2)}${opts.paymentMethod ? ` (${opts.paymentMethod})` : ""}${opts.placedByStaff ? " (staff-assisted)" : ""}.`,
        type: "order",
        href: "/admin/orders",
      });
    }
  }

  await notifyStaff({
    type: "order",
    includeSales: true,
    href: "/admin/orders",
    subject: `New order ${opts.orderNumber}`,
    body: opts.placedByStaff
      ? `Staff placed ${opts.orderNumber} for ${opts.companyName || "customer"} — $${opts.total.toFixed(2)}${opts.paymentMethod ? ` (${opts.paymentMethod})` : ""}.`
      : `${opts.companyName || "Customer"} placed ${opts.orderNumber} for $${opts.total.toFixed(2)}${opts.paymentMethod ? ` (${opts.paymentMethod})` : ""}.`,
  });
}

export async function notifyCreditLimitCrossed(opts: {
  companyId: string;
  companyName: string;
  creditUsed: number;
  creditLimit: number;
  orderNumber?: string;
  customerEmail?: string | null;
  customerUserId?: string | null;
}) {
  const body = `${opts.companyName} has reached its credit limit${opts.orderNumber ? ` after order ${opts.orderNumber}` : ""}. Review in Credit.`;

  await notifyStaff({
    type: "credit",
    includeSales: true,
    href: "/admin/credit",
    subject: `Credit limit reached: ${opts.companyName}`,
    body,
  });

  if (opts.customerEmail && opts.customerUserId) {
    await notify({
      userId: opts.customerUserId,
      to: opts.customerEmail,
      subject: "Credit unavailable",
      body: "Your trade credit is currently unavailable. Contact your sales rep to continue ordering on terms.",
      type: "credit",
      href: "/account",
    });
  }
}

export async function notifyShipped(opts: {
  email?: string | null;
  userId: string;
  orderNumber: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  companyName?: string;
}) {
  if (opts.email) {
    await notify({
      userId: opts.userId,
      to: opts.email,
      subject: `Order ${opts.orderNumber} shipped`,
      body: `Your order shipped via ${opts.carrier || "carrier"}. Tracking: ${opts.trackingNumber || "n/a"}.`,
      type: "shipment",
      href: "/account/orders",
    });
  }

  await notifyStaff({
    type: "shipment",
    includeSales: true,
    href: "/admin/logistics",
    subject: `Shipped ${opts.orderNumber}`,
    body: `${opts.companyName || "Order"} ${opts.orderNumber} shipped via ${opts.carrier || "carrier"} · ${opts.trackingNumber || "n/a"}.`,
  });
}

export async function notifySentToSupplier(opts: {
  email?: string | null;
  userId: string;
  orderNumber: string;
  companyName?: string;
  supplierName?: string | null;
}) {
  const supplier = opts.supplierName || "our supplier partner";

  if (opts.email) {
    await notify({
      userId: opts.userId,
      to: opts.email,
      subject: `Order ${opts.orderNumber} is with supplier`,
      body: `Your order ${opts.orderNumber} was sent to ${supplier} for fulfillment.`,
      type: "shipment",
      href: "/account/orders",
    });
  }

  await notifyStaff({
    type: "shipment",
    includeSales: true,
    href: "/admin/orders",
    subject: `Sent to supplier ${opts.orderNumber}`,
    body: `${opts.companyName || "Order"} ${opts.orderNumber} assigned to ${supplier}.`,
  });

  // Handoff → logistics queue
  await notifyStaff({
    type: "shipment",
    includeLogistics: true,
    roles: ["SUPER_ADMIN", "ADMIN", "LOGISTICS"],
    href: "/admin/logistics",
    subject: `Ready for tracking: ${opts.orderNumber}`,
    body: `${opts.companyName || "Order"} ${opts.orderNumber} is with ${supplier}. Enter carrier tracking when the supplier ships.`,
  });
}

export async function notifyNeedsSupplierAssign(opts: {
  orderNumber: string;
  companyName?: string;
  paymentMethod?: string;
}) {
  await notifyStaff({
    type: "order",
    includeSales: true,
    href: "/admin/orders",
    subject: `Assign supplier: ${opts.orderNumber}`,
    body: `${opts.companyName || "Order"} ${opts.orderNumber} is confirmed${opts.paymentMethod ? ` (${opts.paymentMethod})` : ""} — assign a supplier to hand off to logistics.`,
  });
}

/** @deprecated Use notifySentToSupplier */
export async function notifyPicking(opts: {
  email?: string | null;
  userId: string;
  orderNumber: string;
  companyName?: string;
}) {
  return notifySentToSupplier(opts);
}

export async function notifyDelivered(opts: {
  email?: string | null;
  userId: string;
  orderNumber: string;
  companyName?: string;
}) {
  if (opts.email) {
    await notify({
      userId: opts.userId,
      to: opts.email,
      subject: `Order ${opts.orderNumber} delivered`,
      body: `Your order ${opts.orderNumber} is marked completed / delivered.`,
      type: "shipment",
      href: "/account/orders",
    });
  }

  await notifyStaff({
    type: "shipment",
    includeSales: true,
    href: "/admin/logistics",
    subject: `Delivered ${opts.orderNumber}`,
    body: `${opts.companyName || "Order"} ${opts.orderNumber} marked COMPLETED.`,
  });
}
