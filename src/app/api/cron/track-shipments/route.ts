import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyTrackingSync } from "@/lib/admin-actions";

/**
 * Cron / webhook entry to auto-update in-transit shipments.
 * Auth: Authorization: Bearer $CRON_SECRET  (or ?secret=)
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";
  const urlSecret = new URL(request.url).searchParams.get("secret") || "";
  if (bearer !== secret && urlSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shipped = await prisma.order.findMany({
    where: { status: "SHIPPED" },
    select: { id: true, orderNumber: true },
    take: 50,
  });

  const results: {
    orderId: string;
    orderNumber: string;
    ok: boolean;
    trackingStatus?: string;
    orderStatus?: string;
    error?: string;
  }[] = [];

  for (const row of shipped) {
    try {
      const sync = await applyTrackingSync(row.id, null);
      results.push({
        orderId: row.id,
        orderNumber: row.orderNumber,
        ok: true,
        trackingStatus: sync.trackingStatus,
        orderStatus: sync.orderStatus,
      });
    } catch (e) {
      results.push({
        orderId: row.id,
        orderNumber: row.orderNumber,
        ok: false,
        error: e instanceof Error ? e.message : "failed",
      });
    }
  }

  return NextResponse.json({
    checked: results.length,
    delivered: results.filter((r) => r.orderStatus === "COMPLETED").length,
    results,
  });
}
