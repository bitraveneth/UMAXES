"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
  {
    src: testimonialImages[4],
    name: "Chen",
    quote: "The look turns heads. Sessions feel intentional.",
  },
  {
    src: testimonialImages[5],
    name: "Sofia",
    quote: "Rich taste from first hit to last. My go-to now.",
  },
  {
    src: testimonialImages[6],
    name: "Noah",
    quote: "Solid build, bold flavor. Feels like a step up.",
  },
  {
    src: testimonialImages[7],
    name: "Mia",
    quote: "Everyday carry that still feels special.",
  },
] as const;

const AUTO_MS = 4200;
const N = reviews.length;
const LOOP = [...reviews, ...reviews, ...reviews];
const BASE = N; // middle copy

function wrap(i: number) {
  return ((i % N) + N) % N;
}

function useVisibleCount() {
  const [count, setCount] = useState(4);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCount(4);
      else if (w >= 640) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

export default function Testimonials() {
  const visible = useVisibleCount();
  const [index, setIndex] = useState<number>(BASE);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [animate, setAnimate] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragX = useRef(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const next = useCallback(() => setIndex((i) => i + 1), []);
  const prev = useCallback(() => setIndex((i) => i - 1), []);

  // Autoplay only while this section is on screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting && entry.intersectionRatio >= 0.3);
      },
      { threshold: [0, 0.3, 0.55] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || paused || isDragging) return;
    const id = window.setTimeout(next, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [index, inView, paused, isDragging, next]);

  // Seamless loop: after slide lands outside middle copy, snap back
  useEffect(() => {
    if (index >= BASE && index < BASE + N) return;

    const id = window.setTimeout(() => {
      setAnimate(false);
      setIndex(BASE + wrap(index));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
    }, 620);

    return () => window.clearTimeout(id);
  }, [index]);

  function onPointerDown(e: ReactPointerEvent) {
    dragging.current = true;
    setIsDragging(true);
    startX.current = e.clientX;
    dragX.current = 0;
    setPaused(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!dragging.current) return;
    dragX.current = e.clientX - startX.current;
    setDragOffset(dragX.current);
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    if (dragX.current < -56) next();
    else if (dragX.current > 56) prev();
    setDragOffset(0);
    setPaused(false);
  }

  const slidePct = 100 / visible;
  const trackWidth = trackRef.current?.offsetWidth ?? 1;
  const dragPct = (dragOffset / trackWidth) * 100;
  const activeDot = wrap(index);

  return (
    <section
      ref={sectionRef}
      id="community"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
    >
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

        <div
          className="relative mt-12 sm:mt-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            ref={trackRef}
            className="cursor-grab overflow-hidden touch-pan-y active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className="flex will-change-transform"
              style={{
                transform: `translateX(calc(-${index * slidePct}% + ${dragPct}%))`,
                transition:
                  isDragging || !animate
                    ? "none"
                    : "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {LOOP.map((review, i) => (
                <article
                  key={`${review.src}-${i}`}
                  className="shrink-0 px-1.5 sm:px-2"
                  style={{ width: `${slidePct}%` }}
                  aria-roledescription="slide"
                  aria-label={`${wrap(i) + 1} of ${N}`}
                >
                  <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-black/5">
                    <Image
                      src={review.src}
                      alt={`Review by ${review.name}`}
                      fill
                      className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                      quality={75}
                      priority={i >= BASE && i < BASE + 4}
                      draggable={false}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 pt-14 pb-4 sm:px-5 sm:pb-5">
                      <p className="font-display text-sm font-bold text-white">
                        {review.name}
                      </p>
                      <p className="mt-1 line-clamp-2 font-body text-xs leading-relaxed text-white/85 sm:text-sm">
                        “{review.quote}”
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 sm:mt-10">
            <button
              type="button"
              aria-label="Previous reviews"
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black transition hover:border-umx-orange hover:text-umx-orange"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to review ${i + 1}`}
                  aria-current={i === activeDot ? "true" : undefined}
                  onClick={() => {
                    setAnimate(true);
                    setIndex(BASE + i);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeDot
                      ? "w-7 bg-umx-orange"
                      : "w-1.5 bg-black/20 hover:bg-black/40"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next reviews"
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black transition hover:border-umx-orange hover:text-umx-orange"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
