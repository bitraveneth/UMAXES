import VerifyForm from "@/components/VerifyForm";
import { SupportShell } from "@/components/SupportShell";

export const metadata = {
  title: "Product verification · UMAXES",
  description: "Verify your UMAXES HOOKAMAX product authenticity.",
};

export default function VerifyPage() {
  return (
    <SupportShell
      eyebrow="Product verification"
      title="Confirm it’s"
      titleAccent=" authentic."
      description="Enter the code from your packaging or device scratch panel. Only adults 21+ should purchase and use UMAXES products."
    >
      <VerifyForm />
      <p className="mt-6 font-body text-sm text-black/50">
        Having trouble?{" "}
        <a
          href="/contact"
          className="font-display font-semibold text-umx-orange hover:underline"
        >
          Contact support
        </a>{" "}
        with a photo of your code panel.
      </p>
    </SupportShell>
  );
}
