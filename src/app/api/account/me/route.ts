import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      image: true,
      jobTitle: true,
      company: { select: { name: true, level: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      jobTitle: user.jobTitle,
      companyName: user.company?.name ?? null,
      companyLevel: user.company?.level ?? session.user.companyLevel,
    },
  });
}
