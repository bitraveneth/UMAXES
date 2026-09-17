import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BatteryCharging,
  Droplets,
  Gauge,
  Grid3x3,
  Leaf,
  Lightbulb,
  Plug,
  Power,
  Sparkles,
  Wind,
} from "lucide-react";
import { productSpecs, type Flavor } from "@/lib/assets";

const iconMap: Record<(typeof productSpecs)[number]["icon"], LucideIcon> = {
  sparkles: Sparkles,
  drop: Droplets,
  battery: BatteryCharging,
  light: Lightbulb,
  puffs: Wind,
  indicator: Gauge,
  mesh: Grid3x3,
  airflow: ArrowLeftRight,
  nicotine: Leaf,
  usb: Plug,
  draw: Power,
};

export default function ProductKeyFeatures({ flavor }: { flavor: Flavor }) {
  return (
    <section
      id="key-features"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
      aria-label="Product key features"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-umx-cream-deep/50 blur-3xl"
      />
      <div className="relative mx-auto max-w-[1200px]">
        <header className="mb-14 max-w-2xl sm:mb-16">
          <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase sm:text-sm">
            Specs that matter
          </p>
          <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-black">
            Key features
          </h2>
          <p className="mt-4 font-body text-base text-black/60 sm:text-lg">
            Everything packed into HOOKAMAX 80K — power, capacity, and control
            in one device.
          </p>
        </header>

        <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="relative min-h-0">
            <div className="h-full overflow-hidden rounded-[1.75rem] bg-umx-cream-warm shadow-[0_22px_55px_rgba(61,22,5,0.12)] ring-1 ring-black/5">
              <div
                className="relative aspect-[4/5] w-full lg:aspect-auto lg:h-full lg:min-h-[680px]"
                style={{ backgroundColor: `${flavor.accent}14` }}
              >
                <Image
                  src={flavor.packageImage}
                  alt={`${flavor.name} HOOKAMAX package`}
                  fill
                  className="object-contain object-center p-6 sm:p-8"
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <ul className="divide-y divide-black/8 overflow-hidden rounded-[1.5rem] border border-black/8 bg-umx-cream-warm shadow-[0_14px_40px_rgba(0,0,0,0.06)]">
              {productSpecs.map((spec, i) => {
                const Icon = iconMap[spec.icon];
                return (
                  <li key={spec.id}>
                    <div className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 transition duration-300 ease-out hover:bg-black/[0.035] sm:gap-5 sm:px-6 sm:py-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/6 text-black ring-1 ring-black/10 transition duration-300 ease-out group-hover:bg-black group-hover:text-umx-cream group-hover:ring-black sm:h-14 sm:w-14">
                        <Icon
                          className="h-5 w-5 sm:h-6 sm:w-6"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-display text-[0.65rem] font-semibold tracking-[0.14em] text-black/40 uppercase">
                          {spec.label}
                        </p>
                        <p className="mt-1 font-display text-lg font-bold tracking-tight text-black sm:text-xl">
                          {spec.value}
                        </p>
                      </div>

                      <span className="font-display text-xs font-bold tabular-nums tracking-wider text-black/15 transition duration-300 ease-out group-hover:text-black/40">
                        {String(i + 1).padStart(2, "0")}
                      </span>
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
