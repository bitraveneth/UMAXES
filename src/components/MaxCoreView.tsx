import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Cloud, Sparkles, Thermometer, Wind } from "lucide-react";

const coreWords = [
  "Flavor",
  "Vapor",
  "Consistency",
  "Mesh",
  "Heat",
  "Smooth",
  "Density",
  "Draw",
  "Balance",
  "Experience",
] as const;

function WordMarquee({
  words,
  reverse = false,
}: {
  words: readonly string[];
  reverse?: boolean;
}) {
  const loop = [...words, ...words];
  return (
    <div className="overflow-hidden" aria-hidden>
      <div
        className={`${reverse ? "animate-word-marquee-rev" : "animate-word-marquee"} flex w-max items-center gap-6 pr-6 sm:gap-10 sm:pr-10`}
      >
        {loop.map((word, i) => (
          <span key={`${word}-${i}`} className="flex items-center gap-6 sm:gap-10">
            <span className="font-display text-[clamp(2.75rem,8vw,6.5rem)] font-extrabold leading-none tracking-[-0.05em] text-black">
              {word}
            </span>
            <span className="h-2 w-2 rotate-45 bg-black/25 sm:h-2.5 sm:w-2.5" />
          </span>
        ))}
      </div>
    </div>
  );
}

const pillars: {
  n: string;
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    n: "01",
    title: "Consistent heating",
    body: "The mesh heating structure distributes heat more evenly across the coil surface for a stable, consistent draw.",
    icon: Thermometer,
  },
  {
    n: "02",
    title: "Richer flavor",
    body: "Even heat helps preserve carefully developed e-liquid character — fuller taste from first puff to last.",
    icon: Sparkles,
  },
  {
    n: "03",
    title: "Dense vapor",
    body: "Engineered for efficient vapor production — the satisfying cloud experience UMAXES users expect.",
    icon: Cloud,
  },
  {
    n: "04",
    title: "Smooth experience",
    body: "Balanced heating and airflow work together for a smoother draw and a more refined session.",
    icon: Wind,
  },
];

export default function MaxCoreView() {
  return (
    <article className="bg-umx-cream text-black">
      <header className="mx-auto max-w-[1480px] px-5 pb-16 sm:px-8 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <p className="font-display text-[0.7rem] font-semibold tracking-[0.22em] text-black/40 uppercase">
              Mesh coil
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,5.25rem)] font-extrabold leading-[0.86] tracking-[-0.055em]">
              MaxCore™
            </h1>
            <p className="mt-5 font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Even heat. Richer flavor.
            </p>
            <p className="mt-5 max-w-md font-body text-base leading-[1.8] text-black/70 sm:text-lg">
              The mesh heating structure inside every UMAXES device — denser
              vapor and a smoother draw from first puff to last. Adults 21+.
            </p>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/10 sm:aspect-[4/3]">
            <Image
              src="/images/maxcore/mesh-coil.webp"
              alt="MaxCore mesh coil"
              fill
              priority
              className="object-contain object-center p-6 sm:p-10"
              sizes="(max-width: 1024px) 100vw, 55vw"
              quality={75}
            />
          </div>
        </div>
      </header>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center font-display text-[clamp(2.2rem,5vw,3.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
            Why MaxCore™
          </h2>
          <ul className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6">
            {pillars.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.n}
                  className="flex flex-col items-center rounded-[1.5rem] bg-white px-8 py-11 text-center shadow-[0_16px_48px_rgba(0,0,0,0.12)] ring-1 ring-black/15 sm:px-10 sm:py-12"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-umx-cream">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold tracking-tight sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-[22rem] font-body text-sm leading-relaxed text-black/70 sm:text-base">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="relative overflow-hidden py-4 sm:py-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-umx-cream to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-umx-cream to-transparent sm:w-24" />
          <div className="space-y-2 sm:space-y-3">
            <WordMarquee words={coreWords} />
            <WordMarquee
              reverse
              words={[
                "Experience",
                "Balance",
                "Draw",
                "Density",
                "Smooth",
                "Heat",
                "Mesh",
                "Consistency",
                "Vapor",
                "Flavor",
              ]}
            />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[1200px] px-5 sm:mt-12 sm:px-8">
          <div className="flex flex-col justify-between gap-8 rounded-[1.5rem] bg-black px-8 py-10 text-umx-cream sm:px-10 sm:py-12 lg:flex-row lg:items-end lg:gap-12">
            <div className="max-w-2xl">
              <h2 className="font-display text-[clamp(1.5rem,3vw,2.35rem)] font-extrabold leading-[1.12] tracking-[-0.035em]">
                MaxCore™ — powering the UMAXES experience.
              </h2>
              <p className="mt-4 font-body text-base leading-[1.75] text-umx-cream/75 sm:text-lg">
                Every part of the mesh system is built so every puff counts —
                even heat, richer flavor, and a smoother draw for adult
                consumers 21+.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex shrink-0 items-center rounded-full bg-umx-cream px-7 py-3.5 font-display text-sm font-semibold tracking-[0.12em] text-black uppercase transition hover:bg-white"
            >
              Explore products
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
