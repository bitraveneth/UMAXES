import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSiteSettings, setSiteSettings } from "@/lib/site-settings";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.homepageAsLogin !== "boolean") {
    return NextResponse.json(
      { error: "homepageAsLogin required" },
      { status: 400 },
    );
  }

  const before = await getSiteSettings();
  const homepageAsLogin = body.homepageAsLogin;

  try {
    const settings = await setSiteSettings({ homepageAsLogin });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SITE_ACCESS_UPDATED",
        entity: "SiteSetting",
        entityId: "homepage",
        meta: JSON.stringify({
          mode: homepageAsLogin ? "login" : "home",
          homepageAsLogin,
          previous: before.homepageAsLogin ? "login" : "home",
        }),
      },
    });

    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    if (/SiteSetting|does not exist|P2021/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Database table SiteSetting is missing. Run: npx prisma migrate deploy",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
