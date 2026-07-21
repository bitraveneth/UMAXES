"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { testimonialImages } from "@/lib/assets";

const reviews = [
  {
    src: testimonialImages[0],
    name: "Marcus",
    quote: "Looks premium in hand. The draw is smooth all day.",
  },
  {
    src: testimonialImages[1],
    name: "Ava",
    quote: "Flavor stays rich — this is the one I actually keep using.",
  },
  {
    src: testimonialImages[2],
    name: "Jordan",
    quote: "Battery and design feel serious. Not a toy disposable.",
  },
  {
    src: testimonialImages[3],
    name: "Riley",
    quote: "Hookah vibe without the setup. Clean and strong.",
  },
] as const;

const AUTO_MS = 4200;

function ReviewCard({
  review,
  sizes,
  className = "",
}: {
  review: (typeof reviews)[number];
  sizes: string;
  className?: string;
}) {
  return (
    <article
      className={`overflow-hidden rounded-[1.5rem] bg-umx-cream shadow-[0_14px_40px_rgba(61,22,5,0.06)] ring-1 ring-black/5 ${className}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-umx-cream-warm">
        <Image
          src={review.src}
          alt={`Review by ${review.name}`}
          fill
          className="object-contain object-center"
          sizes={sizes}
        />
      </div>
      <div className="border-t border-black/5 px-4 py-4 text-center sm:px-5 sm:py-5">
        <p className="font-display text-sm font-bold tracking-tight text-black">
          {review.name}
        </p>
        <p className="mt-1.5 font-body text-sm leading-relaxed text-black/60">
          “{review.quote}”
        </p>
      </div>
    </article>
  );
}

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const n = reviews.length;

  useEffect(() => {
    const id = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % n);
    }, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [index, n]);

  function go(next: number) {
    setIndex(((next % n) + n) % n);
  }

  return (
    <section
      id="community"
      className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-20 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-umx-orange/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1200px]">
        <header className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-semibold tracking-[0.18em] text-umx-orange uppercase">
            Reviews
          </p>
          <h2 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[0.95] tracking-[-0.035em] text-black">
            <span className="block">Real people.</span>
            <span className="block text-umx-orange">Real sessions.</span>
          </h2>
          <p className="mt-4 font-body text-base text-black/60 sm:text-lg">
            Lifestyle moments from the HOOKAMAX community.
          </p>
        </header>

        {/* Desktop grid */}
        <div className="mt-14 hidden gap-5 md:mt-16 md:grid md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.src}
              review={review}
              sizes="(max-width: 1024px) 50vw, 280px"
              className="group transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_55px_rgba(61,22,5,0.12)]"
            />
          ))}
        </div>

        {/* Mobile — auto one-by-one with progress bars */}
        <div className="mt-12 md:hidden">
          <div className="relative mx-auto w-full max-w-[22rem]">
            {/* Story-style progress tracks */}
            <div className="mb-4 flex gap-1.5" aria-hidden>
              {reviews.map((_, i) => (
                <div
                  key={i}
                  className="relative h-1 flex-1 overflow-hidden rounded-full bg-black/10"
                >
                  <span
                    key={i === index ? `${index}-fill` : `${i}-static`}
                    className={`absolute inset-y-0 left-0 block rounded-full bg-umx-orange ${
                      i < index ? "w-full" : i > index ? "w-0" : ""
                    }`}
                    style={
                      i === index
                        ? {
                            width: "0%",
                            animation: `hero-progress ${AUTO_MS}ms linear forwards`,
                          }
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>

            <div className="relative aspect-[2/3] w-full">
              {reviews.map((review, i) => {
                const active = i === index;
                return (
                  <button
                    key={review.src}
                    type="button"
                    className={`absolute inset-0 text-left transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      active
                        ? "z-[1] translate-y-0 scale-100 opacity-100"
                        : "z-0 pointer-events-none translate-y-4 scale-[0.96] opacity-0"
                    }`}
                    aria-hidden={!active}
                    tabIndex={active ? 0 : -1}
                    onClick={() => go(index + 1)}
                  >
                    <ReviewCard
                      review={review}
                      sizes="90vw"
                      className="h-full shadow-[0_22px_55px_rgba(61,22,5,0.12)]"
                    />
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-center font-display text-[0.65rem] font-semibold tracking-[0.14em] text-black/35 uppercase">
              {String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} · Auto
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
