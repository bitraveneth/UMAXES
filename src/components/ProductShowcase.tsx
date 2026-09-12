"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { flavors, type Flavor } from "@/lib/assets";

const SWIPE_THRESHOLD = 48;
const DESKTOP_MQ = "(min-width: 640px)";

function subscribeDesktop(onStoreChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_MQ).matches;
}

function getServerSnapshot() {
  return false;
}

function usePageSize() {
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerSnapshot,
  );
  return isDesktop ? 2 : 1;
}

function FlavorMarquee() {
  const names = [...flavors, ...flavors].map((f) => f.name);
  return (
    <div
      className="relative mt-10 overflow-hidden border-y border-black/8 py-3.5"
      aria-hidden
    >
      <div className="animate-flavor-marquee flex w-max items-center gap-8 pr-8">
        {names.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="inline-flex items-center gap-8 font-display text-sm font-semibold tracking-[0.14em] text-black/35 uppercase"
          >
            {name}
            <span className="h-1.5 w-1.5 rotate-45 bg-umx-orange" />
          </span>
        ))}
      </div>
    </div>
  );
}

function FlavorPoster({
  flavor,
  priority = false,
}: {
  flavor: Flavor;
  priority?: boolean;
}) {
  return (
    <Link href={`/product/${flavor.id}`} className="group min-w-0">
      <div
        className="relative aspect-[1/1] overflow-hidden rounded-[1.35rem] ring-1 ring-black/8 sm:rounded-[1.75rem]"
        style={{ backgroundColor: flavor.accent }}
      >
        <Image
          src={flavor.image}
          alt={flavor.name}
          fill
          priority={priority}
          loading={priority ? undefined : "eager"}
          className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 92vw, 42vw"
          quality={75}
        />
      </div>
      <div className="mt-3.5 sm:mt-5">
        <p className="font-display text-[0.62rem] font-semibold tracking-[0.22em] text-black/35 uppercase sm:text-[0.7rem]">
          HOOKAMAX
        </p>
        <h3 className="mt-1 font-display text-[1.05rem] font-extrabold tracking-[-0.035em] text-black sm:mt-1.5 sm:text-[1.85rem] sm:leading-none">
          {flavor.name}
        </h3>
        <span
          aria-hidden
          className="mt-2 block h-px w-8 origin-left bg-black/70 transition-all duration-300 group-hover:w-14 sm:mt-2.5"
        />
        <p className="mt-2 font-body text-sm leading-snug text-black/50">
          {flavor.tagline}
        </p>
      </div>
    </Link>
  );
}

function ArrowButton({
  label,
  onClick,
  side,
}: {
  label: string;
  onClick: () => void;
  side: "prev" | "next";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-[42%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black ring-1 ring-black/8 transition hover:bg-black hover:text-white sm:h-12 sm:w-12 ${
        side === "prev" ? "-left-1 sm:-left-5" : "-right-1 sm:-right-5"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 sm:h-6 sm:w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {side === "prev" ? (
          <path d="M14.5 5.5 8 12l6.5 6.5" />
        ) : (
          <path d="M9.5 5.5 16 12l-6.5 6.5" />
        )}
      </svg>
    </button>
  );
}

const AUTO_MS = 4500;

export default function ProductShowcase() {
  const pageSize = usePageSize();
  const count = flavors.length;
  const lead = pageSize;
  const track = [
    ...flavors.slice(-pageSize),
    ...flavors,
    ...flavors.slice(0, pageSize),
  ];

  const [slide, setSlide] = useState(pageSize);
  const [anim, setAnim] = useState(true);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragX = useRef<number | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    setAnim(false);
    setSlide(pageSize);
  }, [pageSize]);

  const goBy = useCallback((delta: number) => {
    setAnim(true);
    setSlide((s) => s + delta);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.28 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    const id = window.setTimeout(() => goBy(1), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [slide, paused, inView, goBy]);

  function onTransitionEnd(e: ReactTransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (slide >= lead + count) {
      setAnim(false);
      setSlide(slide - count);
    } else if (slide < lead) {
      setAnim(false);
      setSlide(slide + count);
    }
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    dragX.current = e.clientX;
    dragged.current = false;
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragX.current == null) return;
    if (Math.abs(e.clientX - dragX.current) > 8) dragged.current = true;
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragX.current == null) return;
    const dx = e.clientX - dragX.current;
    dragX.current = null;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      goBy(dx < 0 ? 1 : -1);
    }
  }

  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    if (!dragged.current) return;
    e.preventDefault();
    e.stopPropagation();
    dragged.current = false;
  }

  return (
    <section
      id="products"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
    >
      <p
        aria-hidden
        className="pointer-events-none absolute top-[6%] left-1/2 -translate-x-1/2 font-display text-[clamp(5rem,16vw,12rem)] font-extrabold tracking-[-0.06em] text-black/[0.035] uppercase select-none"
      >
        HOOKAMAX
      </p>

      <div className="relative mx-auto max-w-[1200px]">
        <header className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
            Shop the collection
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,6vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            HOOKA
            <span className="text-umx-orange">MAX</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-body text-base leading-relaxed text-black/65 sm:text-lg">
            Hookah-inspired profiles. One premium device. Pick the taste that
            fits your mood — then add it to your cart.
          </p>
        </header>

        <FlavorMarquee />

        <div className="relative mt-14 sm:mt-16" ref={rootRef}>
          <div
            className="relative touch-pan-y select-none px-8 sm:px-10"
            aria-roledescription="carousel"
            aria-label="HOOKAMAX flavors"
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              dragX.current = null;
            }}
            onClickCapture={onClickCapture}
          >
            <ArrowButton
              label="Previous flavors"
              side="prev"
              onClick={() => goBy(-1)}
            />
            <ArrowButton
              label="Next flavors"
              side="next"
              onClick={() => goBy(1)}
            />

            <div className="overflow-hidden">
              <div
                className="flex ease-out"
                style={{
                  transform: `translate3d(-${slide * (100 / pageSize)}%, 0, 0)`,
                  transition: anim
                    ? "transform 560ms cubic-bezier(0.22, 1, 0.36, 1)"
                    : "none",
                }}
                onTransitionEnd={onTransitionEnd}
              >
                {track.map((flavor, i) => (
                  <div
                    key={`${flavor.id}-${i}`}
                    className="shrink-0 px-1.5 sm:px-3.5"
                    style={{ width: `${100 / pageSize}%` }}
                    aria-hidden={i < slide || i >= slide + pageSize}
                  >
                    <FlavorPoster
                      flavor={flavor}
                      priority={i >= lead && i < lead + pageSize}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
