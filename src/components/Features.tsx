"use client";

import type { LucideIcon } from "lucide-react";
import { Cloud, Grid3x3, Sparkles, Target, Thermometer, Wind } from "lucide-react";

const reasons: {
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    title: "MaxCore™",
    body: "Proprietary mesh coil technology at the heart of every UMAXES experience — smoother, richer, and more consistent from first puff to last.",
    icon: Grid3x3,
  },
  {
    title: "Consistent heating",
    body: "The mesh heating structure distributes heat more evenly across the coil surface for a stable, consistent vaping experience.",
    icon: Thermometer,
  },
  {
    title: "Richer flavor",
    body: "A more consistent heating process helps preserve the character of carefully developed e-liquid flavors — fuller taste, every draw.",
    icon: Sparkles,
  },
  {
    title: "Dense vapor",
    body: "Engineered for efficient vapor production — the satisfying cloud experience UMAXES users expect.",
    icon: Cloud,
  },
  {
    title: "Smooth experience",
    body: "Balanced heating and airflow work together for a smoother draw and a more refined overall vaping experience.",
    icon: Wind,
  },
  {
    title: "80K puffs",
    body: "Rated up to 80K puffs. Flavor. Vapor. Consistency — MaxCore™ is built so every puff counts.",
    icon: Target,
  },
];

function WhyUmaxes() {
  return (
    <div className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute top-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-umx-orange/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1100px]">
        <header className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
            Why UMAXES
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,6vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            Not another
            <span className="text-umx-orange"> disposable.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-body text-base leading-relaxed text-black/65 sm:text-lg">
            Hookah-inspired flavor, mythic design, and specs that actually
            matter — crafted for adults who notice the difference.
          </p>
        </header>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {reasons.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="group relative flex flex-col items-center overflow-hidden rounded-[1.5rem] border border-white/90 bg-gradient-to-b from-white via-white to-[#fffaf0] px-6 py-8 text-center shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_12px_36px_rgba(61,22,5,0.08)] ring-1 ring-black/6 transition duration-500 hover:-translate-y-1.5 hover:border-umx-orange/35 hover:shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_22px_50px_rgba(61,22,5,0.12)] hover:ring-umx-orange/25 sm:px-7 sm:py-9"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-8 left-1/2 h-24 w-[70%] -translate-x-1/2 rounded-full bg-white/80 blur-2xl"
                />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-umx-orange/10 text-umx-orange ring-1 ring-umx-orange/15 transition duration-500 group-hover:bg-umx-orange group-hover:text-white group-hover:ring-umx-orange group-hover:shadow-[0_10px_24px_rgba(255,91,4,0.35)]">
                  <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="relative mt-5 font-display text-xl font-bold tracking-tight text-black">
                  {item.title}
                </h3>
                <p className="relative mt-2 max-w-xs font-body text-sm leading-relaxed text-black/60 sm:text-base">
                  {item.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-white">
      <WhyUmaxes />
    </section>
  );
}
