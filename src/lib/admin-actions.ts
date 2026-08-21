"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  CustomerLevel,
  OrderStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessAdmin } from "@/lib/rbac";

async function requireRoles(roles: UserRole[]) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) {
    throw new Error("Unauthorized");
  }
  // Super admin (devs) can do anything
  if (session.user.role === "SUPER_ADMIN") return session;
  // Regular admin: everything except SUPER_ADMIN-only actions
  if (session.user.role === "ADMIN") {
    if (roles.length === 1 && roles[0] === "SUPER_ADMIN") {
      throw new Error("Forbidden");
    }
    return session;
  }
  if (!roles.includes(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function updateStaffProfile(input: {
  name: string;
  email: string;
  phone: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  avatarUrl?: string | null;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}) {
  const session = await requireRoles([
    "ADMIN",
    "SALES",
    "WAREHOUSE",
    "LOGISTICS",
    "SUPER_ADMIN",
  ]);

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase() || null;
  const phone = input.phone.trim() || null;

  if (!name) throw new Error("Name is required");
  if (!email && !phone) throw new Error("Email or phone is required");

  // Unique email/phone if changed
  if (email) {
    const taken = await prisma.user.findFirst({
      where: { email, id: { not: session.user.id } },
      select: { id: true },
    });
    if (taken) throw new Error("Email already in use");
  }
  if (phone) {
    const taken = await prisma.user.findFirst({
      where: { phone, id: { not: session.user.id } },
      select: { id: true },
    });
    if (taken) throw new Error("Phone already in use");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { name, email, phone },
    });
    await tx.staffProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        avatarUrl: input.avatarUrl || null,
        jobTitle: input.jobTitle?.trim() || null,
        department: input.department?.trim() || null,
        companyName: input.companyName?.trim() || "UMAXES",
        companyLogoUrl: input.companyLogoUrl || null,
        line1: input.line1?.trim() || null,
        line2: input.line2?.trim() || null,
        city: input.city?.trim() || null,
        region: input.region?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        country: input.country?.trim() || null,
      },
      update: {
        avatarUrl: input.avatarUrl || null,
        jobTitle: input.jobTitle?.trim() || null,
        department: input.department?.trim() || null,
        companyName: input.companyName?.trim() || "UMAXES",
        companyLogoUrl: input.companyLogoUrl || null,
        line1: input.line1?.trim() || null,
        line2: input.line2?.trim() || null,
        city: input.city?.trim() || null,
        region: input.region?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        country: input.country?.trim() || null,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "STAFF_PROFILE_UPDATED",
        entity: "User",
        entityId: session.user.id,
        meta: JSON.stringify({ name, email, phone }),
      },
    });
  });

  revalidatePath("/admin/profile");
  revalidatePath("/admin");
}

export async function approveCustomer(
  userId: string,
  level: CustomerLevel = "SHOP",
) {
  const session = await requireRoles(["ADMIN", "SALES"]);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.companyId) throw new Error("User not found");

  const creditByLevel: Record<
    CustomerLevel,
    { creditLimit: number; paymentTermsDays: number }
  > = {
    DISTRO: { creditLimit: 20000, paymentTermsDays: 30 },
    WHOLESALER: { creditLimit: 8000, paymentTermsDays: 15 },
    SHOP: { creditLimit: 0, paymentTermsDays: 0 },
  };

  const credit = creditByLevel[level];

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { status: "APPROVED", role: "CUSTOMER", companyRole: "OWNER" },
    }),
    prisma.company.update({
      where: { id: user.companyId },
      data: {
        status: "APPROVED",
        level,
        creditLimit: credit.creditLimit,
        paymentTermsDays: credit.paymentTermsDays,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_APPROVED",
        entity: "User",
        entityId: userId,
        meta: JSON.stringify({ level, ...credit }),
      },
    }),
  ]);

  const { notifyUserApproved } = await import("@/lib/notify");
  await notifyUserApproved({
    email: user.email,
    phone: user.phone,
    userId: user.id,
    companyName: (await prisma.company.findUnique({ where: { id: user.companyId } }))?.name || "your company",
    level,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/distributors");
  revalidatePath("/admin/wholesalers");
  revalidatePath("/admin/retail");
}

export async function rejectCustomer(userId: string) {
  const session = await requireRoles(["ADMIN", "SALES"]);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { status: "REJECTED" },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_REJECTED",
        entity: "User",
        entityId: userId,
      },
    }),
  ]);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/distributors");
  revalidatePath("/admin/wholesalers");
  revalidatePath("/admin/retail");
}

