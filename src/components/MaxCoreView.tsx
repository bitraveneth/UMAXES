import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Cloud, Sparkles, Thermometer, Wind } from "lucide-react";

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
      <header className="mx-auto max-w-[1560px] px-5 pb-20 sm:px-8 sm:pb-24 lg:pb-28">
        <div className="flex flex-col gap-8 sm:gap-10 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] lg:items-center lg:gap-12 xl:gap-16">
          <div className="min-w-0 max-w-md lg:max-w-none">
            <p className="flex items-center gap-3 font-display text-[0.68rem] font-semibold tracking-[0.32em] text-black/45 uppercase">
              <span className="h-px w-8 shrink-0 bg-black/40" aria-hidden />
              Mesh coil
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.85rem,3.6vw,4rem)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              MaxCore™
            </h1>
            <p className="mt-5 font-display text-[clamp(1.2rem,1.45vw,1.5rem)] font-semibold leading-snug tracking-[-0.02em]">
              Even heat. Richer flavor.
            </p>
            <p className="mt-4 font-body text-[0.98rem] leading-[1.75] text-black/65 sm:text-base">
              The mesh heating structure inside every UMAXES device — denser
              vapor and a smoother draw from first puff to last. Adults 21+.
            </p>
          </div>

          <div className="min-w-0">
            <Image
              src="/images/maxcore/coil.webp"
              alt="Exploded MaxCore mesh coil showing the mesh layer, support structure, airflow channel, and insulating ring"
              width={1221}
              height={637}
              priority
              quality={80}
              sizes="(max-width: 1024px) 100vw, 70vw"
              className="h-auto w-full"
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
    </article>
  );
}
