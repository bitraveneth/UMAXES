"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  BatteryCharging,
  Droplets,
  Flame,
  Grid3x3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { statementIcons } from "@/components/StatementIcons";
import { logos } from "@/lib/assets";

type Token = { type: "text"; value: string } | { type: "icon"; index: number };

/** One statement line — each icon once */
function buildStatementLine(words: string[]): Token[] {
  if (words.length > statementIcons.length) {
    throw new Error("Need more unique statement icons than words");
  }
  const tokens: Token[] = [];
  words.forEach((word, i) => {
    tokens.push({ type: "text", value: word });
    tokens.push({ type: "icon", index: i });
  });
  return tokens;
}

const statementLine = buildStatementLine([
  "ELEVATE",
  "EVERY",
  "PUFF",
  "MAX",
  "FLAVOR",
  "SMOOTH",
  "CLOUD",
  "DRAW",
]);

function Orb({ index, delay }: { index: number; delay: string }) {
  const Icon = statementIcons[index];
  return (
    <span
      className="animate-icon-bob relative mx-0.5 inline-flex h-[1em] w-[1em] shrink-0 align-middle drop-shadow-[0_10px_24px_rgba(0,0,0,0.16)] sm:mx-1.5"
      style={{ animationDelay: delay }}
      aria-hidden
    >
      <Icon className="h-full w-full" />
    </span>
  );
}

function StatementMarquee({ tokens }: { tokens: Token[] }) {
  const loop = [...tokens, ...tokens];
  return (
    <div className="relative overflow-hidden py-1">
      <div className="animate-icon-marquee flex w-max items-center gap-2 pr-2 font-display text-[clamp(2.75rem,9vw,6.5rem)] font-extrabold leading-none tracking-[-0.045em] uppercase sm:gap-4 sm:pr-4">
        {loop.map((token, i) =>
          token.type === "text" ? (
            <span
              key={`t-${i}`}
              className="inline-flex items-center text-black select-none"
            >
              {token.value}
            </span>
          ) : (
            <Orb
              key={`i-${i}`}
              index={token.index}
              delay={`${(token.index % 5) * 0.15}s`}
            />
          )
        )}
      </div>
    </div>
  );
}

/** Second line — UMAXES logo + unique icons between */
function BrandMarquee() {
  // Icons not used on the statement line (statement uses 0–7)
  const items = [8, 9, 10, 11].map((iconIndex, i) => ({
    logoKey: i,
    iconIndex,
  }));

  return (
    <div className="relative mt-3 overflow-hidden py-1 sm:mt-4">
      <div className="animate-icon-marquee-rev flex w-max items-center gap-3 pr-3 font-display text-[clamp(2.75rem,9vw,6.5rem)] font-extrabold leading-none sm:gap-5 sm:pr-5">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 sm:gap-5">
            <span className="relative inline-block h-[1em] w-[calc(1em*5.2)] shrink-0">
              <Image
                src={logos.orangeTransparent}
                alt="UMAXES"
                fill
                className="object-contain object-left"
                sizes="(max-width: 768px) 200px, 420px"
              />
            </span>
            <Orb
              index={item.iconIndex}
              delay={`${(item.iconIndex % 4) * 0.15}s`}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

const reasons: {
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Hookah soul",
    body: "Rich, ritual-worthy flavor depth — built for adults who want more than a thin disposable hit.",
    icon: Flame,
  },
  {
    title: "Lit Mesh coil",
    body: "Even heat. Cleaner taste. A smoother draw from first puff to last.",
    icon: Grid3x3,
  },
  {
    title: "Flavor library",
    body: "Nine profiles. One HOOKAMAX device. Pick the mood — peach, ice, mint, and more.",
    icon: Sparkles,
  },
  {
    title: "All-day power",
    body: "1300mAh rechargeable endurance with Type-C — ready whenever you are.",
    icon: BatteryCharging,
  },
  {
    title: "Adult-first",
    body: "Clear age gates, honest nicotine facts, and no youth cues. Ever.",
    icon: ShieldCheck,
  },
  {
    title: "Capacity that lasts",
    body: "40ML e-liquid and dual MTL/DL airflow — sessions without constant restarts.",
    icon: Droplets,
  },
];

function WhyUmaxes() {
  return (
    <div className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute top-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-umx-orange/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1100px]">
        <header className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
            Why UMAXES
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,6vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            Not another
            <span className="text-umx-orange"> disposable.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-body text-base leading-relaxed text-black/65 sm:text-lg">
            Hookah-inspired flavor, mythic design, and specs that actually
            matter — crafted for adults who notice the difference.
          </p>
        </header>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {reasons.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="group relative flex flex-col items-center overflow-hidden rounded-[1.5rem] border border-white/90 bg-gradient-to-b from-white via-white to-[#fffaf0] px-6 py-8 text-center shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_12px_36px_rgba(61,22,5,0.08)] ring-1 ring-black/6 transition duration-500 hover:-translate-y-1.5 hover:border-umx-orange/35 hover:shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_22px_50px_rgba(61,22,5,0.12)] hover:ring-umx-orange/25 sm:px-7 sm:py-9"
              >
                {/* Gloss sheen — always visible */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-8 left-1/2 h-24 w-[70%] -translate-x-1/2 rounded-full bg-white/80 blur-2xl"
                />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-umx-orange/10 text-umx-orange ring-1 ring-umx-orange/15 transition duration-500 group-hover:bg-umx-orange group-hover:text-white group-hover:ring-umx-orange group-hover:shadow-[0_10px_24px_rgba(255,91,4,0.35)]">
                  <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="relative mt-5 font-display text-xl font-bold tracking-tight text-black">
                  {item.title}
                </h3>
                <p className="relative mt-2 max-w-xs font-body text-sm leading-relaxed text-black/60 sm:text-base">
                  {item.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-white">
      <div className="border-b border-black/6 bg-white px-4 py-20 sm:px-6 sm:py-28">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-24" />
          <StatementMarquee tokens={statementLine} />
          <BrandMarquee />
        </div>
      </div>

      <WhyUmaxes />
    </section>
  );
}
