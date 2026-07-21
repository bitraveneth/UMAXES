"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

export default function BrandFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const syncPlayback = useEffectEvent((visible: boolean, shouldPlay: boolean) => {
    const video = videoRef.current;
    if (!video) return;
    if (visible && shouldPlay) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) =>
        setInView(entry.isIntersecting && entry.intersectionRatio >= 0.25),
      { threshold: [0, 0.25, 0.5] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView) setMediaReady(true);
  }, [inView]);

  useEffect(() => {
    if (reducedMotion) {
      syncPlayback(false, false);
      return;
    }
    syncPlayback(inView && mediaReady, playing);
  }, [inView, playing, reducedMotion, mediaReady]);

  const togglePlay = () => {
    setPlaying((prev) => !prev);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
  };

  return (
    <section
      ref={sectionRef}
      id="film"
      className="relative overflow-hidden bg-umx-cream"
      aria-label="UMAXES brand film"
    >
      <div className="px-3 pt-16 pb-10 sm:px-5 sm:pt-24 sm:pb-14 md:px-6 md:pt-28">
        <header className="mx-auto max-w-3xl px-1 text-center sm:px-0">
          <p className="font-display text-[0.7rem] font-semibold tracking-[0.22em] text-umx-orange uppercase sm:text-sm">
            In motion
          </p>
          <h2 className="mt-3 font-display text-[clamp(2.1rem,8vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.035em] text-black sm:mt-4">
            Watch the <span className="text-umx-orange">draw</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-[0.95rem] leading-relaxed text-black/65 sm:mt-4 sm:max-w-lg sm:text-lg">
            Mythic form, hookah-inspired flavor, and a smooth modern session —
            see UMAXES come alive.
          </p>
        </header>

        {/* Mobile: cream matte frame like a device/screen. Desktop: larger cinema frame. */}
        <div className="group/film relative mx-auto mt-8 w-full max-w-[1680px] sm:mt-12">
          <div className="rounded-[1.65rem] bg-white p-2 shadow-[0_18px_50px_rgba(61,22,5,0.12)] ring-1 ring-black/8 sm:rounded-[2.25rem] sm:p-2.5 md:rounded-[2.75rem] md:p-3">
            <div className="relative overflow-hidden rounded-[1.25rem] bg-umx-orange-ink sm:rounded-[1.85rem] md:rounded-[2.25rem]">
              <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] md:aspect-[21/9]">
                <video
                  ref={videoRef}
                  className={`absolute inset-0 h-full w-full object-cover transition duration-[1.1s] ease-out ${
                    inView ? "scale-100 opacity-100" : "scale-[1.02] opacity-95"
                  }`}
                  src={mediaReady ? "/videos/umaxes-film-web.mp4" : undefined}
                  poster="/videos/umaxes-film-poster.jpg"
                  playsInline
                  muted={muted}
                  loop
                  preload="none"
                  aria-label="UMAXES brand film video"
                />

                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-umx-orange-ink/50 via-transparent to-black/10"
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4 sm:pb-6">
                  <div
                    className={`pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/20 bg-umx-orange-ink/65 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 ease-out ${
                      playing
                        ? "translate-y-0 opacity-100 sm:translate-y-2 sm:opacity-0 sm:group-hover/film:translate-y-0 sm:group-hover/film:opacity-100 sm:group-focus-within/film:translate-y-0 sm:group-focus-within/film:opacity-100"
                        : "translate-y-0 opacity-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-umx-orange text-white transition duration-300 hover:bg-umx-orange-mid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:h-14 sm:w-14"
                      aria-label={playing ? "Pause film" : "Play film"}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/25 to-transparent opacity-80"
                      />
                      {playing ? (
                        <Pause
                          className="relative h-5 w-5"
                          strokeWidth={2.4}
                          fill="currentColor"
                          aria-hidden
                        />
                      ) : (
                        <Play
                          className="relative ml-0.5 h-5 w-5"
                          strokeWidth={2.4}
                          fill="currentColor"
                          aria-hidden
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={toggleMute}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-white transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:h-14 sm:w-14 ${
                        muted
                          ? "bg-white/10 hover:bg-white/18"
                          : "bg-white/20 hover:bg-white/28"
                      }`}
                      aria-label={muted ? "Unmute film" : "Mute film"}
                      aria-pressed={!muted}
                    >
                      {muted ? (
                        <VolumeX className="h-5 w-5" strokeWidth={2.1} aria-hidden />
                      ) : (
                        <Volume2 className="h-5 w-5" strokeWidth={2.1} aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
