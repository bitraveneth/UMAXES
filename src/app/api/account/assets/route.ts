import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "CUSTOMER" && session.user.status !== "APPROVED") {
    return NextResponse.json({ error: "Pending approval" }, { status: 403 });
  }

  const assets = await prisma.brandAsset.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  return NextResponse.json({ assets });
}
