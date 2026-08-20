import { Suspense } from "react";
import AuthSplitShell from "@/components/AuthSplitShell";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Sign in · UMAXES",
  description: "Sign in to your UMAXES shop or wholesale account.",
};

export default function LoginPage() {
  return (
    <AuthSplitShell
      title="Welcome back"
      description="Sign in with email or phone to continue."
      leftDescription=""
    >
      <Suspense
        fallback={<p className="font-body text-sm text-black/50">Loading…</p>}
      >
        <LoginForm />
      </Suspense>
    </AuthSplitShell>
  );
}
