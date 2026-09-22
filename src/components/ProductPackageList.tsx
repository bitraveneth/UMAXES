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
        className="pointer-events-none absolute -left-12 top-20 h-64 w-64 rounded-full bg-umx-cream-deep/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-8 h-56 w-56 translate-x-1/4 rounded-full bg-umx-orange-wash/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-[900px]">
        <header className="text-center">
          <div className="inline-flex items-center gap-3">
            <span className="h-px w-10 bg-black/25 sm:w-12" aria-hidden />
            <p className="font-display text-xs font-semibold tracking-[0.24em] text-black/45 uppercase sm:text-sm">
              Package list
            </p>
            <span className="h-px w-10 bg-black/25 sm:w-12" aria-hidden />
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

        <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-6 sm:mt-12 sm:flex-row sm:items-center sm:gap-8 sm:text-left">
          <div
            className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.35rem] shadow-[0_14px_32px_rgba(61,22,5,0.1)] ring-1 ring-black/8 sm:h-32 sm:w-32"
            style={{
              background: `linear-gradient(160deg, ${flavor.accent}28, #fff 70%)`,
            }}
          >
            <Image
              src={flavor.packageImage}
              alt=""
              fill
              className="object-contain object-center p-2.5"
              sizes="128px"
              quality={80}
            />
          </div>

          <div className="min-w-0 text-center sm:text-left">
            <p className="font-display text-[0.65rem] font-semibold tracking-[0.2em] text-black/40 uppercase">
              Contents
            </p>
            <p className="mt-2 font-display text-[clamp(1.15rem,2.8vw,1.45rem)] font-extrabold leading-snug tracking-[-0.03em] text-black">
              <span className="tabular-nums text-black/35">1 ×</span>{" "}
              Umaxes HookaMax 80K Disposable Kit
            </p>
            <p className="mt-2 font-body text-sm text-black/50">
              {flavor.name} · complete disposable kit
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
