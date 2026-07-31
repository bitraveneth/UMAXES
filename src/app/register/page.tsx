import AuthSplitShell from "@/components/AuthSplitShell";
import RegisterForm from "@/components/RegisterForm";

export const metadata = {
  title: "Register · UMAXES",
  description: "Register for a UMAXES wholesale account.",
};

export default function RegisterPage() {
  return (
    <AuthSplitShell
      title="Create account"
      description="Choose email or phone to register. An admin will review your account before you can order."
      leftDescription="Register for wholesale HOOKAMAX ordering — adults 21+ only. Approval required before first purchase."
    >
      <RegisterForm />
    </AuthSplitShell>
  );
}
