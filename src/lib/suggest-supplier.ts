import { prisma } from "@/lib/db";

/**
 * Suggest a supplier for an order:
 * 1) Company.defaultSupplierId (if active)
 * 2) Most common Product.defaultSupplierId by line qty
 * 3) Last assigned supplier on a prior order for this company
 */
export async function suggestSupplierForOrder(orderId: string): Promise<{
  supplierId: string | null;
  supplierName: string | null;
  reason: "company_default" | "product_default" | "last_order" | null;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      companyId: true,
      company: {
        select: {
          defaultSupplierId: true,
          defaultSupplier: { select: { id: true, name: true, active: true } },
        },
      },
      items: {
        select: {
          quantity: true,
          product: {
            select: {
              defaultSupplierId: true,
              defaultSupplier: {
                select: { id: true, name: true, active: true },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return { supplierId: null, supplierName: null, reason: null };
  }

  const companyDefault = order.company.defaultSupplier;
  if (companyDefault?.active) {
    return {
      supplierId: companyDefault.id,
      supplierName: companyDefault.name,
      reason: "company_default",
    };
  }

  const votes = new Map<string, { name: string; qty: number }>();
  for (const item of order.items) {
    const s = item.product?.defaultSupplier;
    if (!s?.active) continue;
    const prev = votes.get(s.id) || { name: s.name, qty: 0 };
    prev.qty += item.quantity;
    votes.set(s.id, prev);
  }
  if (votes.size > 0) {
    const top = [...votes.entries()].sort((a, b) => b[1].qty - a[1].qty)[0];
    return {
      supplierId: top[0],
      supplierName: top[1].name,
      reason: "product_default",
    };
  }

  const last = await prisma.order.findFirst({
    where: {
      companyId: order.companyId,
      id: { not: orderId },
      supplierId: { not: null },
      status: {
        in: ["SENT_TO_SUPPLIER", "PICKING", "SHIPPED", "COMPLETED"],
      },
    },
    orderBy: { sentToSupplierAt: "desc" },
    select: {
      supplier: { select: { id: true, name: true, active: true } },
    },
  });

  if (last?.supplier?.active) {
    return {
      supplierId: last.supplier.id,
      supplierName: last.supplier.name,
      reason: "last_order",
    };
  }

  return { supplierId: null, supplierName: null, reason: null };
}

export async function suggestSuppliersForOrders(
  orderIds: string[],
): Promise<
  Map<
    string,
    {
      supplierId: string | null;
      supplierName: string | null;
      reason: "company_default" | "product_default" | "last_order" | null;
    }
  >
> {
  const map = new Map<
    string,
    {
      supplierId: string | null;
      supplierName: string | null;
      reason: "company_default" | "product_default" | "last_order" | null;
    }
  >();
  await Promise.all(
    orderIds.map(async (id) => {
      map.set(id, await suggestSupplierForOrder(id));
    }),
  );
  return map;
}
