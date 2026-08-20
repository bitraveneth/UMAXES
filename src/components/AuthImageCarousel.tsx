"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { heroImages, productImages } from "@/lib/assets";

const SLIDES = [
  heroImages[0],
  heroImages[1],
  heroImages[2],
  heroImages[3],
  productImages[0],
  productImages[2],
  productImages[4],
] as const;

const INTERVAL_MS = 4500;

export default function AuthImageCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <aside
      className="relative hidden h-full w-[58%] shrink-0 overflow-hidden lg:block"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="UMAXES product images"
    >
      {SLIDES.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 58vw, 0px"
            className={`object-cover object-center transition-transform duration-[4500ms] ease-out ${
              i === index ? "scale-105" : "scale-100"
            }`}
          />
        </div>
      ))}

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/25"
      />

      <div className="absolute inset-x-0 bottom-5 z-[1] flex justify-center gap-1.5 px-4">
        {SLIDES.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Show image ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-6 bg-umx-orange"
                : "w-1.5 bg-white/45 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </aside>
  );
}
