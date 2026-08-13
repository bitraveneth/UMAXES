import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportBackup, type BackupScope } from "@/lib/system-db";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const SCOPES: BackupScope[] = ["ops", "catalog", "accounts", "full"];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "ops") as BackupScope;
  if (!SCOPES.includes(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const backup = await exportBackup(scope);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SYSTEM_BACKUP_EXPORT",
      entity: "Database",
      meta: JSON.stringify({ scope, counts: backup.counts }),
    },
  });

  const stamp = backup.exportedAt.slice(0, 10);
  const body = JSON.stringify(backup, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="umaxes-backup-${scope}-${stamp}.json"`,
    },
  });
}
