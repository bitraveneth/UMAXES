export default function ProductPackageList() {
  return (
    <section
      id="package-list"
      className="relative overflow-hidden bg-black px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="package-list-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(255,255,255,0.14), transparent 55%), radial-gradient(circle at 85% 90%, rgba(255,255,255,0.06), transparent 40%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent sm:inset-x-16"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent sm:inset-x-16"
      />

      <div className="relative mx-auto max-w-4xl">
        <header className="text-center">
          <p className="font-display text-[0.7rem] font-semibold tracking-[0.28em] text-white/45 uppercase sm:text-xs">
            Package list
          </p>
          <h2
            id="package-list-heading"
            className="mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.045em] text-white"
          >
            Umaxes HookaMax 80K
            <span className="mt-2 block font-bold tracking-[-0.03em] text-white/55 sm:mt-3">
              Disposable Vape
            </span>
          </h2>
        </header>

        <div className="mx-auto mt-12 max-w-2xl sm:mt-16">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/[0.04] px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:px-10 sm:py-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl"
            />

            <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
              <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-[1.35rem] bg-white text-black sm:h-[5.5rem] sm:w-[5.5rem]">
                <span className="font-display text-[0.6rem] font-semibold tracking-[0.2em] text-black/45 uppercase">
                  Qty
                </span>
                <span className="mt-0.5 font-display text-4xl font-extrabold leading-none tracking-[-0.05em] tabular-nums">
                  1
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-display text-[0.65rem] font-semibold tracking-[0.22em] text-white/40 uppercase">
                  Included
                </p>
                <p className="mt-2 font-display text-[clamp(1.2rem,3vw,1.65rem)] font-extrabold leading-snug tracking-[-0.03em] text-white">
                  Umaxes HookaMax 80K Disposable Kit
                </p>
                <p className="mt-2 font-body text-sm leading-relaxed text-white/50 sm:text-[0.95rem]">
                  Complete kit · one device in the package
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
