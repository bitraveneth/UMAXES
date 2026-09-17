import AgeGate from "@/components/AgeGate";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MaxCoreView from "@/components/MaxCoreView";
import StoreTopPad from "@/components/StoreTopPad";
import { requireMember } from "@/lib/require-member";

export const metadata = {
  title: "MaxCore™ Technology · UMAXES",
  description:
    "MaxCore™ mesh coil technology — consistent heating, richer flavor, dense vapor, and a smoother draw. Adults 21+ only.",
};

export default async function MaxCorePage() {
  await requireMember("/maxcore");

  return (
    <>
      <AgeGate />
      <Header />
      <main className="flex-1 bg-umx-cream">
        <StoreTopPad>
          <MaxCoreView />
        </StoreTopPad>
      </main>
      <Footer />
    </>
  );
}
