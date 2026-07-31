import { Suspense } from "react";
import AuthSplitShell from "@/components/AuthSplitShell";
import LoginForm from "@/components/LoginForm";
import DemoAccountsLeftCard from "@/components/DemoAccountsLeftCard";

export const metadata = {
  title: "Sign in · UMAXES",
  description: "Sign in to your UMAXES wholesale account.",
};

export default function LoginPage() {
  return (
    <AuthSplitShell
      eyebrow="UMAXES member"
      title="Welcome back"
      description="Sign in with email or phone to continue ordering."
      leftDescription="Sign in to order HOOKAMAX, manage addresses, and track fulfillment — adults 21+ only."
      leftTop={
        <Suspense fallback={null}>
          <DemoAccountsLeftCard />
        </Suspense>
      }
    >
      <Suspense
        fallback={<p className="font-body text-sm text-black/50">Loading…</p>}
      >
        <LoginForm />
      </Suspense>
    </AuthSplitShell>
  );
}
