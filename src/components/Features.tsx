import Image from "next/image";
import Link from "next/link";
import { flavors, getFlavor } from "@/lib/assets";
import {
  hookamaxFeatureItems,
  hookamaxFlavorStory,
  hookamaxPackageItems,
} from "@/lib/hookamax-copy";

export default function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-umx-cream">
      <div className="relative px-4 py-20 sm:px-6 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute top-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-umx-cream-deep/45 blur-3xl"
        />

        <div className="relative mx-auto max-w-[1100px]">
          <header className="max-w-2xl">
            <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
              Features
            </p>
            <h2 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-black">
              What’s inside
              <span className="text-umx-orange"> HOOKAMAX 80K.</span>
            </h2>
          </header>

          <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {hookamaxFeatureItems.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-[1.25rem] border border-black/8 bg-umx-cream-warm px-5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-umx-orange"
                  aria-hidden
                />
                <p className="font-body text-sm leading-relaxed text-black/75 sm:text-base">
                  {item}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-14 overflow-hidden rounded-[1.5rem] border border-black/8 bg-white px-6 py-7 shadow-[0_12px_36px_rgba(61,22,5,0.06)] sm:px-8 sm:py-8">
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
              Ten characters. One device.
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
                          <span className="mr-1.5" aria-hidden>
                            {entry.emoji}
                          </span>
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
