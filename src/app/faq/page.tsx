import FaqAccordion from "@/components/FaqAccordion";
import { SupportShell } from "@/components/SupportShell";
import { listPublishedFaqs } from "@/lib/faqs";

export const metadata = {
  title: "FAQ · UMAXES",
  description: "Frequently asked questions about UMAXES and HOOKAMAX.",
};

export default async function FaqPage() {
  const items = await listPublishedFaqs();

  return (
    <SupportShell
      eyebrow="FAQ"
      title="Common"
      titleAccent=" questions."
      description="Age, shipping, returns, and contact — short answers for adult customers."
    >
      <FaqAccordion items={items} />
    </SupportShell>
  );
}
