import FaqAccordion from "@/components/FaqAccordion";
import { SupportShell } from "@/components/SupportShell";

export const metadata = {
  title: "FAQ · UMAXES",
  description: "Frequently asked questions about UMAXES and HOOKAMAX.",
};

export default function FaqPage() {
  return (
    <SupportShell
      eyebrow="FAQ"
      title="Common"
      titleAccent=" questions."
      description="Age, authenticity, specs, shipping, and returns — short answers for adult customers."
    >
      <FaqAccordion />
    </SupportShell>
  );
}
