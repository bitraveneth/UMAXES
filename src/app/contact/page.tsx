import ContactForm from "@/components/ContactForm";
import { SupportShell } from "@/components/SupportShell";

export const metadata = {
  title: "Contact us · UMAXES",
  description: "Contact UMAXES support for orders, shipping, and product help.",
};

export default function ContactPage() {
  return (
    <SupportShell
      eyebrow="Contact us"
      title="Talk to"
      titleAccent=" the team."
      description="Orders, shipping, returns, or product questions — send a message and we’ll follow up within 1–2 business days."
    >
      <ContactForm />
      <p className="mt-6 font-body text-sm text-black/50">
        Or email{" "}
        <a
          href="mailto:support@umaxes.com"
          className="font-display font-semibold text-umx-orange hover:underline"
        >
          support@umaxes.com
        </a>
      </p>
    </SupportShell>
  );
}