/** Register a B2B company + owner login on behalf of the customer. */
export async function createCustomerOnBehalf(input: {
  level: CustomerLevel;
  companyName: string;
  taxId?: string;
  contactName: string;
  email?: string;
  phone?: string;
  password: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  status?: "APPROVED" | "PENDING";
  address?: {
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode: string;
    country: string;
    label?: string;
  };
}) {
  const session = await requireRoles(["ADMIN", "SALES"]);
  const { creditDefaultsByLevel } = await import("@/lib/customer-segments");

  const companyName = input.companyName.trim();
  const contactName = input.contactName.trim();
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone?.trim() || null;
  const password = input.password;

  if (!companyName) throw new Error("Company name required");
  if (!contactName) throw new Error("Contact name required");
  if (!email && !phone) throw new Error("Email or phone required");
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  if (email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Email is already registered");
  }
  if (phone) {
    const exists = await prisma.user.findUnique({ where: { phone } });
    if (exists) throw new Error("Phone is already registered");
  }

  const defaults = creditDefaultsByLevel[input.level];
  const status = input.status || "APPROVED";
  const isRetail = input.level === "SHOP";
  const creditLimit = isRetail
    ? 0
    : input.creditLimit !== undefined
      ? Math.max(0, Number(input.creditLimit) || 0)
      : defaults.creditLimit;
  const paymentTermsDays = isRetail
    ? 0
    : input.paymentTermsDays !== undefined
      ? Math.max(0, Math.floor(Number(input.paymentTermsDays) || 0))
      : defaults.paymentTermsDays;

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);

  const company = await prisma.$transaction(async (tx) => {
    const co = await tx.company.create({
      data: {
        name: companyName,
        level: input.level,
        taxId: input.taxId?.trim() || null,
        status,
        creditLimit,
        paymentTermsDays,
        creditUsed: 0,
      },
    });

    await tx.user.create({
      data: {
        name: contactName,
        email,
        phone,
        passwordHash,
        role: "CUSTOMER",
        companyRole: "OWNER",
        status,
        companyId: co.id,
      },
    });

    if (input.address?.line1 && input.address.city && input.address.postalCode && input.address.country) {
      await tx.address.create({
        data: {
          companyId: co.id,
          label: input.address.label?.trim() || "Default",
          line1: input.address.line1.trim(),
          line2: input.address.line2?.trim() || null,
          city: input.address.city.trim(),
          region: input.address.region?.trim() || null,
          postalCode: input.address.postalCode.trim(),
          country: input.address.country.trim(),
          isDefault: true,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CUSTOMER_CREATED_ON_BEHALF",
        entity: "Company",
        entityId: co.id,
        meta: JSON.stringify({
          level: input.level,
          email,
          phone,
          status,
        }),
      },
    });

    return co;
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/distributors");
  revalidatePath("/admin/wholesalers");
  revalidatePath("/admin/retail");
  revalidatePath("/admin/approvals");
  return company;
}

const MAX_COMPANY_ADDRESSES = 10;

function revalidateCustomerDirs() {
  revalidatePath("/admin/customers");
  revalidatePath("/admin/distributors");
  revalidatePath("/admin/wholesalers");
  revalidatePath("/admin/retail");
}

/** Add another ship-to address for a B2B company (distro / wholesale / retail). */
export async function addCompanyShipTo(input: {
  companyId: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}) {
  const session = await requireRoles(["ADMIN", "SALES"]);
  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
  });
  if (!company) throw new Error("Company not found");

  const line1 = input.line1.trim();
  const city = input.city.trim();
  const postalCode = input.postalCode.trim();
  const country = input.country.trim();
  if (!line1 || !city || !postalCode || !country) {
    throw new Error("Address, city, postal code, and country are required");
  }
  if (country.toLowerCase().includes("china") || country.toUpperCase() === "CN") {
    throw new Error("Shipping to China is not available");
  }

  const count = await prisma.address.count({
    where: { companyId: input.companyId },
  });
  if (count >= MAX_COMPANY_ADDRESSES) {
    throw new Error(`Maximum ${MAX_COMPANY_ADDRESSES} ship-to addresses`);
  }

  const isDefault = Boolean(input.isDefault) || count === 0;

  await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { companyId: input.companyId },
        data: { isDefault: false },
      });
    }
    await tx.address.create({
      data: {
        companyId: input.companyId,
        label: input.label?.trim() || null,
        line1,
        line2: input.line2?.trim() || null,
        city,
        region: input.region?.trim() || null,
        postalCode,
        country,
        isDefault,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "COMPANY_ADDRESS_ADDED",
        entity: "Company",
        entityId: input.companyId,
        meta: JSON.stringify({ city, country, isDefault }),
      },
    });
  });

  revalidateCustomerDirs();
}

export async function setCompanyShipToDefault(
  companyId: string,
  addressId: string,
) {
  await requireRoles(["ADMIN", "SALES"]);
  const address = await prisma.address.findFirst({
    where: { id: addressId, companyId },
  });
  if (!address) throw new Error("Address not found");

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { companyId },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  revalidateCustomerDirs();
}

