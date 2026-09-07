import { redirect } from "next/navigation";
import AgeGate from "@/components/AgeGate";
import BrandFilm from "@/components/BrandFilm";
import About from "@/components/About";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HeroFilmBand from "@/components/HeroFilmBand";
import HeroProgress from "@/components/HeroProgress";
import ProductShowcase from "@/components/ProductShowcase";
import Testimonials from "@/components/Testimonials";
import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";

export default async function Home() {
  const settings = await getSiteSettings();
  // Guests land on login when site access = "Sign in page".
  // Logged-in members still see the marketing homepage (e.g. Visit website).
  if (settings.homepageAsLogin) {
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }
  }

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
        <About />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
