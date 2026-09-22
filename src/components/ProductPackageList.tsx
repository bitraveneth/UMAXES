"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import type { Flavor } from "@/lib/assets";

const CONTENTS = [
  {
    qty: 1,
    name: "Umaxes HookaMax 80K Disposable Kit",
  },
] as const;

export default function ProductPackageList({ flavor }: { flavor: Flavor }) {
  return (
    <section
      id="package-list"
      className="relative overflow-hidden bg-umx-cream-warm px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="package-list-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgba(255,91,4,0.12), transparent 42%), radial-gradient(circle at 88% 70%, rgba(27,79,114,0.08), transparent 38%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full bg-umx-cream-deep/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1400px]">
        <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase sm:text-sm">
            Package list
          </p>
          <h2
            id="package-list-heading"
            className="mt-3 font-display text-[clamp(1.85rem,4.5vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-black"
          >
            Umaxes HookaMax 80K Disposable Vape
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-body text-base text-black/60 sm:text-lg">
            Everything included with your device — simple, complete, ready to
            draw.
          </p>
        </header>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-16">
          <div
            className="group relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] shadow-[0_28px_60px_rgba(61,22,5,0.14)] ring-1 ring-black/8 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_34px_70px_rgba(61,22,5,0.18)] lg:max-w-none"
            style={{ backgroundColor: `${flavor.accent}16` }}
          >
            <div className="relative aspect-[4/5] w-full sm:aspect-square lg:aspect-[4/5]">
              <Image
                src={flavor.packageImage}
                alt={`${flavor.name} HOOKAMAX package`}
                fill
                className="object-contain object-center p-5 transition duration-700 ease-out group-hover:scale-[1.03] sm:p-7"
                sizes="(max-width: 1024px) 90vw, 520px"
                quality={80}
              />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
          </div>

          <div className="min-w-0">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-umx-orange text-white shadow-[0_10px_24px_rgba(255,91,4,0.28)]">
                <Package className="h-5 w-5" strokeWidth={1.85} aria-hidden />
              </span>
              <div>
                <p className="font-display text-[0.7rem] font-semibold tracking-[0.16em] text-black/45 uppercase">
                  In the box
                </p>
                <p className="font-display text-lg font-bold tracking-tight text-black sm:text-xl">
                  What you receive
                </p>
              </div>
            </div>

            <ul className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white/80 shadow-[0_18px_40px_rgba(61,22,5,0.06)] backdrop-blur-sm">
              {CONTENTS.map((item, index) => (
                <li
                  key={item.name}
                  className="group flex items-center gap-4 border-b border-black/8 px-5 py-5 last:border-b-0 sm:gap-5 sm:px-6 sm:py-6"
                >
                  <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-black text-umx-cream transition duration-300 ease-out group-hover:bg-umx-orange group-hover:text-white sm:h-16 sm:w-16">
                    <span className="font-display text-[0.65rem] font-semibold tracking-[0.14em] uppercase opacity-70">
                      Qty
                    </span>
                    <span className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight">
                      {item.qty}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[0.65rem] font-semibold tracking-[0.16em] text-umx-orange uppercase">
                      Item {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1 font-display text-lg font-bold leading-snug tracking-tight text-black sm:text-xl">
                      {item.name}
                    </p>
                    <p className="mt-1.5 font-body text-sm text-black/55">
                      Full disposable kit · {flavor.name} flavor packaging
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-5 font-body text-sm leading-relaxed text-black/50 sm:text-[0.95rem]">
              Adults 21+ only. Nicotine is an addictive chemical.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
