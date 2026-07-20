"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { heroImages } from "@/lib/assets";

const DURATION = 5500;

const slides = [
  {
    src: heroImages[0],
    title: "Elevate Every Puff",
    subtitle: "Rich Hookah Flavors. Modern Vaping Experience.",
    cta: "Buy now",
  },
  {
    src: heroImages[1],
    title: "Luxury in Every Draw",
    subtitle: "Crafted for Smooth Flavor & Lasting Satisfaction.",
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
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const go = useCallback((next: number) => {
    const n = slides.length;
    setIndex(((next % n) + n) % n);
  }, []);

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
      className="bg-umx-cream px-3 pb-4 pt-[8.5rem] sm:px-4 sm:pb-5 sm:pt-[9rem] md:px-5 md:pb-6"
      aria-label="UMAXES hero"
    >
      {/* Floating box slideshow — almost full screen, cream frame shows the curve */}
      <div
        className="relative mx-auto h-[calc(100svh-9.75rem)] min-h-[520px] w-full max-w-[1680px] overflow-hidden rounded-[1.75rem] bg-umx-orange-ink shadow-[0_22px_55px_rgba(61,22,5,0.16)] touch-pan-y select-none sm:rounded-[2.15rem] md:h-[calc(100svh-10.5rem)] md:rounded-[2.5rem]"
        aria-roledescription="carousel"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          tracking.current = false;
        }}
      >
        {/* Full-bleed slides */}
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? "z-[1] opacity-100" : "z-0 opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              priority={i === 0}
              sizes="(max-width: 1400px) 100vw, 1400px"
              className="object-cover object-center"
            />
          </div>
        ))}

        {/* Soft scrim for left copy */}
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-umx-orange-ink/65 via-umx-orange-ink/20 to-transparent max-md:from-umx-orange-ink/55 max-md:via-umx-orange-ink/30" />

        {/* Left copy */}
        <div className="absolute inset-y-0 left-0 z-[3] flex w-full max-w-2xl flex-col justify-center px-6 sm:px-10 md:px-14 lg:px-20">
          <h1
            key={active.title}
            className="font-display text-[clamp(2.75rem,6.5vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-umx-cream animate-[hero-copy-in_0.55s_ease-out]"
          >
            {active.title}
          </h1>
          <p
            key={active.subtitle}
            className="mt-4 max-w-md font-body text-base text-umx-cream/90 sm:text-xl animate-[hero-copy-in_0.55s_ease-out]"
          >
            {active.subtitle}
          </p>
          <a
            href="#products"
            className="group mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-umx-cream px-6 py-3.5 font-display text-sm font-semibold tracking-[0.04em] text-black shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition duration-300 hover:bg-umx-orange hover:text-white hover:shadow-[0_12px_32px_rgba(255,91,4,0.35)] sm:mt-10 sm:gap-3.5 sm:px-8 sm:py-4 sm:text-base"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span>{active.cta}</span>
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-umx-cream transition duration-300 group-hover:bg-white group-hover:text-umx-orange sm:h-9 sm:w-9"
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
          </a>
        </div>

        {/* Arrows */}
        <button
          type="button"
          aria-label="Previous slide"
          className="absolute top-1/2 left-3 z-[4] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-umx-cream/15 font-display text-xl text-umx-cream backdrop-blur-md transition hover:bg-umx-cream/25 sm:left-5 sm:h-11 sm:w-11"
          onClick={() => goTo(index - 1)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next slide"
          className="absolute top-1/2 right-3 z-[4] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-umx-cream/15 font-display text-xl text-umx-cream backdrop-blur-md transition hover:bg-umx-cream/25 sm:right-5 sm:h-11 sm:w-11"
          onClick={() => goTo(index + 1)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ›
        </button>

        {/* Progress buttons */}
        <div
          className="absolute bottom-5 left-1/2 z-[5] flex -translate-x-1/2 items-center gap-2.5 sm:bottom-7 sm:gap-3"
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
              className={`relative h-2.5 overflow-hidden rounded-full transition-all duration-300 ${
                i === index
                  ? "w-11 bg-umx-cream/25 ring-1 ring-umx-cream/40 sm:w-12"
                  : "w-2.5 bg-umx-cream/50 hover:scale-110 hover:bg-umx-cream"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
            >
              {i === index && !paused && (
                <span
                  key={`${index}-run`}
                  className="absolute inset-y-0 left-0 block rounded-full bg-umx-cream"
                  style={{
                    animation: `hero-progress ${DURATION}ms linear forwards`,
                  }}
                />
              )}
              {i === index && paused && (
                <span className="absolute inset-y-0 left-0 block w-2/5 rounded-full bg-umx-cream" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
