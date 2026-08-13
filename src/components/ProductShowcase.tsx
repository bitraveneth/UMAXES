"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { useCart } from "@/context/CartContext";
import { flavors, type Flavor } from "@/lib/assets";

function FlavorMarquee() {
  const names = [...flavors, ...flavors].map((f) => f.name);
  return (
    <div
      className="relative mt-10 overflow-hidden border-y border-black/8 py-3.5"
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-umx-cream to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-umx-cream to-transparent sm:w-24" />
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

function FlavorCard({ flavor, index }: { flavor: Flavor; index: number }) {
  const { add } = useCart();
  const cardRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [added, setAdded] = useState(false);

  const onMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (py - 0.5) * -8,
      y: (px - 0.5) * 10,
    });
  }, []);

  const onLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  function handleAdd() {
    add(flavor.id);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  }

  const n = String(index + 1).padStart(2, "0");

  return (
    <article
      ref={cardRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="flavor-card-enter group relative isolate h-full"
      style={
        {
          "--flavor-accent": flavor.accent,
          animationDelay: `${index * 55}ms`,
          transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.18s ease-out",
        } as CSSProperties
      }
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-umx-cream-bright shadow-[0_16px_44px_rgba(61,22,5,0.08)] ring-1 ring-black/6 transition duration-500 group-hover:shadow-[0_30px_70px_rgba(61,22,5,0.16)] group-hover:ring-[var(--flavor-accent)]/45">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 z-20 h-1 origin-left scale-x-0 bg-[var(--flavor-accent)] transition duration-500 group-hover:scale-x-100"
        />

        <div className="relative aspect-square overflow-hidden">
          <Link href={`/product/${flavor.id}`} className="absolute inset-0 block">
            <Image
              src={flavor.image}
              alt={flavor.name}
              fill
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={70}
              priority={index < 3}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-0 transition duration-300 group-hover:opacity-100"
            >
              <div
                className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ animation: "flavor-shine 1.1s ease-out" }}
              />
            </div>

            <span
              aria-hidden
              className="absolute top-3 left-3 z-10 rounded-full bg-black/25 px-2.5 py-1 font-display text-[0.65rem] font-bold tracking-wider text-white backdrop-blur-sm"
            >
              {n}
            </span>
          </Link>

          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Add ${flavor.name} to cart`}
            className={`absolute top-3 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full shadow-[0_8px_22px_rgba(0,0,0,0.28)] transition duration-300 sm:h-12 sm:w-12 sm:translate-y-2 sm:scale-90 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:scale-100 sm:group-hover:opacity-100 ${
              added
                ? "bg-umx-orange text-white"
                : "bg-umx-cream text-black hover:bg-umx-orange hover:text-white"
            }`}
          >
            {added ? (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 6h15l-1.5 9h-12z" />
                <path d="M6 6l-1-3H2" />
                <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <div className="min-w-0">
            <Link href={`/product/${flavor.id}`}>
              <h3 className="truncate font-display text-base font-bold tracking-tight text-black transition hover:text-umx-orange sm:text-lg">
                {flavor.name}
              </h3>
            </Link>
            <p className="mt-0.5 font-display text-sm font-semibold text-black/70">
              ${flavor.price}
              <span className="text-black/35">.00</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`shrink-0 rounded-full px-4 py-2.5 font-display text-xs font-semibold tracking-wide text-white transition duration-300 sm:px-5 sm:text-sm ${
              added
                ? "bg-umx-orange"
                : "bg-black hover:bg-umx-orange"
            }`}
          >
            {added ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ProductShowcase() {
  return (
    <section
      id="products"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-umx-orange/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 left-0 h-80 w-80 -translate-x-1/4 rounded-full bg-umx-cream-deep/55 blur-3xl"
      />
      <p
        aria-hidden
        className="pointer-events-none absolute top-[6%] left-1/2 -translate-x-1/2 font-display text-[clamp(5.5rem,20vw,16rem)] font-extrabold tracking-[-0.06em] text-black/[0.04] uppercase select-none"
      >
        HOOKAMAX
      </p>

      <div className="relative mx-auto max-w-[1200px]">
        <header className="mx-auto max-w-4xl text-center">
          <p className="font-display text-xs font-semibold tracking-[0.22em] text-umx-orange uppercase sm:text-sm">
            Shop the collection
          </p>

          <h2 className="mt-5 sm:mt-6">
            <span className="sr-only">HOOKAMAX</span>
            <span
              aria-hidden
              className="flex flex-wrap items-baseline justify-center gap-x-[0.18em] font-display text-[clamp(3.5rem,12vw,7.5rem)] font-extrabold leading-none tracking-[-0.045em]"
            >
              <span className="text-black">HOOKA</span>
              <span className="relative text-umx-orange">
                MAX
                <span className="absolute -bottom-[0.12em] left-0 h-[0.09em] w-full rounded-full bg-umx-orange/35" />
              </span>
            </span>
          </h2>

          <div
            aria-hidden
            className="mx-auto mt-6 flex items-center justify-center gap-3 sm:mt-7"
          >
            <span className="h-px w-10 bg-black/15 sm:w-14" />
            <span className="h-1.5 w-1.5 rotate-45 bg-umx-orange" />
            <span className="h-px w-10 bg-black/15 sm:w-14" />
          </div>

          <p className="mx-auto mt-5 max-w-2xl font-body text-lg leading-relaxed text-black/70 sm:mt-6 sm:text-xl">
            Hookah-inspired profiles. One premium device. Pick the taste that
            fits your mood — then add it to your cart.
          </p>
        </header>

        <FlavorMarquee />

        {/* 9 products · 3 columns · equal cards */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
          {flavors.map((flavor, index) => (
            <FlavorCard key={flavor.id} flavor={flavor} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
