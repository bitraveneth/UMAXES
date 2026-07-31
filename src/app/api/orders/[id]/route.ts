import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

async function loadOrderForUser(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" as const, status: 401 };

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      company: true,
      user: true,
      shipments: true,
    },
  });

  if (!order) return { error: "Not found" as const, status: 404 };

  const isOwner =
    session.user.role === "CUSTOMER" &&
    session.user.companyId === order.companyId;
  const isStaff = ["SUPER_ADMIN", "ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"].includes(
    session.user.role,
  );

  if (!isOwner && !isStaff) {
    return { error: "Forbidden" as const, status: 403 };
  }

  return { order, session };
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await loadOrderForUser(id);
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ order: result.order });
}
