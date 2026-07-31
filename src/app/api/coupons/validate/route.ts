import { NextResponse } from "next/server";
import type { CustomerLevel } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { resolveCoupon } from "@/lib/catalog";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const code = String(body.code ?? "").trim();
  const subtotal = Number(body.subtotal) || 0;
  const level = (session.user.companyLevel || "SHOP") as CustomerLevel;

  if (!code) {
    return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
  }

  const resolved = await resolveCoupon(code, level, subtotal);
  if ("error" in resolved && resolved.error) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  return NextResponse.json({
    code: resolved.coupon!.code,
    discount: resolved.discount,
  });
}
