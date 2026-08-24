import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/lib/auth";

/**
 * Super-admin "Login as" lands here (new tab).
 * Server-side sign-in — no client spinner / CSRF round-trips.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const fail = (code: string) => {
    const users = new URL("/admin/users", url.origin);
    users.searchParams.set("impersonate", code);
    return NextResponse.redirect(users);
  };

  if (!token) return fail("missing");

  try {
    await signIn("impersonate", {
      token,
      redirectTo: "/account",
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

  return NextResponse.redirect(new URL("/account", url.origin));
}