export async function removeCompanyShipTo(
  companyId: string,
  addressId: string,
) {
  await requireRoles(["ADMIN", "SALES"]);
  const address = await prisma.address.findFirst({
    where: { id: addressId, companyId },
  });
  if (!address) throw new Error("Address not found");

  await prisma.address.delete({ where: { id: addressId } });

  if (address.isDefault) {
    const next = await prisma.address.findFirst({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.address.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  revalidateCustomerDirs();
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await requireRoles(["ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"]);

  const role = session.user.role;
  const allowed: Partial<Record<UserRole, OrderStatus[]>> = {
    SALES: ["PAYMENT_PENDING", "CONFIRMED", "SENT_TO_SUPPLIER", "CANCELLED"],
    WAREHOUSE: ["SENT_TO_SUPPLIER", "CONFIRMED"],
    LOGISTICS: ["SHIPPED", "COMPLETED"],
    ADMIN: [
      "SUBMITTED",
      "PAYMENT_PENDING",
      "CONFIRMED",
      "SENT_TO_SUPPLIER",
      "SHIPPED",
      "COMPLETED",
      "CANCELLED",
    ],
  };

  const ok = allowed[role]?.includes(status);
  if (!ok && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("Status not allowed for role");
  }

  const before = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, orderNumber: true },
  });
  if (!before) throw new Error("Order not found");

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ORDER_STATUS",
        entity: "Order",
        entityId: orderId,
        meta: JSON.stringify({
          orderNumber: before.orderNumber,
          previousStatus: before.status,
          status,
        }),
      },
    }),
  ]);

  if (status === "SENT_TO_SUPPLIER" || status === "COMPLETED") {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, company: true, supplier: true },
    });
    if (order) {
      const { notifySentToSupplier, notifyDelivered } = await import("@/lib/notify");
      if (status === "SENT_TO_SUPPLIER") {
        await notifySentToSupplier({
          email: order.user.email || order.email,
          userId: order.userId,
          orderNumber: order.orderNumber,
          companyName: order.company.name,
          supplierName: order.supplier?.name,
        });
      }
      if (status === "COMPLETED") {
        await prisma.shipment.updateMany({
          where: { orderId },
          data: { status: "delivered", deliveredAt: new Date() },
        });
        await notifyDelivered({
          email: order.user.email || order.email,
          userId: order.userId,
          orderNumber: order.orderNumber,
          companyName: order.company.name,
        });
      }
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/logistics");
  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/notifications");
}

export async function assignOrderToSupplier(
  orderId: string,
  supplierId: string,
  supplierNote?: string,
  opts?: { saveAsCompanyDefault?: boolean },
) {
  const session = await requireRoles(["ADMIN", "SALES", "WAREHOUSE"]);

  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, active: true },
  });
  if (!supplier) throw new Error("Supplier not found");

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { companyId: true },
  });
  if (!existing) throw new Error("Order not found");

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        supplierId,
        supplierNote: supplierNote?.trim() || null,
        sentToSupplierAt: new Date(),
        status: "SENT_TO_SUPPLIER",
      },
    });
    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ORDER_SENT_TO_SUPPLIER",
        entity: "Order",
        entityId: orderId,
        meta: JSON.stringify({
          supplierId,
          supplierName: supplier.name,
          supplierNote: supplierNote || null,
          saveAsCompanyDefault: !!opts?.saveAsCompanyDefault,
        }),
      },
    });
    if (opts?.saveAsCompanyDefault) {
      await tx.company.update({
        where: { id: existing.companyId },
        data: { defaultSupplierId: supplierId },
      });
    }
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, company: true },
  });
  if (order) {
    const { notifySentToSupplier } = await import("@/lib/notify");
    await notifySentToSupplier({
      email: order.user.email || order.email,
      userId: order.userId,
      orderNumber: order.orderNumber,
      companyName: order.company.name,
      supplierName: supplier.name,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/logistics");
  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/notifications");
}

export async function upsertSupplier(input: {
  id?: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  active?: boolean;
}) {
  const session = await requireRoles(["ADMIN", "SALES"]);
  const name = input.name.trim();
  if (!name) throw new Error("Supplier name required");

  const data = {
    name,
    contactName: input.contactName?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    notes: input.notes?.trim() || null,
    active: input.active ?? true,
  };

  const row = input.id
    ? await prisma.supplier.update({ where: { id: input.id }, data })
    : await prisma.supplier.create({ data });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: input.id ? "SUPPLIER_UPDATED" : "SUPPLIER_CREATED",
      entity: "Supplier",
      entityId: row.id,
      meta: JSON.stringify({ name: row.name }),
    },
  });

  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/orders");
  return row;
}

export async function markPaymentReceived(orderId: string, reference?: string) {
  const session = await requireRoles(["ADMIN", "SALES"]);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        paymentRef: reference || order.paymentRef,
      },
    });

    await tx.payment.updateMany({
      where: { orderId },
      data: {
        status: "paid",
        reference: reference || undefined,
        paidAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PAYMENT_RECEIVED",
        entity: "Order",
        entityId: orderId,
        meta: JSON.stringify({
          orderNumber: order.orderNumber,
          reference: reference || order.paymentRef || null,
          previousStatus: order.status,
          status: "CONFIRMED",
          amount: order.total,
          paymentMethod: order.paymentMethod,
          companyId: order.companyId,
        }),
      },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/credit");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { company: { select: { name: true } } },
  });
  if (order) {
    const { notifyNeedsSupplierAssign } = await import("@/lib/notify");
    await notifyNeedsSupplierAssign({
      orderNumber: order.orderNumber,
      companyName: order.company.name,
      paymentMethod: order.paymentMethod,
    });
  }
}

