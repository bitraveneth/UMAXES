import Image from "next/image";
import { product } from "@/lib/assets";

const HIGHLIGHTS = [
  { label: "Puffs", value: "Up to 80K" },
  { label: "Battery", value: "1600mAh" },
  { label: "Lights", value: "ARGB effects" },
  { label: "Draw", value: "MTL & DTL" },
] as const;

export default function ProductIntroduction() {
  return (
    <section
      id="introduction"
      className="relative overflow-hidden bg-umx-orange-ink px-4 py-20 text-umx-cream sm:px-6 sm:py-28"
      aria-labelledby="product-intro-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-0 h-80 w-80 -translate-x-1/3 rounded-full bg-umx-orange/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 translate-x-1/4 rounded-full bg-umx-cream/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 xl:gap-20">
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-black/25 ring-1 ring-white/10">
            <Image
              src={product.deviceImage}
              alt="UMAXES HookaMax 80K disposable hookah device"
              fill
              className="object-contain object-center p-6 sm:p-8"
              sizes="(max-width: 1024px) 90vw, 480px"
              quality={85}
            />
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-display text-xs font-semibold tracking-[0.22em] text-umx-orange uppercase sm:text-sm">
            Introduction
          </p>
          <h2
            id="product-intro-heading"
            className="mt-4 font-display text-[clamp(2.25rem,5.5vw,3.75rem)] font-extrabold leading-[0.98] tracking-[-0.035em] text-umx-cream"
          >
            UMAXES HookaMax{" "}
            <span className="text-umx-orange">80K</span>
          </h2>
          <p className="mt-3 font-display text-lg font-semibold tracking-tight text-umx-cream/70 sm:text-xl">
            Disposable Hookah
          </p>

          <div className="mt-8 space-y-5 font-body text-base leading-relaxed text-umx-cream/75 sm:text-lg">
            <p>
              UMAXES HookaMax 80K disposable vape delivers up to{" "}
              <span className="font-semibold text-umx-cream">80K puffs</span>{" "}
              with a built-in{" "}
              <span className="font-semibold text-umx-cream">1600mAh</span>{" "}
              battery for extended sessions. It is the flagship HookaMax
              experience from UMAXES — power, capacity, and presence in one
              device.
            </p>
            <p>
              Plenty of e-liquid keeps each draw consistent through the full
              puff life. Turn on the{" "}
              <span className="font-semibold text-umx-cream">ARGB light</span>{" "}
              for full-spectrum light effects, and switch freely between{" "}
              <span className="font-semibold text-umx-cream">MTL and DTL</span>{" "}
              to match how you like to draw.
            </p>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/12 pt-8 sm:grid-cols-4">
            {HIGHLIGHTS.map((item) => (
              <div key={item.label}>
                <dt className="font-display text-[0.65rem] font-semibold tracking-[0.16em] text-umx-cream/45 uppercase">
                  {item.label}
                </dt>
                <dd className="mt-1.5 font-display text-base font-bold tracking-tight text-umx-cream sm:text-lg">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
