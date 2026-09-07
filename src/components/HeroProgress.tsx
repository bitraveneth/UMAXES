import Image from "next/image";
import Link from "next/link";
import { heroBanner, siteSlogan } from "@/lib/assets";

export default function HeroProgress() {
  return (
    <section
      id="top"
      className="bg-umx-cream px-2.5 py-3 sm:px-4 sm:py-5 md:px-5 md:py-6"
      aria-label="UMAXES banner"
    >
      <div className="relative mx-auto min-h-[22.5rem] h-[min(68svh,34rem)] w-full max-w-[1680px] overflow-hidden rounded-[1.25rem] bg-black shadow-[0_22px_55px_rgba(0,0,0,0.18)] sm:min-h-[32rem] sm:h-[min(80svh,48rem)] sm:rounded-[2.15rem] md:rounded-[2.5rem]">
        <Image
          src={heroBanner}
          alt="UMAXES HOOKAMAX Cool Mint"
          fill
          priority
          fetchPriority="high"
          quality={80}
          sizes="(max-width: 640px) 100vw, 1680px"
          className="object-cover object-center"
        />

        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/80 via-black/40 to-black/15 sm:bg-gradient-to-r sm:from-black/65 sm:via-black/20 sm:to-transparent" />

        <div className="absolute inset-0 z-[3] flex flex-col justify-end px-5 pb-8 pt-6 sm:justify-center sm:px-12 sm:pb-16 sm:pt-8 md:px-16 lg:px-20">
          <div className="w-full max-w-[17.5rem] sm:max-w-[min(100%,34rem)]">
            <h1 className="font-display text-[1.7rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-white text-pretty sm:text-[clamp(1.85rem,5.5vw,4.25rem)] sm:leading-[1.02] sm:tracking-[-0.035em] sm:text-balance">
              {siteSlogan}
            </h1>
            <p className="mt-5 hidden max-w-[28rem] font-body text-lg leading-[1.45] text-white/90 sm:block">
              Crafted for Smooth Flavor & Lasting Satisfaction.
            </p>
            <Link
              href="/shop"
              className="group mt-4 inline-flex w-fit items-center gap-2.5 rounded-full bg-white px-4 py-2.5 font-display text-[0.8125rem] font-semibold tracking-[0.04em] text-black shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition duration-300 hover:bg-black hover:text-white sm:mt-8 sm:gap-3.5 sm:px-7 sm:py-3.5 sm:text-base"
            >
              <span>Buy now</span>
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white transition duration-300 group-hover:bg-white group-hover:text-black sm:h-9 sm:w-9"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
