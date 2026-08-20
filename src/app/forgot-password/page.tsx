import { Suspense } from "react";
import AuthSplitShell from "@/components/AuthSplitShell";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = {
  title: "Reset password · UMAXES",
  description: "Reset your UMAXES password using email or phone verification.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthSplitShell
      title="Reset password"
      description="Verify with email or phone, then choose a new password."
      leftDescription=""
    >
      <Suspense
        fallback={<p className="font-body text-sm text-black/50">Loading…</p>}
      >
        <ForgotPasswordForm />
      </Suspense>
    </AuthSplitShell>
  );
}
