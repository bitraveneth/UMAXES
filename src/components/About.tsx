import Image from "next/image";
import Link from "next/link";
import { testimonialImages } from "@/lib/assets";

export default function About() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
    >
      <div className="relative mx-auto max-w-[1200px]">
        <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <span className="inline-flex rounded-full bg-black px-4 py-1.5 font-display text-[0.7rem] font-semibold tracking-[0.18em] text-umx-cream uppercase">
            Brand
          </span>
          <h2 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            About UMAXES VAPE
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-body text-base leading-relaxed text-black/75 sm:text-lg">
            Designed around the modern vaping experience.
          </p>
        </header>

        <article className="grid overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/15 sm:rounded-[2rem] lg:grid-cols-2 lg:min-h-[36rem]">
          <div className="flex flex-col justify-center px-7 py-12 sm:px-12 sm:py-16 lg:px-14">
            <p className="max-w-md text-justify font-body text-base leading-[1.75] text-black/80 sm:text-lg">
              UMAXES VAPE is a modern brand for adult consumers who want more
              than a disposable. We design devices that bring distinctive looks,
              reliable performance, and exceptional flavor into one ritual —
              from airflow and everyday usability to the last draw of the
              session.
            </p>
            <p className="mt-5 max-w-md text-justify font-body text-base leading-[1.75] text-black/80 sm:text-lg">
              Great products should feel like an experience people return to,
              not a tool they forget. With trusted partners in development,
              testing, and manufacturing, we hold one standard so every HOOKAMAX
              that ships is consistent for the global market.
            </p>
            <Link
              href="/about"
              className="mt-8 inline-flex w-fit items-center justify-center rounded-full bg-black px-7 py-3.5 font-display text-sm font-semibold tracking-[0.12em] text-umx-cream uppercase transition hover:bg-transparent hover:text-black hover:ring-2 hover:ring-black"
            >
              Read more
            </Link>
          </div>

          <div className="relative min-h-[22rem] bg-umx-cream-warm sm:min-h-[28rem] lg:min-h-full">
            <Image
              src={testimonialImages[6]}
              alt="HOOKAMAX — 80K puffs"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={75}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent lg:bg-gradient-to-l"
            />
          </div>
        </article>
      </div>
    </section>
  );
}
