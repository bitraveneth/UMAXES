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

  if (session.user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        id: true,
        level: true,
        paymentTermsDays: true,
        creditLimit: true,
      },
    });
    if (company) {
      level = company.level;
      creditAllowed =
        company.level !== "SHOP" &&
        company.paymentTermsDays >= 1 &&
        company.creditLimit > 0;
    }
  } else if (session.user.companyLevel) {
    level = session.user.companyLevel;
  }

  const products = await getCatalogForLevel(level);
  let channel = null;
  if (session.user.companyId) {
    const { quoteForCompany } = await import("@/lib/rebate");
    channel = await quoteForCompany(session.user.companyId, 0);
  }

  return NextResponse.json({
    level,
    products,
    credit: {
      allowed: creditAllowed,
    },
    channel,
    companyRole: session.user.companyRole,
    canOrder:
      session.user.role === "CUSTOMER" &&
      session.user.status === "APPROVED" &&
      session.user.companyRole !== "FINANCE",
  });
}
