import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  BACKUP_VERSION,
  importBackup,
  type BackupScope,
  type DbBackup,
} from "@/lib/system-db";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    backup?: DbBackup;
    replace?: boolean;
    confirm?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.confirm !== "IMPORT") {
    return NextResponse.json(
      { error: 'Type IMPORT to confirm' },
      { status: 400 },
    );
  }

  const backup = body.backup;
  if (!backup || backup.version !== BACKUP_VERSION || !backup.data) {
    return NextResponse.json(
      { error: "Invalid or unsupported backup file" },
      { status: 400 },
    );
  }

  const scopes: BackupScope[] = ["ops", "catalog", "accounts", "full"];
  if (!scopes.includes(backup.scope)) {
    return NextResponse.json({ error: "Invalid backup scope" }, { status: 400 });
  }

  try {
    const imported = await importBackup(backup, {
      replace: body.replace !== false,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SYSTEM_BACKUP_IMPORT",
        entity: "Database",
        meta: JSON.stringify({
          scope: backup.scope,
          exportedAt: backup.exportedAt,
          imported,
        }),
      },
    });

    return NextResponse.json({ ok: true, imported });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
