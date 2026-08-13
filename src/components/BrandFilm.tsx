"use client";

import BrandFilmShareSheet from "@/components/BrandFilmShareSheet";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

const controlBtn =
  "group/btn relative flex h-11 w-11 items-center justify-center rounded-full text-white transition-[transform,background-color,box-shadow,color] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:h-12 sm:w-12";

const SHARE_TITLE = "UMAXES — In motion";
const SHARE_TEXT = "Watch the draw — UMAXES brand film";

export default function BrandFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("#film");
  const [linkCopied, setLinkCopied] = useState(false);

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

  useEffect(() => {
    const onFs = () => {
      const node = frameRef.current;
      setIsFullscreen(Boolean(node && document.fullscreenElement === node));
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!linkCopied) return;
    const t = window.setTimeout(() => setLinkCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [linkCopied]);

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

  const toggleFullscreen = async () => {
    const node = frameRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement === node) {
        await document.exitFullscreen();
      } else {
        await node.requestFullscreen();
      }
    } catch {
      /* fullscreen may be blocked by the browser */
    }
  };

  const openShare = () => {
    setShareUrl(
      `${window.location.origin}${window.location.pathname}#film`,
    );
    setLinkCopied(false);
    setShareOpen(true);
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
            <div
              ref={frameRef}
              className="film-stage relative overflow-hidden rounded-[1.25rem] bg-umx-orange-ink sm:rounded-[1.85rem] md:rounded-[2.25rem]"
            >
              <div
                className={`film-viewport relative w-full ${
                  isFullscreen
                    ? "h-full min-h-full aspect-auto"
                    : "aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9]"
                }`}
              >
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

                {shareOpen ? (
                  <button
                    type="button"
                    className="absolute inset-0 z-[15] bg-black/20"
                    aria-label="Close share sheet"
                    onClick={() => setShareOpen(false)}
                  />
                ) : null}

                <div
                  className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-end px-3 pb-3 sm:px-5 sm:pb-5 ${
                    isFullscreen || !playing || shareOpen
                      ? "opacity-100"
                      : "opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover/film:opacity-100 sm:group-focus-within/film:opacity-100"
                  }`}
                >
                  <div className="pointer-events-auto relative">
                    <BrandFilmShareSheet
                      open={shareOpen}
                      onClose={() => setShareOpen(false)}
                      url={shareUrl}
                      title={SHARE_TITLE}
                      text={SHARE_TEXT}
                      copied={linkCopied}
                      onCopied={() => setLinkCopied(true)}
                    />
                    <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:gap-2 sm:p-2">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className={`${controlBtn} bg-umx-orange shadow-[0_8px_20px_rgba(255,91,4,0.35)] hover:scale-105 hover:bg-umx-orange-mid hover:shadow-[0_10px_28px_rgba(255,91,4,0.5)]`}
                        aria-label={playing ? "Pause film" : "Play film"}
                      >
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-70 transition-opacity duration-300 group-hover/btn:opacity-100"
                        />
                        {playing ? (
                          <Pause
                            className="relative h-[18px] w-[18px] sm:h-5 sm:w-5"
                            strokeWidth={2.4}
                            fill="currentColor"
                            aria-hidden
                          />
                        ) : (
                          <Play
                            className="relative ml-0.5 h-[18px] w-[18px] sm:h-5 sm:w-5"
                            strokeWidth={2.4}
                            fill="currentColor"
                            aria-hidden
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={toggleMute}
                        className={`${controlBtn} bg-white/10 hover:scale-105 hover:bg-white/22 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.35)]`}
                        aria-label={muted ? "Unmute film" : "Mute film"}
                        aria-pressed={!muted}
                      >
                        {muted ? (
                          <VolumeX
                            className="h-[18px] w-[18px] transition-transform duration-300 group-hover/btn:scale-110 sm:h-5 sm:w-5"
                            strokeWidth={2.1}
                            aria-hidden
                          />
                        ) : (
                          <Volume2
                            className="h-[18px] w-[18px] transition-transform duration-300 group-hover/btn:scale-110 sm:h-5 sm:w-5"
                            strokeWidth={2.1}
                            aria-hidden
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={openShare}
                        className={`${controlBtn} bg-white/10 hover:scale-105 hover:bg-white/22 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.35)] ${
                          shareOpen ? "bg-white/22 ring-1 ring-white/35" : ""
                        }`}
                        aria-label="Share film"
                        aria-haspopup="dialog"
                        aria-expanded={shareOpen}
                      >
                        <Share2
                          className="h-[17px] w-[17px] transition-transform duration-300 group-hover/btn:scale-110 sm:h-[18px] sm:w-[18px]"
                          strokeWidth={2.1}
                          aria-hidden
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleFullscreen()}
                        className={`${controlBtn} bg-white/10 hover:scale-105 hover:bg-white/22 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.35)]`}
                        aria-label={
                          isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                        }
                        aria-pressed={isFullscreen}
                      >
                        {isFullscreen ? (
                          <Minimize2
                            className="h-[17px] w-[17px] transition-transform duration-300 group-hover/btn:scale-110 sm:h-[18px] sm:w-[18px]"
                            strokeWidth={2.1}
                            aria-hidden
                          />
                        ) : (
                          <Maximize2
                            className="h-[17px] w-[17px] transition-transform duration-300 group-hover/btn:scale-110 sm:h-[18px] sm:w-[18px]"
                            strokeWidth={2.1}
                            aria-hidden
                          />
                        )}
                      </button>
                    </div>
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
