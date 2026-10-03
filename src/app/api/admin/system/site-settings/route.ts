import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSiteSettings, setSiteSettings } from "@/lib/site-settings";
import type { SiteSettings } from "@/lib/site-settings";

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
  const patch: Partial<SiteSettings> = {};

  if (typeof body.homepageAsLogin === "boolean") {
    patch.homepageAsLogin = body.homepageAsLogin;
  }
  if (typeof body.publicSignInEnabled === "boolean") {
    patch.publicSignInEnabled = body.publicSignInEnabled;
  }
  if (typeof body.maintenanceMode === "boolean") {
    patch.maintenanceMode = body.maintenanceMode;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      {
        error:
          "Provide homepageAsLogin, publicSignInEnabled, and/or maintenanceMode",
      },
      { status: 400 },
    );
  }

  const before = await getSiteSettings();

  try {
    const settings = await setSiteSettings(patch);

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SITE_ACCESS_UPDATED",
        entity: "SiteSetting",
        entityId: "site",
        meta: JSON.stringify({
          patch,
          before,
          after: settings,
          mode: settings.homepageAsLogin ? "login" : "home",
          homepageAsLogin: settings.homepageAsLogin,
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
