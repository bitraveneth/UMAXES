"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const n = reviews.length;

  function go(next: number) {
    const i = ((next % n) + n) % n;
    setIndex(i);
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((card, i) => {
        const center = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setIndex(best);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

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
            Real people.
            <span className="text-umx-orange"> Real sessions.</span>
          </h2>
          <p className="mt-4 font-body text-base text-black/60 sm:text-lg">
            Lifestyle moments from the HOOKAMAX community.
          </p>
        </header>

        {/* Desktop grid — portrait frames match image ratio */}
        <div className="mt-14 hidden gap-5 md:mt-16 md:grid md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {reviews.map((review) => (
            <article
              key={review.src}
              className="group overflow-hidden rounded-[1.5rem] bg-umx-cream shadow-[0_14px_40px_rgba(61,22,5,0.06)] ring-1 ring-black/5 transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_55px_rgba(61,22,5,0.12)]"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-umx-cream-warm">
                <Image
                  src={review.src}
                  alt={`Review by ${review.name}`}
                  fill
                  className="object-contain object-center transition duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 50vw, 280px"
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
          ))}
        </div>

        {/* Mobile snap carousel — same portrait fit */}
        <div className="mt-14 md:hidden">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {reviews.map((review) => (
              <article
                key={review.src}
                className="w-[78%] shrink-0 snap-center overflow-hidden rounded-[1.5rem] bg-umx-cream shadow-[0_14px_40px_rgba(61,22,5,0.06)] ring-1 ring-black/5"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-umx-cream-warm">
                  <Image
                    src={review.src}
                    alt={`Review by ${review.name}`}
                    fill
                    className="object-contain object-center"
                    sizes="80vw"
                  />
                </div>
                <div className="border-t border-black/5 px-4 py-4 text-center">
                  <p className="font-display text-sm font-bold tracking-tight text-black">
                    {review.name}
                  </p>
                  <p className="mt-1.5 font-body text-sm leading-relaxed text-black/60">
                    “{review.quote}”
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label="Previous review"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 font-display text-lg text-black transition hover:border-umx-orange hover:text-umx-orange"
              onClick={() => go(index - 1)}
            >
              ‹
            </button>
            <div className="flex gap-2" role="tablist" aria-label="Reviews">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to review ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-7 bg-umx-orange" : "w-2 bg-black/20"
                  }`}
                  onClick={() => go(i)}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next review"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 font-display text-lg text-black transition hover:border-umx-orange hover:text-umx-orange"
              onClick={() => go(index + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
