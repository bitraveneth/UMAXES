import type { Metadata } from "next";
import AgeGate from "@/components/AgeGate";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ShopCatalog from "@/components/ShopCatalog";

export const metadata: Metadata = {
  title: "UMAXES Shop",
  description:
    "Shop HOOKAMAX flavors online. Filter by profile and price. For adults 21+. Nicotine is an addictive chemical.",
};

export default function ShopPage() {
  return (
    <>
      <AgeGate />
      <Header />
      <main className="flex-1">
        <ShopCatalog />
      </main>
      <Footer />
    </>
  );
}
