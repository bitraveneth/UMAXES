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
        className="pointer-events-none absolute top-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-umx-cream-deep/45 blur-3xl"
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
                className="group relative flex flex-col items-center overflow-hidden rounded-[1.5rem] border border-black/8 bg-umx-cream-warm px-6 py-8 text-center shadow-[0_10px_28px_rgba(0,0,0,0.05)] transition-[transform,box-shadow,border-color,background-color] duration-500 ease-out hover:-translate-y-1 hover:border-black/16 hover:bg-umx-cream-bright hover:shadow-[0_18px_40px_rgba(0,0,0,0.1)] sm:px-7 sm:py-9"
              >
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-black/6 text-black ring-1 ring-black/10 transition-[background-color,color,box-shadow,transform] duration-500 ease-out group-hover:scale-105 group-hover:bg-black group-hover:text-umx-cream group-hover:ring-black group-hover:shadow-[0_10px_22px_rgba(0,0,0,0.18)]">
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
    <section id="features" className="relative overflow-hidden bg-umx-cream">
      <WhyUmaxes />
    </section>
  );
}
