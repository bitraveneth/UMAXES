import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "SALES"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const canSeeCreditAmounts =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  const companies = await prisma.company.findMany({
    include: {
      salesRep: true,
      _count: { select: { orders: true } },
    },
    orderBy: { name: "asc" },
  });

  const header = canSeeCreditAmounts
    ? [
        "company",
        "level",
        "status",
        "creditUsed",
        "creditLimit",
        "termsDays",
        "orders",
        "salesRep",
        "commissionRate",
      ]
    : [
        "company",
        "level",
        "status",
        "creditEnabled",
        "orders",
        "salesRep",
        "commissionRate",
      ];

  const lines = companies.map((c) =>
    (canSeeCreditAmounts
      ? [
          c.name,
          c.level,
          c.status,
          c.creditUsed,
          c.creditLimit,
          c.paymentTermsDays,
          c._count.orders,
          c.salesRep?.email || "",
          c.commissionRate,
        ]
      : [
          c.name,
          c.level,
          c.status,
          c.creditLimit > 0 ? "yes" : "no",
          c._count.orders,
          c.salesRep?.email || "",
          c.commissionRate,
        ]
    )
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header.join(","), ...lines].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="umaxes-customers.csv"`,
    },
  });
}
