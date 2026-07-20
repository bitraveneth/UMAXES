import AgeGate from "@/components/AgeGate";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HeroProgress from "@/components/HeroProgress";
import NewsEvents from "@/components/NewsEvents";
import ProductShowcase from "@/components/ProductShowcase";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <>
      <AgeGate />
      <Header />
      <main className="flex-1">
        <HeroProgress />
        <ProductShowcase />
        <Features />
        <NewsEvents />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
