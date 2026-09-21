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
  spot: string;
}[] = [
  {
    label: "Puffs",
    value: "Up to 80K",
    detail: "Long session life",
    icon: Wind,
    spot: "left-[2%] top-[14%] sm:left-[4%] sm:top-[16%] lg:left-0 lg:top-[18%]",
  },
  {
    label: "Battery",
    value: "1600mAh",
    detail: "Rechargeable power",
    icon: BatteryCharging,
    spot: "right-[1%] top-[22%] sm:right-[3%] sm:top-[20%] lg:right-0 lg:top-[22%]",
  },
  {
    label: "Lights",
    value: "ARGB",
    detail: "Full-spectrum glow",
    icon: Lightbulb,
    spot: "left-[4%] bottom-[18%] sm:left-[6%] sm:bottom-[16%] lg:left-2 lg:bottom-[18%]",
  },
  {
    label: "Draw",
    value: "MTL & DTL",
    detail: "Your style, either way",
    icon: ArrowLeftRight,
    spot: "right-[2%] bottom-[14%] sm:right-[4%] sm:bottom-[14%] lg:right-1 lg:bottom-[16%]",
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
        className="pointer-events-none absolute -top-20 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-umx-cream-deep/50 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)] lg:gap-12 xl:gap-16">
        {/* Left — larger devices + floating info pills */}
        <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[36rem] lg:max-w-none lg:min-h-[40rem] lg:aspect-auto">
            <Image
              src={product.deviceDuoImage}
              alt="UMAXES HookaMax 80K disposable hookah devices"
              fill
              priority
              quality={100}
              sizes="(max-width: 1024px) 95vw, 720px"
              className="object-contain object-center drop-shadow-[0_24px_48px_rgba(0,0,0,0.12)]"
            />

            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`absolute z-10 max-w-[11.5rem] sm:max-w-[13rem] ${item.spot}`}
                >
                  <div className="flex items-start gap-2.5 rounded-2xl border border-black/8 bg-umx-cream-warm/95 px-3 py-2.5 shadow-[0_14px_32px_rgba(61,22,5,0.1)] ring-1 ring-white/60 backdrop-blur-sm sm:gap-3 sm:px-3.5 sm:py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-umx-cream sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-[0.58rem] font-semibold tracking-[0.14em] text-black/40 uppercase">
                        {item.label}
                      </p>
                      <p className="mt-0.5 font-display text-sm font-bold tracking-tight text-black sm:text-[0.95rem]">
                        {item.value}
                      </p>
                      <p className="mt-0.5 font-body text-[0.68rem] leading-snug text-black/55 sm:text-xs">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — Introduction box + 80K watermark */}
        <div className="relative min-w-0">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-4 right-0 select-none font-display text-[clamp(6rem,18vw,10rem)] font-extrabold leading-none tracking-[-0.07em] text-umx-orange/[0.12] sm:-top-6 sm:right-2"
          >
            80K
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-black/8 bg-umx-cream-warm px-6 py-7 shadow-[0_22px_55px_rgba(61,22,5,0.08)] sm:px-8 sm:py-9 lg:px-9 lg:py-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-umx-orange" aria-hidden />
              <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase sm:text-sm">
                Introduction
              </p>
            </div>

            <h2
              id="product-intro-heading"
              className="mt-4 max-w-[16ch] font-display text-[clamp(1.45rem,2.8vw,2.05rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-black"
            >
              Umaxes HookaMax
              <span className="mt-1 block font-bold text-black/55">
                Disposable Vape
              </span>
            </h2>

            <div className="mt-5 space-y-3.5 font-body text-base leading-relaxed text-black/65 sm:mt-6 sm:text-lg">
              <p>
                Umaxes HookaMax 80k Disposable Vape is a disposable vape with at
                most{" "}
                <strong className="font-semibold text-black">80K puffs</strong>{" "}
                and a{" "}
                <strong className="font-semibold text-black">1600mAh</strong>{" "}
                internal battery. The Umaxes HookaMax hookah vape is, so far,
                the best vape that Umaxes offers.
              </p>
              <p>
                It features a built-in 1600mAh battery for extended use. Umaxes
                offers sufficient vape juice to make HookaMax satisfy up to 80K
                puffs. Moreover, you can turn on the{" "}
                <strong className="font-semibold text-black">ARGB light</strong>{" "}
                to add full-spectrum fun of light effects to your vaping. You
                can enjoy both{" "}
                <strong className="font-semibold text-black">MTL and DTL</strong>{" "}
                with Umaxes HookaMax 80K.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
