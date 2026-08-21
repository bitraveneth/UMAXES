import { Suspense } from "react";
import AuthSplitShell from "@/components/AuthSplitShell";
import LoginForm from "@/components/LoginForm";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata = {
  title: "Sign in · UMAXES",
  description: "Sign in to your UMAXES shop or wholesale account.",
};

export default async function LoginPage() {
  const settings = await getSiteSettings();

  return (
    <AuthSplitShell
      title="Welcome back"
      description={
        settings.publicSignInEnabled
          ? "Sign in with email or phone to continue."
          : "Public sign-in is temporarily closed. Staff may still sign in."
      }
      leftDescription=""
    >
      <Suspense
        fallback={<p className="font-body text-sm text-black/50">Loading…</p>}
      >
        {!settings.publicSignInEnabled ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 font-body text-sm text-amber-900">
            Shop and wholesale sign-in is turned off right now. If you are staff,
            you can still sign in below.
          </p>
        ) : null}
        <LoginForm />
      </Suspense>
    </AuthSplitShell>
  );
}
