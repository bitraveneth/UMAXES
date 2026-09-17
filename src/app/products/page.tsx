import type { Metadata } from "next";
import AgeGate from "@/components/AgeGate";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductStoryImages from "@/components/ProductStoryImages";
import { requireMember } from "@/lib/require-member";

export const metadata: Metadata = {
  title: "Products — UMAXES",
  description:
    "HOOKAMAX product details. Adults 21+. Nicotine is an addictive chemical.",
};

export default async function ProductsPage() {
  await requireMember("/products");

  return (
    <>
      <AgeGate />
      <Header />
      <main className="flex-1 bg-umx-cream">
        <ProductStoryImages />
      </main>
      <Footer />
    </>
  );
}
