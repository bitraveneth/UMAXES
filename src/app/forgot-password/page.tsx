import { Suspense } from "react";
import AuthSplitShell from "@/components/AuthSplitShell";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = {
  title: "Reset password · UMAXES",
  description: "Reset your UMAXES password using phone verification.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthSplitShell
      title="Reset password"
      description="Use your mobile phone to receive a verification code, then set a new password."
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
