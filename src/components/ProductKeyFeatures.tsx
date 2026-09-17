import Image from "next/image";
import { product } from "@/lib/assets";
import { hookamaxIntro } from "@/lib/hookamax-copy";

export default function ProductKeyFeatures() {
  return (
    <section
      id="introduction"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
      aria-label="HOOKAMAX introduction"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-umx-cream-deep/50 blur-3xl"
      />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="relative min-h-0">
            <div className="h-full overflow-hidden rounded-[1.75rem] shadow-[0_22px_55px_rgba(61,22,5,0.12)] ring-1 ring-black/5">
              <div className="relative aspect-[4/5] w-full lg:aspect-auto lg:h-full lg:min-h-[560px]">
                <Image
                  src={product.featuresHero}
                  alt="UMAXES HOOKAMAX 80K disposable vape"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase sm:text-sm">
              {hookamaxIntro.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-black">
              {hookamaxIntro.title}
              <span className="text-umx-orange">{hookamaxIntro.titleAccent}</span>
            </h2>
            <p className="mt-3 font-display text-sm font-semibold tracking-[0.04em] text-black/55 sm:text-base">
              {hookamaxIntro.kicker}
            </p>
            <div className="mt-6 space-y-4">
              {hookamaxIntro.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className="font-body text-base leading-relaxed text-black/65 sm:text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
