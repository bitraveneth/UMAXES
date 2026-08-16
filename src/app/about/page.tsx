import AgeGate from "@/components/AgeGate";
import AboutView from "@/components/AboutView";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata = {
  title: "About UMAXES · Company Profile",
  description:
    "UMAXES — MAX YOUR EXPERIENCE. Distinctive design, richer flavor, and stronger performance for adult consumers 21+.",
};

export default function AboutPage() {
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
