export default function ProductPackageList() {
  return (
    <section
      id="package-list"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="package-list-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/15 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-umx-orange-wash/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-3">
          <span className="h-px w-10 bg-umx-orange sm:w-14" aria-hidden />
          <p className="font-display text-xs font-semibold tracking-[0.24em] text-umx-orange uppercase sm:text-sm">
            Package list
          </p>
          <span className="h-px w-10 bg-umx-orange sm:w-14" aria-hidden />
        </div>

        <h2
          id="package-list-heading"
          className="mt-5 font-display text-[clamp(2rem,5.5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-black"
        >
          Umaxes HookaMax 80K
          <span className="mt-2 block text-[0.72em] font-bold tracking-[-0.03em] text-umx-orange sm:mt-3">
            Disposable Vape
          </span>
        </h2>

        <div className="mx-auto mt-12 max-w-xl border-y border-black/12 py-8 sm:mt-14 sm:py-10">
          <p className="font-display text-[0.7rem] font-semibold tracking-[0.2em] text-black/40 uppercase">
            Contents
          </p>
          <p className="mt-5 font-display text-[clamp(1.35rem,3.5vw,1.85rem)] font-extrabold leading-snug tracking-[-0.03em] text-black">
            <span className="text-umx-orange tabular-nums">1 ×</span>{" "}
            Umaxes HookaMax 80K Disposable Kit
          </p>
        </div>
      </div>
    </section>
  );
}
