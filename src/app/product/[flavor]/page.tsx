import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AgeGate from "@/components/AgeGate";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Features from "@/components/Features";
import ProductDetail from "@/components/ProductDetail";
import ProductFlavorLineup from "@/components/ProductFlavorLineup";
import ProductIntroduction from "@/components/ProductIntroduction";
import ProductKeyFeatures from "@/components/ProductKeyFeatures";
import ProductPackageList from "@/components/ProductPackageList";
import { flavors, getFlavor, product } from "@/lib/assets";
import { requireMember } from "@/lib/require-member";

type Props = {
  params: Promise<{ flavor: string }>;
};

export function generateStaticParams() {
  return flavors.map((f) => ({ flavor: f.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { flavor: id } = await params;
  const flavor = getFlavor(id);
  if (!flavor) return { title: "Product — UMAXES" };
  return {
    title: `${flavor.name} — ${product.name} | UMAXES`,
    description: flavor.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { flavor: id } = await params;
  await requireMember(`/product/${id}`);
  const flavor = getFlavor(id);
  if (!flavor) notFound();

  return (
    <>
      <AgeGate />
      <Header />
      <main className="flex-1">
        <ProductDetail flavor={flavor} />
        <ProductIntroduction />
        <ProductKeyFeatures flavor={flavor} />
        <ProductPackageList flavor={flavor} />
        <Features />
        <ProductFlavorLineup flavor={flavor} />
      </main>
      <Footer />
    </>
  );
}
