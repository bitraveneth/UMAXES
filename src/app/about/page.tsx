import AgeGate from "@/components/AgeGate";
import AboutView from "@/components/AboutView";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { requireMember } from "@/lib/require-member";

export const metadata = {
  title: "About UMAXES · Company Profile",
  description:
    "UMAXES — MAX YOUR EXPERIENCE. Distinctive design, richer flavor, and stronger performance for adult consumers 21+.",
};

export default async function AboutPage() {
  await requireMember("/about");

  return (
    <>
      <AgeGate />
      <Header />
      <main className="flex-1 bg-umx-cream">
        <AboutView />
      </main>
      <Footer />
    </>
  );
}
