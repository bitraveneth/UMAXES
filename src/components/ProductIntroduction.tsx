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
        className="pointer-events-none absolute -top-20 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-umx-cream-deep/50 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)] lg:gap-12 xl:gap-16">
        {/* Left — larger devices, clean cream, no stage / no animation */}
        <div className="relative mx-auto flex w-full max-w-2xl items-center justify-center lg:max-w-none">
          <div className="relative aspect-[4/5] w-full max-w-[36rem] lg:max-w-none lg:min-h-[40rem] lg:aspect-auto">
            <Image
              src={product.deviceDuoImage}
              alt="UMAXES HookaMax 80K disposable hookah devices"
              fill
              priority
              quality={100}
              sizes="(max-width: 1024px) 95vw, 720px"
              className="object-contain object-center drop-shadow-[0_24px_48px_rgba(0,0,0,0.12)]"
            />
          </div>
        </div>

        {/* Right — Introduction box with title inside */}
        <div className="min-w-0">
          <div className="rounded-[1.75rem] border border-black/8 bg-umx-cream-warm px-6 py-7 shadow-[0_22px_55px_rgba(61,22,5,0.08)] sm:px-8 sm:py-9">
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

            <ul className="mt-7 grid gap-3 border-t border-black/8 pt-6 sm:grid-cols-2">
              {HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <div className="group flex h-full items-start gap-3 rounded-2xl border border-black/8 bg-umx-cream px-3.5 py-3.5 transition duration-300 ease-out hover:border-black/14 hover:bg-umx-cream-bright">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/6 text-black ring-1 ring-black/10 transition duration-300 ease-out group-hover:bg-black group-hover:text-umx-cream group-hover:ring-black">
                        <Icon
                          className="h-5 w-5"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-display text-[0.6rem] font-semibold tracking-[0.14em] text-black/40 uppercase">
                          {item.label}
                        </p>
                        <p className="mt-0.5 font-display text-sm font-bold tracking-tight text-black sm:text-base">
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
      </div>
    </section>
  );
}
