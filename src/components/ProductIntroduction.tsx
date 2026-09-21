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
  /** Where the pointer aims on the device */
  pin: string;
  /** Connector line side */
  line: string;
}[] = [
  {
    label: "Draw",
    value: "MTL & DTL",
    detail: "Your style, either way",
    icon: ArrowLeftRight,
    spot: "left-1/2 top-[2%] z-20 -translate-x-1/2 sm:top-[3%]",
    delay: "delay-0",
    pin: "left-1/2 top-[18%] -translate-x-1/2",
    line: "left-1/2 top-[calc(2%+4.1rem)] h-[calc(16%-4.1rem)] w-px -translate-x-1/2 sm:top-[calc(3%+4.25rem)]",
  },
  {
    label: "Puffs",
    value: "Up to 80K",
    detail: "Long session life",
    icon: Wind,
    spot: "left-[1%] top-[38%] sm:left-[2%] lg:left-0",
    delay: "delay-75",
    pin: "left-[38%] top-[42%]",
    line: "left-[min(11.5rem,42%)] top-[calc(38%+2.2rem)] h-px w-[calc(38%-min(11.5rem,42%))] sm:left-[min(13rem,42%)]",
  },
  {
    label: "Lights",
    value: "ARGB",
    detail: "Full-spectrum glow",
    icon: Lightbulb,
    spot: "right-[1%] top-[38%] sm:right-[2%] lg:right-0",
    delay: "delay-100",
    pin: "right-[38%] top-[42%]",
    line: "right-[min(11.5rem,42%)] top-[calc(38%+2.2rem)] h-px w-[calc(38%-min(11.5rem,42%))] sm:right-[min(13rem,42%)]",
  },
  {
    label: "Battery",
    value: "1600mAh",
    detail: "Rechargeable power",
    icon: BatteryCharging,
    spot: "bottom-[2%] left-1/2 z-20 -translate-x-1/2 sm:bottom-[3%]",
    delay: "delay-150",
    pin: "left-1/2 bottom-[20%] -translate-x-1/2",
    line: "left-1/2 bottom-[calc(2%+4.1rem)] h-[calc(18%-4.1rem)] w-px -translate-x-1/2 sm:bottom-[calc(3%+4.25rem)]",
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
        {/* Left — devices; pills + pointers on hover */}
        <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div className="group relative mx-auto aspect-[4/5] w-full max-w-[36rem] outline-none lg:max-w-none lg:min-h-[42rem] lg:aspect-auto">
            <Image
              src={product.deviceDuoImage}
              alt="UMAXES HookaMax 80K disposable hookah devices"
              fill
              priority
              quality={100}
              sizes="(max-width: 1024px) 95vw, 720px"
              className="object-contain object-center drop-shadow-[0_24px_48px_rgba(0,0,0,0.12)] transition duration-500 ease-out group-hover:scale-[1.01]"
            />

            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="contents">
                  {/* Aim pin on device */}
                  <span
                    aria-hidden
                    className={`absolute z-[5] opacity-100 transition duration-500 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 ${item.pin} ${item.delay}`}
                  >
                    <span className="product-intro-pin block h-2.5 w-2.5 rounded-full bg-umx-orange" />
                  </span>
                  {/* Connector */}
                  <span
                    aria-hidden
                    className={`product-intro-line absolute z-[4] bg-umx-orange/45 opacity-100 transition duration-500 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 ${item.line} ${item.delay}`}
                  />
                  {/* Pill */}
                  <div
                    className={`pointer-events-none absolute z-10 max-w-[12rem] sm:max-w-[13.5rem] ${item.spot}`}
                  >
                    <div
                      className={`flex translate-y-2 items-start gap-2.5 rounded-2xl border border-black/8 bg-umx-cream-warm/95 px-3 py-2.5 opacity-100 shadow-[0_14px_32px_rgba(61,22,5,0.1)] ring-1 ring-white/70 backdrop-blur-sm transition duration-500 ease-out sm:gap-3 sm:px-3.5 sm:py-3 lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100 ${item.delay}`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-umx-cream sm:h-10 sm:w-10">
                        <Icon
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </div>
                      <div className="min-w-0 text-left">
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
                </div>
              );
            })}

            <p className="pointer-events-none absolute inset-x-0 bottom-1 hidden text-center font-display text-[0.65rem] font-semibold tracking-[0.16em] text-black/30 uppercase transition duration-300 lg:block lg:opacity-70 lg:group-hover:opacity-0">
              Hover for specs
            </p>
          </div>
        </div>

        {/* Right — Introduction box + restored soft 80K */}
        <div className="relative min-w-0">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-6 right-2 select-none font-display text-[clamp(5rem,14vw,8.5rem)] font-extrabold leading-none tracking-[-0.06em] text-black/[0.04] sm:-top-8 sm:right-4"
          >
            80K
          </div>

          <div className="relative rounded-[1.75rem] border border-black/8 bg-umx-cream-warm/90 px-6 py-7 shadow-[0_22px_55px_rgba(61,22,5,0.08)] backdrop-blur-[2px] sm:px-8 sm:py-9 lg:px-9 lg:py-10">
            <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase sm:text-sm">
              Introduction
            </p>
            <h2
              id="product-intro-heading"
              className="mt-3 font-display text-[clamp(1.85rem,4vw,2.85rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-black"
            >
              Umaxes HookaMax 80k
            </h2>
            <p className="mt-2 font-display text-base font-semibold tracking-tight text-black/50 sm:text-lg">
              Disposable Hookah
            </p>

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
