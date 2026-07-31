import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Keep middleware Edge-light. Auth is enforced in Node layouts via `auth()`
 * (admin/account) so we don't depend on Edge reading Auth.js cookies.
 */
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|videos/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
