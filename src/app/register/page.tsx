import { Suspense } from "react";
import AuthSplitShell from "@/components/AuthSplitShell";
import RegisterForm from "@/components/RegisterForm";

export const metadata = {
  title: "Register · UMAXES",
  description: "Create a UMAXES shop account.",
};

export default function RegisterPage() {
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