export async function upsertShipment(
  orderId: string,
  carrier: string,
  trackingNumber: string,
) {
  const session = await requireRoles(["ADMIN", "LOGISTICS"]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, company: true },
  });
  if (!order) throw new Error("Order not found");

  const existing = await prisma.shipment.findFirst({ where: { orderId } });
  if (existing) {
    await prisma.shipment.update({
      where: { id: existing.id },
      data: {
        carrier,
        trackingNumber,
        status: "shipped",
        shippedAt: existing.shippedAt || new Date(),
      },
    });
  } else {
    await prisma.shipment.create({
      data: {
        orderId,
        carrier,
        trackingNumber,
        status: "shipped",
        shippedAt: new Date(),
        packedAt: new Date(),
      },
    });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "SHIPPED" },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "TRACKING_UPLOADED",
      entity: "Order",
      entityId: orderId,
      meta: JSON.stringify({
        carrier,
        trackingNumber,
        orderNumber: order.orderNumber,
        companyName: order.company.name,
        status: "SHIPPED",
      }),
    },
  });

  const { notifyShipped } = await import("@/lib/notify");
  await notifyShipped({
    email: order.user.email || order.email,
    userId: order.userId,
    orderNumber: order.orderNumber,
    carrier,
    trackingNumber,
    companyName: order.company.name,
  });

  revalidatePath("/admin/logistics");
  revalidatePath(`/admin/logistics/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/notifications");
}

/** Logistics creates packing record before carrier tracking (boxes / CBM / flavor / size). */
export async function createShipmentPacking(
  orderId: string,
  input: {
    boxCount: number;
    cbm: number;
    weightKg?: number;
    packingNote?: string;
    lines: {
      orderItemId?: string;
      sku: string;
      name: string;
      quantity: number;
      flavor?: string;
      size?: string;
      boxes?: number;
    }[];
  },
) {
  const session = await requireRoles(["ADMIN", "LOGISTICS", "SUPER_ADMIN"]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Order not found");

  const boxCount = Math.max(0, Math.floor(Number(input.boxCount) || 0));
  const cbm = Math.max(0, Number(input.cbm) || 0);
  const weightKg =
    input.weightKg !== undefined && input.weightKg !== null
      ? Math.max(0, Number(input.weightKg) || 0)
      : null;
  const lines = (input.lines || [])
    .map((l) => ({
      orderItemId: l.orderItemId || null,
      sku: String(l.sku || "").trim(),
      name: String(l.name || "").trim(),
      quantity: Math.max(0, Math.floor(Number(l.quantity) || 0)),
      flavor: l.flavor?.trim() || null,
      size: l.size?.trim() || null,
      boxes:
        l.boxes !== undefined && l.boxes !== null
          ? Math.max(0, Math.floor(Number(l.boxes) || 0))
          : null,
    }))
    .filter((l) => l.sku && l.name && l.quantity > 0);

  if (boxCount < 1) throw new Error("Box quantity required");
  if (lines.length === 0) throw new Error("At least one packing line required");

  const existing = await prisma.shipment.findFirst({
    where: { orderId },
    include: { lines: true },
  });

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.shipmentLine.deleteMany({ where: { shipmentId: existing.id } });
      await tx.shipment.update({
        where: { id: existing.id },
        data: {
          boxCount,
          cbm,
          weightKg,
          packingNote: input.packingNote?.trim() || null,
          packedAt: existing.packedAt || new Date(),
          status: existing.trackingNumber ? existing.status : "pending",
        },
      });
      await tx.shipmentLine.createMany({
        data: lines.map((l) => ({ ...l, shipmentId: existing.id })),
      });
    } else {
      const shipment = await tx.shipment.create({
        data: {
          orderId,
          status: "pending",
          boxCount,
          cbm,
          weightKg,
          packingNote: input.packingNote?.trim() || null,
          packedAt: new Date(),
        },
      });
      await tx.shipmentLine.createMany({
        data: lines.map((l) => ({ ...l, shipmentId: shipment.id })),
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: existing ? "SHIPMENT_PACKING_UPDATED" : "SHIPMENT_PACKING_CREATED",
        entity: "Order",
        entityId: orderId,
        meta: JSON.stringify({ boxCount, cbm, weightKg, lineCount: lines.length }),
      },
    });
  });

  revalidatePath("/admin/logistics");
  revalidatePath(`/admin/logistics/${orderId}`);
  revalidatePath("/admin/orders");
}

/**
 * Sync carrier tracking for one order. Auto-completes when provider reports delivered.
 */
export async function applyTrackingSync(
  orderId: string,
  actorUserId?: string | null,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shipments: { orderBy: { createdAt: "desc" }, take: 1 },
      user: true,
      company: true,
    },
  });
  if (!order) throw new Error("Order not found");
  const shipment = order.shipments[0];
  if (!shipment?.trackingNumber) {
    throw new Error("No tracking number on this order");
  }

  const { fetchTracking, shipmentStatusFromTracking } = await import(
    "@/lib/tracking"
  );
  const result = await fetchTracking({
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber,
    shippedAt: shipment.shippedAt,
  });

  const shipStatus = shipmentStatusFromTracking(result.status);
  const now = new Date();

  await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      status: shipStatus,
      lastTrackedAt: now,
      trackingStatus: result.status,
      trackingMeta: JSON.stringify({
        description: result.description,
        provider: result.provider,
        events: result.events,
      }),
      ...(shipStatus === "delivered"
        ? { deliveredAt: shipment.deliveredAt || now }
        : {}),
      ...(shipStatus === "shipped" && !shipment.shippedAt
        ? { shippedAt: now }
        : {}),
    },
  });

  let orderStatus = order.status;
  if (shipStatus === "shipped" && order.status !== "COMPLETED") {
    orderStatus = "SHIPPED";
  }
  if (shipStatus === "delivered") {
    orderStatus = "COMPLETED";
  }

  await prisma.auditLog.create({
    data: {
      userId: actorUserId || null,
      action: "TRACKING_SYNC",
      entity: "Order",
      entityId: orderId,
      meta: JSON.stringify({
        trackingStatus: result.status,
        orderStatus,
        previousStatus: order.status,
        provider: result.provider,
      }),
    },
  });

  if (orderStatus !== order.status) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus },
    });

    if (orderStatus === "COMPLETED") {
      const { notifyDelivered } = await import("@/lib/notify");
      await notifyDelivered({
        email: order.user.email || order.email,
        userId: order.userId,
        orderNumber: order.orderNumber,
        companyName: order.company.name,
      });
    }
  }

  return {
    trackingStatus: result.status,
    description: result.description,
    orderStatus,
    events: result.events,
  };
}

export async function syncShipmentTracking(orderId: string) {
  const session = await requireRoles(["ADMIN", "LOGISTICS"]);
  const result = await applyTrackingSync(orderId, session.user.id);
  revalidatePath("/admin/logistics");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/notifications");
  return result;
}

/** Batch sync all in-transit shipments (staff action). */
export async function syncAllInTransitShipments() {
  const session = await requireRoles(["ADMIN", "LOGISTICS"]);

  const shipped = await prisma.order.findMany({
    where: { status: "SHIPPED" },
    select: { id: true },
    take: 50,
  });

  const results: { orderId: string; ok: boolean; error?: string }[] = [];
  for (const row of shipped) {
    try {
      await applyTrackingSync(row.id, session.user.id);
      results.push({ orderId: row.id, ok: true });
    } catch (e) {
      results.push({
        orderId: row.id,
        ok: false,
        error: e instanceof Error ? e.message : "failed",
      });
    }
  }
  revalidatePath("/admin/logistics");
  revalidatePath("/admin/orders");
  return results;
}

export async function adjustInventory(productId: string, quantity: number) {
  const session = await requireRoles(["ADMIN", "WAREHOUSE"]);
  const qty = Math.max(0, Math.floor(quantity));

  await prisma.inventory.upsert({
    where: { productId },
    create: { productId, quantity: qty, reserved: 0 },
    update: { quantity: qty },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "INVENTORY_ADJUST",
      entity: "Product",
      entityId: productId,
      meta: JSON.stringify({ quantity: qty }),
    },
  });

  revalidatePath("/admin/warehouse");
  revalidatePath("/admin/catalog");
}

export async function updateProductPrice(
  productId: string,
  level: CustomerLevel,
  unitPrice: number,
  moq: number,
) {
  const session = await requireRoles(["ADMIN"]);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  await prisma.priceByLevel.upsert({
    where: { productId_level: { productId, level } },
    create: { productId, level, unitPrice, moq },
    update: { unitPrice, moq },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRICE_UPDATE",
      entity: "Product",
      entityId: productId,
      meta: JSON.stringify({ level, unitPrice, moq }),
    },
  });

  revalidatePath("/admin/catalog");
}

export async function saveCoupon(input: {
  code: string;
  type: string;
  value: number;
  minOrder: number;
  active: boolean;
}) {
  const session = await requireRoles(["ADMIN"]);
  const code = input.code.trim().toUpperCase();

  await prisma.coupon.upsert({
    where: { code },
    create: {
      code,
      type: input.type,
      value: input.value,
      minOrder: input.minOrder,
      active: input.active,
      allowedLevels: ["DISTRO", "WHOLESALER", "SHOP"],
    },
    update: {
      type: input.type,
      value: input.value,
      minOrder: input.minOrder,
      active: input.active,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "COUPON_SAVE",
      entity: "Coupon",
      entityId: code,
      meta: JSON.stringify(input),
    },
  });

  revalidatePath("/admin/coupons");
}

export async function recordCreditPayment(companyId: string, amount: number, note?: string) {
  const session = await requireRoles(["ADMIN", "SALES"]);
  const amt = Math.round(amount * 100) / 100;
  if (amt <= 0) throw new Error("Amount must be positive");

  await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
      data: { creditUsed: { decrement: amt } },
    }),
    prisma.creditLedger.create({
      data: {
        companyId,
        type: "payment",
        amount: -amt,
        note: note || "Credit payment received",
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREDIT_PAYMENT",
        entity: "Company",
        entityId: companyId,
        meta: JSON.stringify({ amount: amt, note: note || null }),
      },
    }),
  ]);

  // Prevent negative creditUsed
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (company && company.creditUsed < 0) {
    await prisma.company.update({
      where: { id: companyId },
      data: { creditUsed: 0 },
    });
  }

  revalidatePath("/admin/credit");
  revalidatePath("/admin/customers");
}

/** ADMIN only — set credit limit and payment terms days (admin decides days, no 1–30 cap). */
export async function updateCompanyCredit(
  companyId: string,
  creditLimit: number,
  paymentTermsDays: number,
  note?: string,
) {
  const session = await requireRoles(["ADMIN"]);

  const limit = Math.round(Number(creditLimit) * 100) / 100;
  const days = Math.floor(Number(paymentTermsDays));

  if (!Number.isFinite(limit) || limit < 0) {
    throw new Error("Credit limit must be 0 or greater");
  }
  if (!Number.isFinite(days) || days < 0) {
    throw new Error("Payment terms days must be 0 or greater");
  }

  const before = await prisma.company.findUnique({ where: { id: companyId } });
  if (!before) throw new Error("Company not found");

  await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
      data: {
        creditLimit: limit,
        paymentTermsDays: days,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREDIT_TERMS_UPDATED",
        entity: "Company",
        entityId: companyId,
        meta: JSON.stringify({
          note: note || null,
          before: {
            creditLimit: before.creditLimit,
            paymentTermsDays: before.paymentTermsDays,
          },
          after: { creditLimit: limit, paymentTermsDays: days },
        }),
      },
    }),
  ]);

  const { notifyStaff } = await import("@/lib/notify");
  await notifyStaff({
    type: "credit",
    includeSales: true,
    subject: `Credit updated: ${before.name}`,
    body: `${before.name}: credit terms updated${note ? ` · ${note}` : ""}.`,
  });

  revalidatePath("/admin/credit");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/aging");
  revalidatePath("/admin/notifications");
}

export async function markNotificationRead(notificationId: string) {
  const session = await requireRoles(["ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"]);
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      OR: [{ userId: session.user.id }, { userId: null }],
    },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}

export async function markNotificationUnread(notificationId: string) {
  const session = await requireRoles(["ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"]);
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
    data: { readAt: null },
  });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}

export async function markAllNotificationsRead() {
  const session = await requireRoles(["ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"]);
  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}

/** Mark as read then navigate to the related admin page. */
export async function openNotification(notificationId: string) {
  const session = await requireRoles(["ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"]);
  const { resolveNotificationHref } = await import("@/lib/notify");

  const row = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      OR: [{ userId: session.user.id }, { userId: null }],
    },
  });
  if (!row) throw new Error("Notification not found");

  if (!row.readAt) {
    await prisma.notification.update({
      where: { id: row.id },
      data: { readAt: new Date() },
    });
  }

  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
  redirect(resolveNotificationHref(row));
}

export async function updateRmaStatus(
  rmaId: string,
  status: import("@/generated/prisma/enums").RmaStatus,
  creditAmount?: number,
  adminNote?: string,
) {
  const session = await requireRoles(["ADMIN", "SALES"]);
  const rma = await prisma.rma.findUnique({ where: { id: rmaId } });
  if (!rma) throw new Error("RMA not found");

  const resolutionMap: Partial<
    Record<
      import("@/generated/prisma/enums").RmaStatus,
      import("@/generated/prisma/enums").RmaResolution
    >
  > = {
    REJECTED: "REJECTED",
    CREDITED: "CREDIT",
    CLOSED: "CLOSED",
  };

  await prisma.$transaction(async (tx) => {
    await tx.rma.update({
      where: { id: rmaId },
      data: {
        status,
        creditAmount:
          status === "CREDITED"
            ? creditAmount ?? rma.creditAmount
            : rma.creditAmount,
        adminNote:
          adminNote !== undefined
            ? adminNote.trim() || null
            : rma.adminNote,
        resolution: resolutionMap[status] ?? rma.resolution,
      },
    });

    if (status === "CREDITED" && creditAmount && creditAmount > 0) {
      await tx.company.update({
        where: { id: rma.companyId },
        data: { creditUsed: { decrement: creditAmount } },
      });
      await tx.creditLedger.create({
        data: {
          companyId: rma.companyId,
          orderId: rma.orderId,
          type: "rma_credit",
          amount: -creditAmount,
          note: `RMA ${rma.rmaNumber}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RMA_STATUS",
        entity: "Rma",
        entityId: rmaId,
        meta: JSON.stringify({ status, creditAmount, adminNote }),
      },
    });
  });

  revalidatePath("/admin/rma");
  revalidatePath("/admin/credit");
  revalidatePath("/admin/orders");
}

