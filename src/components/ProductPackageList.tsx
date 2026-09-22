import Image from "next/image";
import type { Flavor } from "@/lib/assets";

export default function ProductPackageList({ flavor }: { flavor: Flavor }) {
  return (
    <section
      id="package-list"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="package-list-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-umx-orange-wash/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-umx-cream-deep/55 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1400px]">
        <header className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <div className="inline-flex items-center gap-3">
            <span className="h-px w-10 bg-umx-orange sm:w-14" aria-hidden />
            <p className="font-display text-xs font-semibold tracking-[0.24em] text-umx-orange uppercase sm:text-sm">
              Package list
            </p>
            <span className="h-px w-10 bg-umx-orange sm:w-14" aria-hidden />
          </div>
          <h2
            id="package-list-heading"
            className="mt-5 font-display text-[clamp(2.1rem,5.5vw,3.75rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-black"
          >
            Umaxes HookaMax 80K
            <span className="mt-2 block text-[0.72em] font-bold tracking-[-0.03em] text-umx-orange sm:mt-3">
              Disposable Vape
            </span>
          </h2>
        </header>

        <div className="mx-auto grid max-w-5xl items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
          <div
            className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden lg:max-w-none"
            style={{
              background: `linear-gradient(165deg, ${flavor.accent}22 0%, transparent 55%), linear-gradient(180deg, #fff8f1 0%, #f3ebe1 100%)`,
            }}
          >
            <Image
              src={flavor.packageImage}
              alt={`${flavor.name} HOOKAMAX package`}
              fill
              className="object-contain object-center p-4 sm:p-6"
              sizes="(max-width: 1024px) 80vw, 420px"
              quality={85}
            />
          </div>

          <div className="pb-2 lg:pb-8">
            <p className="font-display text-[0.7rem] font-semibold tracking-[0.2em] text-black/40 uppercase">
              Contents
            </p>

            <div className="mt-5 border-t border-black/15 pt-6">
              <div className="flex items-baseline gap-4 sm:gap-6">
                <p className="font-display text-[clamp(3rem,8vw,4.5rem)] font-extrabold leading-none tracking-[-0.05em] text-umx-orange tabular-nums">
                  1<span className="text-[0.45em] font-bold text-black/25">×</span>
                </p>
                <div className="min-w-0 border-l border-black/12 pl-4 sm:pl-6">
                  <p className="font-display text-[clamp(1.25rem,3vw,1.75rem)] font-extrabold leading-tight tracking-[-0.03em] text-black">
                    Umaxes HookaMax 80K Disposable Kit
                  </p>
                  <p className="mt-2 font-body text-sm text-black/50 sm:text-base">
                    {flavor.name} · complete disposable kit
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: flavor.accent }}
                aria-hidden
              />
              <p className="font-display text-xs font-semibold tracking-[0.16em] text-black/45 uppercase">
                Ready to open · Ready to draw
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
