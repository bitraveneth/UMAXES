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
      <div className="relative mx-auto max-w-[1400px]">
        <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase sm:text-sm">
            Specs that matter
          </p>
          <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-black">
            Key features
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base text-black/60 sm:text-lg">
            Everything packed into HOOKAMAX 80K — power, capacity, and control
            in one device.
          </p>
        </header>

        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-6 xl:gap-8">
          <div
            className="relative overflow-hidden rounded-[1.75rem] shadow-[0_22px_55px_rgba(61,22,5,0.12)] ring-1 ring-black/8"
            style={{ backgroundColor: `${flavor.accent}18` }}
          >
            <div className="relative aspect-[4/5] w-full sm:aspect-[3/4] lg:aspect-auto lg:h-full lg:min-h-[46rem]">
              <Image
                src={flavor.packageImage}
                alt={`${flavor.name} HOOKAMAX package`}
                fill
                className="object-contain object-center p-3 sm:p-4 lg:p-5"
                sizes="(max-width: 1024px) 100vw, 720px"
                quality={80}
                priority
              />
            </div>
          </div>

          <div className="flex min-h-0">
            <ul className="flex w-full flex-col divide-y divide-black/8 overflow-hidden rounded-[1.75rem] border border-black/8 bg-umx-cream-warm shadow-[0_22px_55px_rgba(61,22,5,0.08)]">
              {productSpecs.map((spec, i) => {
                const Icon = iconMap[spec.icon];
                return (
                  <li key={spec.id} className="flex min-h-0 flex-1">
                    <div className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3.5 transition duration-300 ease-out hover:bg-black/[0.035] sm:gap-4 sm:px-6 sm:py-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/6 text-black ring-1 ring-black/10 transition duration-300 ease-out group-hover:bg-black group-hover:text-umx-cream group-hover:ring-black sm:h-12 sm:w-12">
                        <Icon
                          className="h-5 w-5"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-display text-[0.62rem] font-semibold tracking-[0.14em] text-black/40 uppercase">
                          {spec.label}
                        </p>
                        <p className="mt-0.5 font-display text-base font-bold tracking-tight text-black sm:text-lg">
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
