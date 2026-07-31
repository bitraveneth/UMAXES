import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "SALES"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    include: { company: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const header = [
    "orderNumber",
    "piNumber",
    "company",
    "level",
    "status",
    "paymentMethod",
    "subtotal",
    "discount",
    "total",
    "email",
    "createdAt",
  ];

  const lines = orders.map((o) =>
    [
      o.orderNumber,
      o.piNumber || "",
      o.company.name,
      o.company.level,
      o.status,
      o.paymentMethod,
      o.subtotal,
      o.discount,
      o.total,
      o.email || o.user.email || "",
      o.createdAt.toISOString(),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header.join(","), ...lines].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="umaxes-orders.csv"`,
    },
  });
}
