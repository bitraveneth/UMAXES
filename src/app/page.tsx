import AgeGate from "@/components/AgeGate";
import BrandFilm from "@/components/BrandFilm";
import Features from "@/components/Features";
import About from "@/components/About";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HeroFilmBand from "@/components/HeroFilmBand";
import HeroProgress from "@/components/HeroProgress";
import NewsEvents from "@/components/NewsEvents";
import ProductShowcase from "@/components/ProductShowcase";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <>
      <AgeGate />
      {/* Client: video ABOVE menu, image banner BELOW.
          Swap <HeroFilmBand /> and <HeroProgress /> if the banner feels grander on top. */}
      <HeroFilmBand />
      <Header />
      <main className="flex-1">
        <HeroProgress />
        <ProductShowcase />
        <BrandFilm />
        <Features />
        <About />
        <NewsEvents />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