export async function markRmaReplacement(
  rmaId: string,
  needed: boolean,
  note?: string,
) {
  const session = await requireRoles(["ADMIN", "SALES"]);
  const rma = await prisma.rma.findUnique({ where: { id: rmaId } });
  if (!rma) throw new Error("RMA not found");

  await prisma.rma.update({
    where: { id: rmaId },
    data: {
      replacementNeeded: needed,
      replacementNote: note?.trim() || null,
      resolution: needed ? "REPLACEMENT" : rma.resolution === "REPLACEMENT" ? "PENDING" : rma.resolution,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: needed ? "RMA_MARK_REPLACEMENT" : "RMA_CLEAR_REPLACEMENT",
      entity: "Rma",
      entityId: rmaId,
      meta: JSON.stringify({ note: note || null }),
    },
  });

  revalidatePath("/admin/rma");
  revalidatePath("/admin/orders");
}

/** Ops-created return record from an existing order (damage / return logging). */
export async function createAdminRma(input: {
  orderId: string;
  reason: string;
  reasonType: import("@/generated/prisma/enums").RmaReasonType;
  replacementNeeded?: boolean;
  items: { orderItemId: string; quantity: number }[];
  adminNote?: string;
}) {
  const session = await requireRoles(["ADMIN", "SALES"]);
  const reason = input.reason.trim();
  if (!reason) throw new Error("Reason required");
  if (!input.items.length) throw new Error("Select at least one line");

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true, company: true },
  });
  if (!order) throw new Error("Order not found");

  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rmaNumber = `RMA-${stamp}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const lineCreates = input.items
    .map((sel) => {
      const line = order.items.find((i) => i.id === sel.orderItemId);
      if (!line) return null;
      return {
        orderItemId: line.id,
        productId: line.productId,
        sku: line.sku,
        name: line.name,
        flavor: line.name,
        quantity: Math.min(
          line.quantity,
          Math.max(1, Math.floor(sel.quantity || 1)),
        ),
        unitPrice: line.unitPrice,
        image: line.image,
      };
    })
    .filter(Boolean) as {
    orderItemId: string;
    productId: string | null;
    sku: string;
    name: string;
    flavor: string;
    quantity: number;
    unitPrice: number;
    image: string | null;
  }[];

  if (!lineCreates.length) throw new Error("No valid lines");

  const rma = await prisma.rma.create({
    data: {
      rmaNumber,
      orderId: order.id,
      companyId: order.companyId,
      userId: session.user.id,
      reason,
      reasonType: input.reasonType,
      status: "REQUESTED",
      resolution: input.replacementNeeded ? "REPLACEMENT" : "PENDING",
      replacementNeeded: Boolean(input.replacementNeeded),
      adminNote: input.adminNote?.trim() || null,
      addressSnap: order.addressSnap,
      items: { create: lineCreates },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "RMA_CREATED_ADMIN",
      entity: "Rma",
      entityId: rma.id,
      meta: JSON.stringify({
        rmaNumber,
        orderId: order.id,
        reasonType: input.reasonType,
      }),
    },
  });

  revalidatePath("/admin/rma");
  revalidatePath("/admin/orders");
  return rma;
}

export async function assignSalesRep(
  companyId: string,
  salesRepId: string,
  commissionRate: number,
) {
  const session = await requireRoles(["ADMIN", "SALES"]);
  await prisma.company.update({
    where: { id: companyId },
    data: {
      salesRepId: salesRepId || null,
      commissionRate: Math.max(0, commissionRate || 0),
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SALES_ASSIGN",
      entity: "Company",
      entityId: companyId,
      meta: JSON.stringify({ salesRepId, commissionRate }),
    },
  });
  revalidatePath("/admin/commissions");
  revalidatePath("/admin/customers");
}

export async function upsertWarehouse(code: string, name: string) {
  const session = await requireRoles(["ADMIN", "WAREHOUSE"]);
  const c = code.trim().toUpperCase();
  await prisma.warehouse.upsert({
    where: { code: c },
    create: { code: c, name: name.trim(), active: true },
    update: { name: name.trim(), active: true },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "WAREHOUSE_UPSERT",
      entity: "Warehouse",
      entityId: c,
      meta: JSON.stringify({ name }),
    },
  });
  revalidatePath("/admin/warehouses");
}

export async function setWarehouseStock(
  warehouseId: string,
  productId: string,
  quantity: number,
) {
  const session = await requireRoles(["ADMIN", "WAREHOUSE"]);
  const qty = Math.max(0, Math.floor(quantity));
  await prisma.warehouseStock.upsert({
    where: {
      warehouseId_productId: { warehouseId, productId },
    },
    create: { warehouseId, productId, quantity: qty, reserved: 0 },
    update: { quantity: qty },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "WAREHOUSE_STOCK",
      entity: "WarehouseStock",
      entityId: warehouseId,
      meta: JSON.stringify({ productId, quantity: qty }),
    },
  });
  revalidatePath("/admin/warehouses");
}

export async function createStaffUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const session = await requireRoles(["SUPER_ADMIN"]);
  const email = input.email.trim().toLowerCase();
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const roles: UserRole[] = ["ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"];
  if (!roles.includes(input.role)) throw new Error("Invalid role");

  await prisma.user.upsert({
    where: { email },
    create: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role,
      status: "APPROVED",
    },
    update: {
      name: input.name.trim(),
      passwordHash,
      role: input.role,
      status: "APPROVED",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "STAFF_UPSERT",
      entity: "User",
      entityId: email,
      meta: JSON.stringify({ role: input.role }),
    },
  });
  revalidatePath("/admin/staff");
}

const STAFF_EDITABLE_ROLES: UserRole[] = [
  "ADMIN",
  "SALES",
  "WAREHOUSE",
  "LOGISTICS",
];

export async function updateStaffUser(input: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "APPROVED" | "DISABLED";
  password?: string;
}) {
  const session = await requireRoles(["SUPER_ADMIN"]);
  const target = await prisma.user.findUnique({ where: { id: input.id } });
  if (!target) throw new Error("Staff user not found");
  if (target.role === "SUPER_ADMIN") {
    throw new Error("Super admin accounts cannot be edited here");
  }
  if (!STAFF_EDITABLE_ROLES.includes(input.role)) {
    throw new Error("Invalid role");
  }

  const email = input.email.trim().toLowerCase();
  const data: {
    name: string;
    email: string;
    role: UserRole;
    status: "APPROVED" | "DISABLED";
    passwordHash?: string;
  } = {
    name: input.name.trim(),
    email,
    role: input.role,
    status: input.status,
  };

  const nextPassword = input.password?.trim();
  if (nextPassword) {
    if (nextPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    const bcrypt = await import("bcryptjs");
    data.passwordHash = await bcrypt.hash(nextPassword, 12);
  }

  await prisma.user.update({
    where: { id: input.id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "STAFF_UPDATED",
      entity: "User",
      entityId: input.id,
      meta: JSON.stringify({
        email,
        role: input.role,
        status: input.status,
        passwordChanged: Boolean(nextPassword),
      }),
    },
  });
  revalidatePath("/admin/staff");
}

export async function deleteStaffUser(id: string) {
  const session = await requireRoles(["SUPER_ADMIN"]);
  if (session.user.id === id) {
    throw new Error("You cannot delete your own account");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error("Staff user not found");
  if (target.role === "SUPER_ADMIN") {
    throw new Error("Super admin accounts cannot be deleted");
  }
  if (
    !STAFF_EDITABLE_ROLES.includes(target.role) &&
    target.role !== "CUSTOMER"
  ) {
    throw new Error("Not a staff account");
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    // Orders / RMA may still reference this user — disable instead
    await prisma.user.update({
      where: { id },
      data: { status: "DISABLED" },
    });
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "STAFF_DISABLED",
        entity: "User",
        entityId: id,
        meta: JSON.stringify({
          email: target.email,
          reason: "Linked records — disabled instead of deleted",
        }),
      },
    });
    revalidatePath("/admin/staff");
    return { disabled: true as const };
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "STAFF_DELETED",
      entity: "User",
      entityId: id,
      meta: JSON.stringify({ email: target.email, role: target.role }),
    },
  });
  revalidatePath("/admin/staff");
  return { deleted: true as const };
}

export async function setProductVisibility(
  productId: string,
  levels: CustomerLevel[],
) {
  const session = await requireRoles(["ADMIN"]);
  await prisma.product.update({
    where: { id: productId },
    data: { visibleLevels: levels },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRODUCT_VISIBILITY",
      entity: "Product",
      entityId: productId,
      meta: JSON.stringify({ levels }),
    },
  });
  revalidatePath("/admin/catalog");
}

export async function createProduct(input: {
  sku: string;
  name: string;
  description?: string;
  image?: string;
  active?: boolean;
  stock?: number;
  distroPrice?: number;
  wholesalerPrice?: number;
  shopPrice?: number;
  distroMoq?: number;
  wholesalerMoq?: number;
  shopMoq?: number;
}) {
  const session = await requireRoles(["ADMIN"]);
  const sku = input.sku.trim().toLowerCase().replace(/\s+/g, "-");
  const name = input.name.trim();
  if (!sku || !name) throw new Error("SKU and name are required");

  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) throw new Error("SKU already exists");

  const stock = Math.max(0, Math.floor(input.stock ?? 0));
  const product = await prisma.product.create({
    data: {
      sku,
      name,
      description: input.description?.trim() || null,
      image: input.image?.trim() || null,
      active: input.active !== false,
      inventory: { create: { quantity: stock, reserved: 0 } },
      prices: {
        create: [
          {
            level: "DISTRO",
            unitPrice: Number(input.distroPrice ?? 0),
            moq: Math.max(1, Math.floor(input.distroMoq ?? 50)),
          },
          {
            level: "WHOLESALER",
            unitPrice: Number(input.wholesalerPrice ?? 0),
            moq: Math.max(1, Math.floor(input.wholesalerMoq ?? 20)),
          },
          {
            level: "SHOP",
            unitPrice: Number(input.shopPrice ?? 0),
            moq: Math.max(1, Math.floor(input.shopMoq ?? 5)),
          },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: product.id,
      meta: JSON.stringify({ sku, name }),
    },
  });

  revalidatePath("/admin/catalog");
  revalidatePath("/admin/warehouse");
  revalidatePath("/shop");
  return product;
}

export async function updateProductDetails(
  productId: string,
  input: {
    name: string;
    description?: string;
    image?: string;
    active: boolean;
  },
) {
  const session = await requireRoles(["ADMIN"]);
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      description: input.description?.trim() || null,
      image: input.image?.trim() || null,
      active: input.active,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: productId,
      meta: JSON.stringify(input),
    },
  });

  revalidatePath("/admin/catalog");
  revalidatePath("/shop");
}

export async function addProductOption(
  productId: string,
  name: string,
  valuesRaw: string,
) {
  const session = await requireRoles(["ADMIN"]);
  const optionName = name.trim();
  if (!optionName) throw new Error("Option name is required");

  const values = valuesRaw
    .split(/[,|\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (values.length === 0) throw new Error("Add at least one option value");

  const count = await prisma.productOption.count({ where: { productId } });
  await prisma.productOption.create({
    data: {
      productId,
      name: optionName,
      values: JSON.stringify(values),
      sortOrder: count,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRODUCT_OPTION_ADD",
      entity: "Product",
      entityId: productId,
      meta: JSON.stringify({ name: optionName, values }),
    },
  });

  revalidatePath("/admin/catalog");
}

export async function deleteProductOption(optionId: string) {
  const session = await requireRoles(["ADMIN"]);
  const option = await prisma.productOption.delete({ where: { id: optionId } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRODUCT_OPTION_DELETE",
      entity: "Product",
      entityId: option.productId,
      meta: JSON.stringify({ optionId, name: option.name }),
    },
  });

  revalidatePath("/admin/catalog");
}
