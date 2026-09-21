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
  delay: string;
  enter: string;
}[] = [
  {
    label: "Puffs",
    value: "Up to 80K",
    detail: "Long session life",
    icon: Wind,
    spot: "left-[2%] top-[14%] sm:left-[4%] sm:top-[16%] lg:left-0 lg:top-[18%]",
    delay: "delay-0",
    enter:
      "lg:[@media(hover:hover)]:-translate-x-3 lg:[@media(hover:hover)]:group-hover:translate-x-0",
  },
  {
    label: "Battery",
    value: "1600mAh",
    detail: "Rechargeable power",
    icon: BatteryCharging,
    spot: "right-[1%] top-[22%] sm:right-[3%] sm:top-[20%] lg:right-0 lg:top-[22%]",
    delay: "delay-75",
    enter:
      "lg:[@media(hover:hover)]:translate-x-3 lg:[@media(hover:hover)]:group-hover:translate-x-0",
  },
  {
    label: "Lights",
    value: "ARGB",
    detail: "Full-spectrum glow",
    icon: Lightbulb,
    spot: "left-[4%] bottom-[18%] sm:left-[6%] sm:bottom-[16%] lg:left-2 lg:bottom-[18%]",
    delay: "delay-100",
    enter:
      "lg:[@media(hover:hover)]:-translate-x-3 lg:[@media(hover:hover)]:group-hover:translate-x-0",
  },
  {
    label: "Draw",
    value: "MTL & DTL",
    detail: "Your style, either way",
    icon: ArrowLeftRight,
    spot: "right-[2%] bottom-[14%] sm:right-[4%] sm:bottom-[14%] lg:right-1 lg:bottom-[16%]",
    delay: "delay-150",
    enter:
      "lg:[@media(hover:hover)]:translate-x-3 lg:[@media(hover:hover)]:group-hover:translate-x-0",
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
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 bottom-8 h-64 w-64 rounded-full bg-umx-orange-wash/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1400px]">
        <header className="mx-auto mb-12 max-w-4xl text-center sm:mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-3">
            <span className="h-px w-10 bg-umx-orange sm:w-14" aria-hidden />
            <p className="font-display text-xs font-semibold tracking-[0.24em] text-umx-orange uppercase sm:text-sm">
              Introduction
            </p>
            <span className="h-px w-10 bg-umx-orange sm:w-14" aria-hidden />
          </div>

          <h2
            id="product-intro-heading"
            className="mt-5 font-display text-[clamp(2.35rem,6.5vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black"
          >
            Umaxes HookaMax
            <span className="mt-2 block text-[0.72em] font-bold tracking-[-0.03em] text-umx-orange sm:mt-3">
              Disposable Vape
            </span>
          </h2>
        </header>

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          {/* Left — devices; pills hover-reveal on fine pointers only */}
          <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
            <div
              className="group relative mx-auto aspect-[4/5] w-full max-w-[36rem] outline-none lg:max-w-none lg:min-h-[40rem] lg:aspect-auto"
              tabIndex={0}
            >
              <Image
                src={product.deviceDuoImage}
                alt="UMAXES HookaMax 80K disposable hookah devices"
                fill
                priority
                quality={100}
                sizes="(max-width: 1024px) 95vw, 640px"
                className="object-contain object-center drop-shadow-[0_24px_48px_rgba(0,0,0,0.12)] transition duration-500 ease-out motion-safe:group-hover:scale-[1.015]"
              />

              {HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`pointer-events-none absolute z-10 max-w-[11.5rem] sm:max-w-[13rem] ${item.spot}`}
                  >
                    <div
                      className={`flex items-start gap-2.5 rounded-2xl border border-black/8 bg-umx-cream-warm/95 px-3 py-2.5 opacity-100 shadow-[0_14px_32px_rgba(61,22,5,0.1)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-500 ease-out sm:gap-3 sm:px-3.5 sm:py-3 lg:[@media(hover:hover)]:opacity-0 lg:[@media(hover:hover)]:group-hover:opacity-100 lg:[@media(hover:hover)]:group-focus-within:opacity-100 lg:[@media(hover:hover)]:group-focus-within:translate-x-0 ${item.enter} ${item.delay}`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-umx-cream sm:h-10 sm:w-10">
                        <Icon
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          strokeWidth={1.75}
                          aria-hidden
                        />
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

              <p className="pointer-events-none absolute inset-x-0 bottom-2 hidden text-center font-display text-[0.65rem] font-semibold tracking-[0.16em] text-black/35 uppercase transition duration-300 lg:[@media(hover:hover)]:block lg:[@media(hover:hover)]:opacity-70 lg:[@media(hover:hover)]:group-hover:opacity-0 lg:[@media(hover:hover)]:group-focus-within:opacity-0">
                Hover for specs
              </p>
            </div>
          </div>

          {/* Right — 80K watermark + body card */}
          <div className="relative min-w-0 pt-[4.5rem] sm:pt-24 lg:pt-28">
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 select-none font-display text-[clamp(5.75rem,16vw,10rem)] font-extrabold leading-[0.82] tracking-[-0.07em] text-black/[0.07] sm:right-1"
            >
              80K
            </div>

            <div className="relative rounded-[1.75rem] border border-black/8 bg-umx-cream-warm px-6 py-7 shadow-[0_22px_55px_rgba(61,22,5,0.08)] sm:px-8 sm:py-9 lg:px-9 lg:py-10">
              <div className="space-y-3.5 font-body text-base leading-relaxed text-black/65 sm:text-lg">
                <p>
                  Umaxes HookaMax 80k Disposable Vape is a disposable vape with
                  at most{" "}
                  <strong className="font-semibold text-black">80K puffs</strong>{" "}
                  and a{" "}
                  <strong className="font-semibold text-black">1600mAh</strong>{" "}
                  internal battery. The Umaxes HookaMax hookah vape is, so far,
                  the best vape that Umaxes offers.
                </p>
                <p>
                  It features a built-in 1600mAh battery for extended use.
                  Umaxes offers sufficient vape juice to make HookaMax satisfy
                  up to 80K puffs. Moreover, you can turn on the{" "}
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
      </div>
    </section>
  );
}
