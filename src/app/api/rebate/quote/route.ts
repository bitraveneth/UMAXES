import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { quoteForCompany } from "@/lib/rebate";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    sellingQty?: number;
    unitPrice?: number;
  };
  const quote = await quoteForCompany(
    session.user.companyId,
    Math.max(0, Math.floor(Number(body.sellingQty) || 0)),
    Number(body.unitPrice) || undefined,
  );
  return NextResponse.json(quote);
}
