"use client";

import { useState } from "react";
import { faqs } from "@/lib/support";

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-black/8 overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-black/6 shadow-[0_12px_36px_rgba(61,22,5,0.08)]">
      {faqs.map((item, i) => {
        const isOpen = open === i;
        return (
          <li key={item.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition hover:bg-umx-cream/40 sm:px-6 sm:py-6"
            >
              <span className="font-display text-base font-bold tracking-tight text-black sm:text-lg">
                {item.q}
              </span>
              <span
                aria-hidden
                className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-umx-orange/10 font-display text-lg text-umx-orange transition duration-300 ${
                  isOpen ? "rotate-45 bg-umx-orange text-white" : ""
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 font-body text-sm leading-relaxed text-black/65 sm:px-6 sm:pb-6 sm:text-base">
                  {item.a}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
