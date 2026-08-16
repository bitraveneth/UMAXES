"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { heroImages } from "@/lib/assets";

const DURATION = 5500;

/** Slide 1 = client-requested “Luxury in Every Draw” still (hero/02). */
const slides = [
  {
    src: heroImages[1],
    title: "Luxury in Every Draw",
    subtitle: "Crafted for Smooth Flavor & Lasting Satisfaction.",
    cta: "Buy now",
  },
  {
    src: heroImages[0],
    title: "Elevate Every Puff",
    subtitle: "Rich Hookah Flavors. Modern Vaping Experience.",
    cta: "Buy now",
  },
  {
    src: heroImages[2],
    title: "Taste Beyond Limits",
    subtitle: "Bold Flavors. Smooth Clouds. Premium Quality.",
    cta: "Buy now",
  },
  {
    src: heroImages[3],
    title: "Flavor Without Compromise",
    subtitle: "Discover Hookah-Inspired Vapes for Every Mood.",
    cta: "Buy now",
  },
] as const;

export default function HeroProgress() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const go = useCallback((next: number) => {
    const n = slides.length;
    setIndex(((next % n) + n) % n);
  }, []);

  useEffect(() => {
    setLoaded((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, [index]);

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => go(index + 1), DURATION);
    return () => window.clearTimeout(id);
  }, [index, paused, go]);

  function onPointerDown(e: React.PointerEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    tracking.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!tracking.current) return;
    tracking.current = false;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? index + 1 : index - 1);
  }

  function goTo(i: number) {
    setPaused(false);
    go(i);
  }

  const active = slides[index];

  return (
    <section
      id="top"
      className="bg-umx-cream px-2.5 py-3 sm:px-4 sm:py-5 md:px-5 md:py-6"
      aria-label="UMAXES banner"
    >
      <div
        className="relative mx-auto min-h-[22.5rem] h-[min(68svh,34rem)] w-full max-w-[1680px] overflow-hidden rounded-[1.25rem] bg-black shadow-[0_22px_55px_rgba(0,0,0,0.18)] touch-pan-y select-none sm:min-h-[32rem] sm:h-[min(80svh,48rem)] sm:rounded-[2.15rem] md:rounded-[2.5rem]"
        aria-roledescription="carousel"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          tracking.current = false;
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? "z-[1] opacity-100" : "z-0 opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {loaded.has(i) && (
              <Image
                src={slide.src}
                alt=""
                fill
                priority={i === 0}
                fetchPriority={i === 0 ? "high" : "auto"}
                quality={70}
                sizes="(max-width: 640px) 100vw, 1200px"
                className="object-cover object-[center_30%] sm:object-[center_42%]"
              />
            )}
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/80 via-black/40 to-black/15 sm:bg-gradient-to-r sm:from-black/65 sm:via-black/20 sm:to-transparent" />

        <div className="absolute inset-0 z-[3] flex flex-col justify-end px-5 pb-[4.25rem] pt-6 sm:justify-center sm:px-12 sm:pb-16 sm:pt-8 md:px-16 lg:px-20">
          <div className="w-full max-w-[17.5rem] sm:max-w-[min(100%,34rem)]">
            <h1
              key={active.title}
              className="font-display text-[1.7rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-white text-pretty sm:text-[clamp(1.85rem,5.5vw,4.25rem)] sm:leading-[1.02] sm:tracking-[-0.035em] sm:text-balance animate-[hero-copy-in_0.55s_ease-out]"
            >
              {active.title}
            </h1>
            <p
              key={active.subtitle}
              className="mt-2.5 max-w-[16.5rem] font-body text-[0.8125rem] leading-[1.45] text-white/88 sm:mt-5 sm:max-w-[28rem] sm:text-lg sm:leading-[1.45] sm:text-white/90 animate-[hero-copy-in_0.55s_ease-out]"
            >
              {active.subtitle}
            </p>
            <Link
              href="/shop"
              className="group mt-4 inline-flex w-fit items-center gap-2.5 rounded-full bg-white px-4 py-2.5 font-display text-[0.8125rem] font-semibold tracking-[0.04em] text-black shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition duration-300 hover:bg-black hover:text-white sm:mt-8 sm:gap-3.5 sm:px-7 sm:py-3.5 sm:text-base"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <span>{active.cta}</span>
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

        <button
          type="button"
          aria-label="Previous slide"
          className="absolute top-1/2 left-3 z-[4] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 font-display text-xl text-white backdrop-blur-md transition hover:bg-white/25 sm:left-6 sm:flex sm:h-11 sm:w-11"
          onClick={() => goTo(index - 1)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next slide"
          className="absolute top-1/2 right-3 z-[4] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 font-display text-xl text-white backdrop-blur-md transition hover:bg-white/25 sm:right-6 sm:flex sm:h-11 sm:w-11"
          onClick={() => goTo(index + 1)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ›
        </button>

        <div
          className="absolute bottom-3.5 left-1/2 z-[5] flex -translate-x-1/2 items-center gap-1.5 sm:bottom-7 sm:gap-2.5"
          role="tablist"
          aria-label="Hero slides"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              className={`relative h-2 overflow-hidden rounded-full transition-all duration-300 sm:h-2.5 ${
                i === index
                  ? "w-9 bg-white/25 ring-1 ring-white/40 sm:w-12"
                  : "w-2 bg-white/50 hover:scale-110 hover:bg-white sm:w-2.5"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
            >
              {i === index && !paused && (
                <span
                  key={`${index}-run`}
                  className="absolute inset-y-0 left-0 block rounded-full bg-white"
                  style={{
                    animation: `hero-progress ${DURATION}ms linear forwards`,
                  }}
                />
              )}
              {i === index && paused && (
                <span className="absolute inset-y-0 left-0 block w-2/5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
