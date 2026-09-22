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
        className="pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-umx-cream-deep/45 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 bottom-16 h-64 w-64 rounded-full bg-umx-orange-wash/35 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1200px]">
        <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <div className="inline-flex items-center gap-3">
            <span className="h-px w-10 bg-black/20 sm:w-12" aria-hidden />
            <p className="font-display text-xs font-semibold tracking-[0.24em] text-black/45 uppercase sm:text-sm">
              Package list
            </p>
            <span className="h-px w-10 bg-black/20 sm:w-12" aria-hidden />
          </div>
          <h2
            id="package-list-heading"
            className="mt-4 font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-black"
          >
            Umaxes HookaMax 80K
            <span className="mt-2 block text-[0.72em] font-bold tracking-[-0.03em] text-black/45 sm:mt-2.5">
              Disposable Vape
            </span>
          </h2>
        </header>

        <div className="grid items-stretch gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6">
          {/* Left — image panel */}
          <div
            className="relative flex min-h-[20rem] flex-col justify-end overflow-hidden rounded-[1.75rem] ring-1 ring-black/8 sm:min-h-[24rem] lg:min-h-[28rem]"
            style={{
              background: `linear-gradient(165deg, ${flavor.accent}30 0%, #fff8f1 48%, #f0ebe3 100%)`,
            }}
          >
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[18rem] flex-1 sm:max-w-[20rem] lg:max-w-[22rem]">
              <Image
                src={flavor.packageImage}
                alt={`${flavor.name} HOOKAMAX package`}
                fill
                className="object-contain object-center p-5 sm:p-6"
                sizes="(max-width: 1024px) 70vw, 420px"
                quality={85}
              />
            </div>
            <div className="relative border-t border-black/8 bg-white/55 px-6 py-5 backdrop-blur-sm">
              <p className="font-display text-[0.65rem] font-semibold tracking-[0.18em] text-black/40 uppercase">
                Packaging
              </p>
              <p className="mt-1 font-display text-lg font-bold tracking-tight text-black">
                {flavor.name}
              </p>
            </div>
          </div>

          {/* Right — contents panel (same size) */}
          <div className="flex min-h-[20rem] flex-col justify-between rounded-[1.75rem] border border-black/8 bg-umx-cream-warm px-7 py-8 shadow-[0_16px_40px_rgba(61,22,5,0.06)] sm:min-h-[24rem] sm:px-9 sm:py-10 lg:min-h-[28rem]">
            <div>
              <p className="font-display text-[0.65rem] font-semibold tracking-[0.2em] text-black/40 uppercase">
                Contents
              </p>
              <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
                What&apos;s included
              </p>
              <p className="mt-3 max-w-sm font-body text-sm leading-relaxed text-black/55 sm:text-base">
                Everything in the retail package for this HOOKAMAX 80K
                disposable.
              </p>
            </div>

            <div className="mt-10 border-t border-black/10 pt-8">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-black text-umx-cream sm:h-[4.5rem] sm:w-[4.5rem]">
                  <span className="font-display text-[0.55rem] font-semibold tracking-[0.16em] uppercase opacity-60">
                    Qty
                  </span>
                  <span className="font-display text-3xl font-extrabold leading-none tracking-[-0.04em] tabular-nums">
                    1
                  </span>
                </div>
                <div className="min-w-0 pt-1">
                  <p className="font-display text-[0.65rem] font-semibold tracking-[0.16em] text-black/40 uppercase">
                    Item 01
                  </p>
                  <p className="mt-1.5 font-display text-lg font-extrabold leading-snug tracking-tight text-black sm:text-xl">
                    Umaxes HookaMax 80K Disposable Kit
                  </p>
                  <p className="mt-2 font-body text-sm text-black/50">
                    Complete disposable kit · one device
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
