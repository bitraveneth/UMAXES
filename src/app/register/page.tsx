import { Suspense } from "react";
import Link from "next/link";
import AuthSplitShell from "@/components/AuthSplitShell";
import RegisterForm from "@/components/RegisterForm";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata = {
  title: "Register · UMAXES",
  description: "Create a UMAXES shop account.",
};

export default async function RegisterPage() {
  const settings = await getSiteSettings();

  if (!settings.publicSignInEnabled) {
    return (
      <AuthSplitShell
        title="Registration closed"
        description="New account signup is temporarily unavailable."
        leftDescription=""
      >
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 font-body text-sm text-amber-900">
          Public registration is turned off by the site administrator.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-black/12 bg-white px-4 py-2.5 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:bg-umx-orange hover:text-white"
        >
          Back to sign in
        </Link>
      </AuthSplitShell>
    );
  }

  return (
    <AuthSplitShell
      title="Create account"
      description="Sign up with email or phone to start shopping."
      leftDescription=""
    >
      <Suspense
        fallback={<p className="font-body text-sm text-black/50">Loading…</p>}
      >
        <RegisterForm />
      </Suspense>
    </AuthSplitShell>
  );
}
