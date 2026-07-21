import type { Metadata } from "next";
import AgeGate from "@/components/AgeGate";
import CheckoutView from "@/components/CheckoutView";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Checkout · UMAXES",
  description:
    "Checkout for UMAXES HOOKAMAX flavors. Adults 21+ only. Nicotine is an addictive chemical.",
};

export default function CheckoutPage() {
  return (
    <>
      <AgeGate />
      <Header />
      <main className="flex-1 bg-umx-cream">
        <CheckoutView />
      </main>
      <Footer />
    </>
  );
}
