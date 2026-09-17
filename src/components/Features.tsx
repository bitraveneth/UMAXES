import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BatteryCharging,
  Cloud,
  Droplets,
  Gauge,
  Grid3x3,
  Leaf,
  Plug,
  Sparkles,
  Target,
  Wind,
  Lightbulb,
} from "lucide-react";
import { flavors, getFlavor } from "@/lib/assets";
import {
  hookamaxFeatureCards,
  hookamaxFlavorStory,
  hookamaxPackageItems,
} from "@/lib/hookamax-copy";

const iconMap: Record<(typeof hookamaxFeatureCards)[number]["icon"], LucideIcon> =
  {
    sparkles: Sparkles,
    droplets: Droplets,
    battery: BatteryCharging,
    light: Lightbulb,
    target: Target,
    gauge: Gauge,
    mesh: Grid3x3,
    wind: Wind,
    leaf: Leaf,
    usb: Plug,
    cloud: Cloud,
  };

export default function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-umx-cream">
      <div className="relative px-4 py-20 sm:px-6 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute top-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-umx-cream-deep/45 blur-3xl"
        />

        <div className="relative mx-auto max-w-[1100px]">
          <header className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
              Features
            </p>
            <h2 className="mt-4 font-display text-[clamp(2.5rem,6vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
              HOOKAMAX
              <span className="text-umx-orange"> 80K.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl font-body text-base leading-relaxed text-black/65 sm:text-lg">
              Authentic shisha flavor, a 1600mAh battery, and ARGB light —
              MTL and DTL on one device.
            </p>
          </header>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {hookamaxFeatureCards.map((item) => {
              const Icon = iconMap[item.icon];
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

          <div className="mt-16 overflow-hidden rounded-[1.5rem] border border-black/8 bg-white px-6 py-7 shadow-[0_12px_36px_rgba(61,22,5,0.06)] sm:px-8 sm:py-8">
            <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
              Package list
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-black">
              UMAXES HOOKAMAX 80K disposable vape
            </h3>
            <ul className="mt-5 space-y-2">
              {hookamaxPackageItems.map((item) => (
                <li
                  key={item}
                  className="font-body text-base text-black/70 sm:text-lg"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16">
            <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
              Flavor options
            </p>
            <h3 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-[-0.03em] text-black">
              Choose your character.
            </h3>
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {hookamaxFlavorStory.map((entry) => {
                const flavor = getFlavor(entry.id) ?? flavors[0];
                return (
                  <li key={entry.id}>
                    <Link
                      href={`/product/${entry.id}`}
                      scroll={false}
                      className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-black/8 bg-umx-cream-warm shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:border-black/16 hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)]"
                    >
                      <div
                        className="relative aspect-[4/3] overflow-hidden"
                        style={{ backgroundColor: `${flavor.accent}22` }}
                      >
                        <Image
                          src={flavor.image}
                          alt={flavor.name}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.04]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                        />
                      </div>
                      <div className="flex flex-1 flex-col px-4 py-3.5">
                        <p className="font-display text-[0.65rem] font-semibold tracking-[0.12em] text-black/45 uppercase">
                          {entry.character}
                        </p>
                        <p className="mt-1 font-display text-sm font-bold tracking-tight text-black">
                          {flavor.name}
                        </p>
                      </div>
                    </Link>
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
