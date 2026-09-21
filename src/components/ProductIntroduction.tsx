import Image from "next/image";

/** Full-res HookaMax intro art — served unoptimized at native 1920×1080. */
export const HOOKAMAX_INTRO_IMAGE = "/images/product/hookamax-introduction.jpg";

const HIGHLIGHTS = [
  { label: "Puffs", value: "Up to 80K" },
  { label: "Battery", value: "1600mAh" },
  { label: "Lights", value: "ARGB" },
  { label: "Draw", value: "MTL & DTL" },
] as const;

export default function ProductIntroduction() {
  return (
    <section
      id="introduction"
      className="relative overflow-hidden bg-[#f4ebe1]"
      aria-labelledby="product-intro-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_40%,rgba(201,166,90,0.14),transparent_55%),radial-gradient(ellipse_at_90%_20%,rgba(180,140,200,0.12),transparent_45%)]"
      />

      <div className="relative mx-auto grid max-w-[1500px] lg:grid-cols-2 lg:items-stretch">
        {/* Left: device art only (left side of banner) */}
        <div className="relative min-h-[22rem] overflow-hidden sm:min-h-[28rem] lg:min-h-[38rem]">
          <Image
            src={HOOKAMAX_INTRO_IMAGE}
            alt="UMAXES HookaMax 80K disposable hookah devices"
            fill
            priority
            quality={100}
            unoptimized
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-left"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-[#f4ebe1] lg:w-24"
          />
        </div>

        {/* Right: custom introduction box */}
        <div className="relative flex items-center px-5 py-10 sm:px-8 sm:py-14 lg:px-10 xl:px-14">
          <div className="relative w-full max-w-xl xl:max-w-2xl">
            <div
              aria-hidden
              className="absolute -inset-px rounded-[1.6rem] bg-gradient-to-br from-[#e0c274] via-[#c9a65a] to-[#a8843a] opacity-90"
            />
            <div className="relative rounded-[1.5rem] border border-[#f7efd8] bg-[#fbf8f1] px-6 py-7 shadow-[0_22px_55px_rgba(61,40,15,0.1)] sm:px-8 sm:py-9 lg:px-9 lg:py-10">
              <div
                aria-hidden
                className="pointer-events-none absolute top-4 right-5 h-8 w-8 rounded-full border border-[#c9a65a]/45"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute top-[1.15rem] right-[1.35rem] h-5 w-5 rounded-full border border-[#c9a65a]/30"
              />

              <p className="font-display text-xs font-semibold tracking-[0.22em] text-[#b8862d] uppercase sm:text-sm">
                Introduction
              </p>
              <h2
                id="product-intro-heading"
                className="mt-3 font-display text-[clamp(1.65rem,3.4vw,2.55rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#1f1812]"
              >
                Umaxes HookaMax 80k
                <span className="mt-1 block text-[0.72em] font-bold tracking-[-0.02em] text-[#5c4a38]">
                  Disposable Hookah
                </span>
              </h2>

              <div className="mt-5 space-y-3.5 font-body text-[0.95rem] leading-relaxed text-[#3d3228]/90 sm:mt-6 sm:text-base sm:leading-relaxed">
                <p>
                  Umaxes HookaMax 80k Disposable Vape is a disposable vape with
                  at most{" "}
                  <strong className="font-semibold text-[#1f1812]">
                    80K puffs
                  </strong>{" "}
                  and a{" "}
                  <strong className="font-semibold text-[#1f1812]">
                    1600mAh
                  </strong>{" "}
                  internal battery. The Umaxes HookaMax hookah vape is, so far,
                  the best vape that Umaxes offers.
                </p>
                <p>
                  It features a built-in 1600mAh battery for extended use.
                  Umaxes offers sufficient vape juice to make HookaMax satisfy
                  up to 80K puffs. Moreover, you can turn on the{" "}
                  <strong className="font-semibold text-[#1f1812]">
                    ARGB light
                  </strong>{" "}
                  to add full-spectrum fun of light effects to your vaping. You
                  can enjoy both{" "}
                  <strong className="font-semibold text-[#1f1812]">
                    MTL and DTL
                  </strong>{" "}
                  with Umaxes HookaMax 80K.
                </p>
              </div>

              <dl className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4 sm:gap-3.5">
                {HIGHLIGHTS.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#e8d7a8]/80 bg-[#f7f1e6]/80 px-3 py-2.5"
                  >
                    <dt className="font-display text-[0.62rem] font-semibold tracking-[0.14em] text-[#9a7a3a] uppercase">
                      {item.label}
                    </dt>
                    <dd className="mt-1 font-display text-sm font-bold tracking-tight text-[#1f1812] sm:text-[0.95rem]">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
