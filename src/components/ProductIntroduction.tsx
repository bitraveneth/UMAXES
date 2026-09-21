import Image from "next/image";

/** Full-bleed HookaMax intro art — keep native 1920×1080, do not downscale. */
export const HOOKAMAX_INTRO_IMAGE = "/images/product/hookamax-introduction.jpg";

export default function ProductIntroduction() {
  return (
    <section
      id="introduction"
      className="relative w-full bg-[#f3ebe0]"
      aria-labelledby="product-intro-heading"
    >
      {/* Desktop / tablet: full native banner with copy in the white box */}
      <div className="relative hidden w-full md:block">
        <Image
          src={HOOKAMAX_INTRO_IMAGE}
          alt="UMAXES HookaMax 80K disposable hookah"
          width={1920}
          height={1080}
          priority
          quality={100}
          sizes="100vw"
          className="block h-auto w-full max-w-none"
          unoptimized
        />

        <div className="pointer-events-none absolute inset-0">
          <div
            className="pointer-events-auto absolute flex flex-col justify-center overflow-hidden pl-[2.6%] pr-[5.5%] pt-[2.2%] pb-[7%] text-[#2a2118]"
            style={{
              left: "45.8%",
              top: "22.8%",
              width: "48.8%",
              height: "53.5%",
            }}
          >
            <IntroCopy />
          </div>
        </div>
      </div>

      {/* Mobile: full-width art, then matching white-box panel for readable copy */}
      <div className="md:hidden">
        <Image
          src={HOOKAMAX_INTRO_IMAGE}
          alt="UMAXES HookaMax 80K disposable hookah"
          width={1920}
          height={1080}
          priority
          quality={100}
          sizes="100vw"
          className="block h-auto w-full max-w-none"
          unoptimized
        />
        <div className="relative z-10 -mt-2 px-4 pb-10">
          <div className="rounded-2xl border border-[#c9a65a]/70 bg-[#fbf8f1] px-5 py-6 shadow-[0_18px_40px_rgba(61,40,15,0.12)] ring-1 ring-[#e8d7a8]/80">
            <IntroCopy compact />
          </div>
        </div>
      </div>
    </section>
  );
}

function IntroCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3" : "space-y-2.5 xl:space-y-3.5"}>
      <p
        className={`font-display font-semibold tracking-[0.22em] text-[#b8862d] uppercase ${
          compact ? "text-[11px]" : "text-[clamp(0.65rem,1.05vw,0.85rem)]"
        }`}
      >
        Introduction
      </p>
      <h2
        id="product-intro-heading"
        className={`font-display font-extrabold leading-[1.05] tracking-[-0.03em] text-[#1f1812] ${
          compact
            ? "text-[1.55rem]"
            : "text-[clamp(1.15rem,2.35vw,2.15rem)]"
        }`}
      >
        Umaxes HookaMax 80k Disposable Hookah
      </h2>
      <div
        className={`font-body leading-relaxed text-[#3d3228]/88 ${
          compact
            ? "space-y-2.5 text-sm"
            : "space-y-2 text-[clamp(0.7rem,1.05vw,0.95rem)] xl:space-y-2.5"
        }`}
      >
        <p>
          Umaxes HookaMax 80k Disposable Vape is a disposable vape with at most{" "}
          <strong className="font-semibold text-[#1f1812]">80K puffs</strong>{" "}
          and a{" "}
          <strong className="font-semibold text-[#1f1812]">
            1600mAh
          </strong>{" "}
          internal battery. The Umaxes HookaMax hookah vape is, so far, the
          best vape that Umaxes offers.
        </p>
        <p>
          It features a built-in 1600mAh battery for extended use. Umaxes offers
          sufficient vape juice to make HookaMax satisfy up to 80K puffs.
          Moreover, you can turn on the{" "}
          <strong className="font-semibold text-[#1f1812]">ARGB light</strong>{" "}
          to add full-spectrum fun of light effects to your vaping. You can
          enjoy both{" "}
          <strong className="font-semibold text-[#1f1812]">MTL and DTL</strong>{" "}
          with Umaxes HookaMax 80K.
        </p>
      </div>
    </div>
  );
}
