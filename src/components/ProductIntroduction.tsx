import Image from "next/image";
import { product } from "@/lib/assets";

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
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="product-intro-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-umx-cream-deep/50 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none">
          <div className="relative aspect-[3/4] w-full max-w-[26rem] lg:max-w-[30rem]">
            <Image
              src={product.deviceDuoImage}
              alt="UMAXES HookaMax 80K disposable hookah devices"
              fill
              priority
              quality={100}
              sizes="(max-width: 1024px) 90vw, 480px"
              className="object-contain object-center drop-shadow-[0_22px_45px_rgba(0,0,0,0.12)]"
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="rounded-[1.75rem] border border-black/8 bg-umx-cream-warm px-6 py-7 shadow-[0_22px_55px_rgba(61,22,5,0.08)] sm:px-8 sm:py-9">
            <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase sm:text-sm">
              Introduction
            </p>
            <h2
              id="product-intro-heading"
              className="mt-3 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-black"
            >
              Umaxes HookaMax 80k
              <span className="mt-1 block text-[0.72em] font-bold tracking-[-0.02em] text-black/55">
                Disposable Hookah
              </span>
            </h2>

            <div className="mt-5 space-y-3.5 font-body text-base leading-relaxed text-black/65 sm:mt-6 sm:text-lg">
              <p>
                Umaxes HookaMax 80k Disposable Vape is a disposable vape with at
                most{" "}
                <strong className="font-semibold text-black">80K puffs</strong>{" "}
                and a{" "}
                <strong className="font-semibold text-black">1600mAh</strong>{" "}
                internal battery. The Umaxes HookaMax hookah vape is, so far,
                the best vape that Umaxes offers.
              </p>
              <p>
                It features a built-in 1600mAh battery for extended use. Umaxes
                offers sufficient vape juice to make HookaMax satisfy up to 80K
                puffs. Moreover, you can turn on the{" "}
                <strong className="font-semibold text-black">ARGB light</strong>{" "}
                to add full-spectrum fun of light effects to your vaping. You
                can enjoy both{" "}
                <strong className="font-semibold text-black">MTL and DTL</strong>{" "}
                with Umaxes HookaMax 80K.
              </p>
            </div>

            <dl className="mt-7 grid grid-cols-2 gap-3 border-t border-black/8 pt-6 sm:mt-8 sm:grid-cols-4">
              {HIGHLIGHTS.map((item) => (
                <div key={item.label}>
                  <dt className="font-display text-[0.62rem] font-semibold tracking-[0.14em] text-black/40 uppercase">
                    {item.label}
                  </dt>
                  <dd className="mt-1 font-display text-sm font-bold tracking-tight text-black sm:text-base">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
