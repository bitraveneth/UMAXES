const MESSAGES = [
  "WARNING — This product contains nicotine. Nicotine is an addictive chemical.",
  "For adults 21 years of age or older only.",
  "Keep out of reach of children and pets.",
  "This product is not intended as a smoking cessation device.",
] as const;

function TickerSegment({ prefix }: { prefix: string }) {
  return (
    <div className="animate-legal-ticker flex shrink-0 items-center gap-8 pr-8 sm:gap-10 sm:pr-10">
      {MESSAGES.map((message, i) => (
        <span
          key={`${prefix}-${i}`}
          className="inline-flex items-center gap-8 sm:gap-10"
        >
          <span className="inline-flex items-center gap-3 sm:gap-3.5">
            <span className="inline-flex h-6 items-center rounded-sm bg-umx-orange px-2 font-display text-[0.65rem] font-bold tracking-wide text-black sm:h-7 sm:px-2.5 sm:text-xs">
              21+
            </span>
            <span className="font-display text-[0.8rem] font-medium tracking-[0.04em] text-umx-cream sm:text-[0.9375rem]">
              {message}
            </span>
          </span>
          <span
            aria-hidden
            className="h-1 w-1 rotate-45 bg-umx-orange sm:h-1.5 sm:w-1.5"
          />
        </span>
      ))}
    </div>
  );
}

export default function LegalTicker() {
  return (
    <div
      className="relative z-[60] overflow-hidden bg-black"
      role="note"
      aria-label="Nicotine and age warning"
    >
      {/* Orange accent edge */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-umx-orange" aria-hidden />

      <div className="flex items-center whitespace-nowrap py-3.5 sm:py-4">
        <TickerSegment prefix="a" />
        <TickerSegment prefix="b" />
      </div>

      {/* Soft edge fade so text doesn't hard-cut */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black to-transparent sm:w-12"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black to-transparent sm:w-12"
        aria-hidden
      />
    </div>
  );
}
