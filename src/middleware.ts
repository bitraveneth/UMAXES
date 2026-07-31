import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessAdminPath, isStaffRole } from "@/lib/admin-access";

function countryFromRequest(request: NextRequest) {
  return (
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("x-country-code") ||
    ""
  ).toUpperCase();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/unauthorized") {
    return NextResponse.next();
  }

  const country = countryFromRequest(request);
  const forceGeo = process.env.GEO_BLOCK_FORCE === "true";
  const geoEnabled =
    process.env.GEO_BLOCK_ENABLED !== "false" &&
    (forceGeo || process.env.NODE_ENV === "production");

  if (geoEnabled && country === "CN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  const isProtected =
    pathname.startsWith("/account") || pathname.startsWith("/admin");

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin")) {
    const role = String(token.role ?? "");

    if (!isStaffRole(role)) {
      return NextResponse.redirect(new URL("/account", request.url));
    }

    if (pathname !== "/admin" && pathname !== "/admin/") {
      if (!canAccessAdminPath(role, pathname)) {
        const denied = new URL("/admin", request.url);
        denied.searchParams.set("denied", pathname);
        return NextResponse.redirect(denied);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin",
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|images/|videos/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
