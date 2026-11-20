import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PATHS = [
  "/",
  "/products",
  "/login",
  "/register",
  "/account",
  "/admin",
  "/maintenance",
] as const;

/** Super admin: refresh cached storefront / ops pages after backup or settings change. */
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  for (const path of PATHS) {
    revalidatePath(path);
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SYSTEM_CACHE_REVALIDATED",
      entity: "System",
      entityId: "revalidate",
      meta: JSON.stringify({ paths: PATHS }),
    },
  });

  return NextResponse.json({ ok: true, paths: PATHS });
}
