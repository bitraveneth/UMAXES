import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  resetAccountsKeepStaffAndCatalog,
  resetOpsData,
} from "@/lib/system-db";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { mode?: string; confirm?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mode = body.mode;
  if (mode !== "ops" && mode !== "accounts") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const expected = mode === "ops" ? "RESET OPS" : "RESET ACCOUNTS";
  if (body.confirm !== expected) {
    return NextResponse.json(
      { error: `Type ${expected} to confirm` },
      { status: 400 },
    );
  }

  try {
    const result =
      mode === "ops"
        ? await resetOpsData()
        : await resetAccountsKeepStaffAndCatalog();

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SYSTEM_DB_RESET",
        entity: "Database",
        meta: JSON.stringify({ mode, result }),
      },
    });

    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Reset failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
