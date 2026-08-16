"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { heroImages } from "@/lib/assets";

const HERO_VIDEO = "/videos/umaxes-film-web.mp4";
const HERO_POSTER = "/videos/umaxes-film-poster.jpg";

/** Full-screen brand film. Scroll down to reach the menu. */
export default function HeroFilmBand() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion || failed) return;
    void videoRef.current?.play().catch(() => setFailed(true));
  }, [reducedMotion, failed]);

  const showVideo = !reducedMotion && !failed;

  return (
    <section
      aria-label="UMAXES brand film"
      className="relative h-svh min-h-[100svh] w-full overflow-hidden bg-black"
    >
      <Image
        src={heroImages[1]}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {showVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 z-[1] h-full w-full object-cover"
          src={HERO_VIDEO}
          poster={HERO_POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/55 via-transparent to-black/25"
      />

      <a
        href="#site-menu"
        className="absolute bottom-7 left-1/2 z-[3] flex -translate-x-1/2 flex-col items-center gap-2 text-white/80 transition hover:text-white"
      >
        <span className="font-display text-[0.65rem] font-semibold tracking-[0.22em] uppercase">
          Scroll
        </span>
        <span
          aria-hidden
          className="block h-8 w-px animate-pulse bg-white/70"
        />
      </a>
    </section>
  );
}
