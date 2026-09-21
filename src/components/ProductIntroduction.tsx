import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BatteryCharging,
  Lightbulb,
  Wind,
} from "lucide-react";
import { product } from "@/lib/assets";

const HIGHLIGHTS: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}[] = [
  {
    label: "Puffs",
    value: "Up to 80K",
    detail: "Long session life",
    icon: Wind,
  },
  {
    label: "Battery",
    value: "1600mAh",
    detail: "Rechargeable power",
    icon: BatteryCharging,
  },
  {
    label: "Lights",
    value: "ARGB",
    detail: "Full-spectrum glow",
    icon: Lightbulb,
  },
  {
    label: "Draw",
    value: "MTL & DTL",
    detail: "Your style, either way",
    icon: ArrowLeftRight,
  },
];

export default function ProductIntroduction() {
  return (
    <section
      id="introduction"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="product-intro-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-[-6%] h-80 w-80 rounded-full bg-umx-cream-deep/55 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-umx-orange-wash/70 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
        {/* Left — device stage */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="relative overflow-hidden rounded-[2rem] border border-black/8 bg-gradient-to-b from-umx-cream-bright via-umx-cream-warm to-umx-cream shadow-[0_28px_60px_rgba(61,22,5,0.1)]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.7),transparent_58%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-[46%] rounded-full border border-black/6"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 h-[52%] w-[52%] -translate-x-1/2 -translate-y-[46%] rounded-full border border-black/5"
            />

            <div className="relative aspect-[4/5] w-full sm:aspect-[3/4] lg:min-h-[34rem] lg:aspect-auto">
              <Image
                src={product.deviceDuoImage}
                alt="UMAXES HookaMax 80K disposable hookah devices"
                fill
                priority
                quality={100}
                sizes="(max-width: 1024px) 90vw, 560px"
                className="product-intro-device object-contain object-center p-6 sm:p-8 lg:p-10 drop-shadow-[0_28px_50px_rgba(0,0,0,0.16)]"
              />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-umx-cream-warm/90 to-transparent" />

            <div className="absolute top-5 left-5 sm:top-6 sm:left-6">
              <span className="inline-flex items-center rounded-full bg-black px-3.5 py-1.5 font-display text-[0.65rem] font-bold tracking-[0.16em] text-umx-cream uppercase shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                Flagship 80K
              </span>
            </div>
            <div className="absolute right-5 bottom-5 sm:right-6 sm:bottom-6">
              <span className="inline-flex items-center rounded-full border border-black/10 bg-umx-cream-bright/90 px-3.5 py-1.5 font-display text-[0.65rem] font-semibold tracking-[0.14em] text-black/70 uppercase backdrop-blur-sm">
                ARGB · MTL & DTL
              </span>
            </div>
          </div>
        </div>

        {/* Right — editorial copy */}
        <div className="relative min-w-0">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-8 right-0 select-none font-display text-[clamp(5rem,14vw,8.5rem)] font-extrabold leading-none tracking-[-0.06em] text-black/[0.045]"
          >
            80K
          </div>

          <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase sm:text-sm">
            Introduction
          </p>
          <h2
            id="product-intro-heading"
            className="mt-4 max-w-xl font-display text-[clamp(2.1rem,5vw,3.4rem)] font-extrabold leading-[0.98] tracking-[-0.035em] text-black"
          >
            Umaxes HookaMax
            <span className="text-umx-orange"> 80k</span>
          </h2>
          <p className="mt-3 font-display text-lg font-semibold tracking-tight text-black/50 sm:text-xl">
            Disposable Hookah
          </p>

          <div className="mt-2 h-1 w-14 rounded-full bg-umx-orange" />

          <div className="mt-6 max-w-xl space-y-4 font-body text-base leading-relaxed text-black/65 sm:mt-7 sm:text-lg">
            <p>
              Umaxes HookaMax 80k Disposable Vape is a disposable vape with at
              most{" "}
              <strong className="font-semibold text-black">80K puffs</strong> and
              a{" "}
              <strong className="font-semibold text-black">1600mAh</strong>{" "}
              internal battery. The Umaxes HookaMax hookah vape is, so far, the
              best vape that Umaxes offers.
            </p>
            <p>
              It features a built-in 1600mAh battery for extended use. Umaxes
              offers sufficient vape juice to make HookaMax satisfy up to 80K
              puffs. Moreover, you can turn on the{" "}
              <strong className="font-semibold text-black">ARGB light</strong> to
              add full-spectrum fun of light effects to your vaping. You can
              enjoy both{" "}
              <strong className="font-semibold text-black">MTL and DTL</strong>{" "}
              with Umaxes HookaMax 80K.
            </p>
          </div>

          <ul className="mt-8 grid gap-3 sm:mt-9 sm:grid-cols-2">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <div className="group flex h-full items-start gap-3.5 rounded-[1.25rem] border border-black/8 bg-umx-cream-warm px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.04)] transition duration-300 ease-out hover:-translate-y-0.5 hover:border-black/14 hover:bg-umx-cream-bright hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] sm:px-4.5 sm:py-4.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/6 text-black ring-1 ring-black/10 transition duration-300 ease-out group-hover:bg-black group-hover:text-umx-cream group-hover:ring-black">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="font-display text-[0.62rem] font-semibold tracking-[0.14em] text-black/40 uppercase">
                        {item.label}
                      </p>
                      <p className="mt-0.5 font-display text-base font-bold tracking-tight text-black">
                        {item.value}
                      </p>
                      <p className="mt-0.5 font-body text-xs text-black/50">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
