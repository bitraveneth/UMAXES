import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/lib/auth";
import { verifyImpersonationToken } from "@/lib/impersonation";
import { prisma } from "@/lib/db";

/**
 * Super-admin "Login as" lands here (new tab).
 * Server-side sign-in — no client spinner / CSRF round-trips.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const failPath = url.searchParams.get("from") || "/admin/users";
  const fail = (code: string) => {
    const dest = new URL(failPath, url.origin);
    dest.searchParams.set("impersonate", code);
    return NextResponse.redirect(dest);
  };

  if (!token) return fail("missing");

  let redirectTo = "/account";
  try {
    const payload = verifyImpersonationToken(token);
    if (payload?.typ === "start") {
      const target = await prisma.user.findUnique({
        where: { id: payload.targetId },
        select: { role: true },
      });
      if (target && target.role !== "CUSTOMER") {
        redirectTo = "/admin";
      }
    }
  } catch {
    /* fall through — signIn will validate again */
  }

  try {
    await signIn("impersonate", {
      token,
      redirectTo,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      console.error("[auth/impersonate]", error.type, error.message);
      return fail("failed");
    }
    console.error("[auth/impersonate]", error);
    return fail("failed");
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
