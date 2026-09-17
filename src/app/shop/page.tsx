import type { Metadata } from "next";
import AgeGate from "@/components/AgeGate";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ShopCatalog from "@/components/ShopCatalog";
import { requireMember } from "@/lib/require-member";

export const metadata: Metadata = {
  title: "UMAXES Shop",
  description:
    "HOOKAMAX flavors — browse the catalog. Adults 21+. Nicotine is an addictive chemical.",
};

export default async function ShopPage() {
  await requireMember("/shop");

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
