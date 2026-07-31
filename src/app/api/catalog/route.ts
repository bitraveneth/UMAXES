import { NextResponse } from "next/server";
import type { CustomerLevel } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getCatalogForLevel } from "@/lib/catalog";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let level: CustomerLevel = "SHOP";
  let creditAllowed = false;
  let creditAvailable = 0;
  let creditLimit = 0;
  let paymentTermsDays = 0;

  if (session.user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    });
    if (company) {
      level = company.level;
      creditLimit = company.creditLimit;
      paymentTermsDays = company.paymentTermsDays;
      creditAvailable = Math.max(0, company.creditLimit - company.creditUsed);
      creditAllowed =
        company.level !== "SHOP" &&
        company.paymentTermsDays >= 1 &&
        company.creditLimit > 0;
    }
  } else if (session.user.companyLevel) {
    level = session.user.companyLevel;
  }

  const products = await getCatalogForLevel(level);
  return NextResponse.json({
    level,
    products,
    credit: {
      allowed: creditAllowed,
      available: creditAvailable,
      limit: creditLimit,
      paymentTermsDays,
    },
    companyRole: session.user.companyRole,
    canOrder:
      session.user.role === "CUSTOMER" &&
      session.user.status === "APPROVED" &&
      session.user.companyRole !== "FINANCE",
  });
}
