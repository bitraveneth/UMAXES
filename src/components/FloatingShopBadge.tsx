"use client";

import { useEffect, useId, useState } from "react";
import { COMMUNITY_URL } from "@/lib/community";

const RING_COPY = "UMAXES COMMUNITY  ·  JOIN THE GROUP  ·  ADULTS 21+  ·  ";
const STORAGE_KEY = "umaxes-float-cta-dismissed";

/** Inline Join Now badge — parent places it next to Support on the right. */
export default function FloatingShopBadge() {
  const pathId = useId().replace(/:/g, "");
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setVisible(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  if (!mounted || !visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="pointer-events-auto relative animate-[float-badge-in_0.55s_cubic-bezier(0.22,1,0.36,1)_both]">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss community badge"
        className="absolute -top-1 -left-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-black shadow-[0_6px_18px_rgba(0,0,0,0.18)] ring-1 ring-black/10 transition hover:text-black"
      >
        <span className="text-lg leading-none" aria-hidden>
          ×
        </span>
      </button>

      <a
        href={COMMUNITY_URL}
        aria-label="Join the UMAXES WhatsApp community"
        {...(COMMUNITY_URL !== "#"
          ? { target: "_blank", rel: "noopener noreferrer" }
          : { onClick: (e: React.MouseEvent) => e.preventDefault() })}
        className="group relative flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full bg-umx-orange text-umx-cream shadow-[0_16px_36px_rgba(0,0,0,0.35)] transition duration-300 hover:scale-[1.04] hover:bg-umx-orange-mid hover:shadow-[0_20px_44px_rgba(0,0,0,0.42)] sm:h-[6.5rem] sm:w-[6.5rem]"
      >
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-1.5 animate-[badge-spin_18s_linear_infinite] text-umx-cream motion-reduce:animate-none"
          aria-hidden
        >
          <defs>
            <path
              id={`umx-badge-circle-${pathId}`}
              d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
            />
          </defs>
          <text
            fill="currentColor"
            className="font-display text-[7.2px] font-semibold uppercase"
            style={{ letterSpacing: "0.22em" }}
          >
            <textPath href={`#umx-badge-circle-${pathId}`} startOffset="0%">
              {RING_COPY}
              {RING_COPY}
            </textPath>
          </text>
        </svg>

        <span className="relative z-[1] px-3 text-center font-display text-[0.65rem] font-extrabold tracking-[0.14em] text-umx-cream uppercase sm:text-[0.7rem]">
          Join
          <br />
          now
        </span>
      </a>
    </div>
  );
}
