"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Sparkles, Zap, User, Quote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";

const differences: {
  n: string;
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    n: "01",
    title: "Maximum flavor",
    body: "Carefully developed flavor profiles and continuous flavor optimization create a rich, balanced, and satisfying taste experience.",
    icon: Sparkles,
  },
  {
    n: "02",
    title: "Powerful performance",
    body: "Designed with advanced device technology to deliver smooth airflow, consistent vapor production, and reliable performance throughout the product experience.",
    icon: Zap,
  },
  {
    n: "03",
    title: "Designed for you",
    body: "Modern, distinctive, and easy to use. Every UMAXES product combines functional design with a bold visual identity made for today's adult consumers.",
    icon: User,
  },
];

const stats = [
  { end: 20000, unit: "m²", suffix: "", label: "Production area" },
  { end: 10, unit: "M", suffix: "USD", label: "Investment" },
  { end: 200, unit: "M", suffix: "USD", label: "Output value" },
] as const;

function useCount(end: number, run: boolean) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    const duration = 2200;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setN(Math.round(end * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, run]);

  return n;
}

function Stat({
  end,
  unit,
  suffix,
  label,
  run,
}: {
  end: number;
  unit: string;
  suffix: string;
  label: string;
  run: boolean;
}) {
  const n = useCount(end, run);
  const display = end >= 1000 ? n.toLocaleString("en-US") : String(n);

  return (
    <div className="rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-[0_12px_36px_rgba(0,0,0,0.08)] ring-1 ring-black/10 sm:px-8 sm:py-12">
      <p className="font-display text-[clamp(2.75rem,5.5vw,4.75rem)] font-extrabold leading-none tracking-[-0.05em] text-black tabular-nums">
        {display}
        {unit}
        {suffix ? (
          <span className="ml-1.5 align-baseline text-[0.32em] font-bold tracking-[0.12em] text-black/55">
            {suffix}
          </span>
        ) : null}
      </p>
      <p className="mt-5 font-display text-sm font-semibold tracking-[0.16em] text-black/50 uppercase">
        {label}
      </p>
    </div>
  );
}

export default function AboutView() {
  const compact = useCompactMobileStoreChrome();
  const statsRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const node = statsRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRun(true);
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <article className="bg-umx-cream text-black">
      <header
        className={`mx-auto max-w-[1480px] px-5 pb-16 sm:px-8 lg:pb-24 ${storeTopPadClass(compact)}`}
      >
        <div className="grid overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/15 sm:rounded-[2rem] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:min-h-[32rem]">
          <div className="flex flex-col justify-center px-8 py-14 sm:px-14 sm:py-20 lg:px-16">
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[0.88] tracking-[-0.055em]">
              About
              <span className="block">UMAXES</span>
            </h1>
            <p className="mt-5 font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Max your experience.
            </p>
            <p className="mt-7 font-body text-base leading-[1.8] text-black/80 sm:text-lg">
              UMAXES represents our pursuit of the maximum vaping experience.
              “MAX” stands for our belief in going further — more distinctive
              design, richer flavor, stronger performance, and a better overall
              experience.
            </p>
            <p className="mt-5 font-body text-base leading-[1.8] text-black/80 sm:text-lg">
              From the first concept to the final product, we focus on what
              matters most to adult consumers: how it feels, how it performs,
              and how it tastes.
            </p>
          </div>
          <div className="relative min-h-[18rem] bg-umx-cream-warm sm:min-h-[22rem] lg:min-h-full">
            <Image
              src="/images/about/umaxes-factory-exterior.png"
              alt="UMAXES headquarters"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 900px"
              quality={85}
            />
          </div>
        </div>
      </header>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center font-display text-[clamp(2.4rem,6vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            What makes UMAXES different
          </h2>
          <ul className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-3 sm:gap-6">
            {differences.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.n}
                  className="flex flex-col items-center rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-[0_12px_36px_rgba(0,0,0,0.08)] ring-1 ring-black/10 sm:px-7 sm:py-12"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-umx-cream">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </span>
                  <p className="mt-5 font-display text-xs font-semibold tracking-[0.2em] text-black/35">
                    {item.n}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-black sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-black/70 sm:text-base">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-8 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.45fr)] lg:gap-12">
          <h2 className="font-display text-[clamp(2.4rem,6vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            Our
            <span className="block">philosophy</span>
          </h2>
          <blockquote className="relative overflow-hidden rounded-[1.75rem] bg-white px-8 py-10 shadow-[0_16px_48px_rgba(0,0,0,0.08)] ring-1 ring-black/10 sm:px-12 sm:py-12 lg:min-h-[22rem] lg:px-14 lg:py-14">
            <Quote
              className="absolute top-6 left-6 h-8 w-8 text-black/20 sm:top-8 sm:left-8 sm:h-10 sm:w-10"
              strokeWidth={2}
              aria-hidden
            />
            <Quote
              className="absolute right-6 bottom-6 h-8 w-8 rotate-180 text-black/20 sm:right-8 sm:bottom-8 sm:h-10 sm:w-10"
              strokeWidth={2}
              aria-hidden
            />
            <div className="flex h-full flex-col justify-center px-2 sm:px-4">
              <p className="text-pretty font-display text-[clamp(1.65rem,3.4vw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-black">
                Innovation starts with understanding the user.
              </p>
              <p className="mt-6 max-w-2xl font-body text-base leading-[1.8] text-black/70 sm:text-lg lg:text-xl">
                We explore new technologies and flavors so every UMAXES device
                feels distinctive, reliable, and made for how adult consumers
                actually vape.
              </p>
            </div>
          </blockquote>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center font-display text-[clamp(2.4rem,6vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            Manufacturing &amp; R&amp;D
          </h2>
          <div className="mx-auto mt-10 w-full max-w-[1100px] overflow-hidden rounded-[1.5rem] bg-black/5 shadow-[0_16px_48px_rgba(0,0,0,0.12)] ring-1 ring-black/10 sm:mt-14">
            <Image
              src="/images/about/umaxes-factory-interior.png"
              alt="UMAXES reception and production floor"
              width={1600}
              height={900}
              className="h-auto w-full object-cover object-center"
              sizes="(max-width: 1200px) 100vw, 1100px"
              quality={85}
            />
          </div>
          <div
            ref={statsRef}
            className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-3 sm:gap-6"
          >
            {stats.map((s) => (
              <Stat key={s.label} {...s} run={run} />
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
