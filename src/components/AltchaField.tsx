"use client";

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import "altcha";
import type {} from "altcha/types/react";

type AltchaFieldProps = {
  value: string;
  onChange: (payload: string) => void;
  className?: string;
  /** When false, render widget only (no framed panel). Default true. */
  framed?: boolean;
  title?: string;
  hint?: string;
};

const CHALLENGE_URL = "/api/altcha/challenge";

type AltchaEl = HTMLElement & {
  challenge?: string;
  reset?: () => void;
};

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 shrink-0 text-umx-orange"
      aria-hidden
    >
      <path
        d="M12 3.5 5.5 6.2v5.1c0 4.1 2.7 7.9 6.5 9.2 3.8-1.3 6.5-5.1 6.5-9.2V6.2L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m9.2 12 1.9 1.9 3.7-3.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AltchaField({
  value,
  onChange,
  className = "",
  framed = true,
  title = "Security check",
  hint = "Confirm you are human to continue.",
}: AltchaFieldProps) {
  const ref = useRef<AltchaEl | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  function bindWidget(el: AltchaEl | null) {
    ref.current = el;
    if (!el) return;
    el.challenge = CHALLENGE_URL;
    el.setAttribute("challenge", CHALLENGE_URL);
    el.setAttribute("name", "altcha");
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onStateChange = (event: Event) => {
      const detail = (event as CustomEvent<{ state?: string; payload?: string }>)
        .detail;
      if (detail?.state === "verified" && detail.payload) {
        onChangeRef.current(detail.payload);
        return;
      }
      if (detail?.state && detail.state !== "verified") {
        onChangeRef.current("");
      }
    };

    const onVerified = (event: Event) => {
      const detail = (event as CustomEvent<{ payload?: string }>).detail;
      if (detail?.payload) {
        onChangeRef.current(detail.payload);
      }
    };

    el.addEventListener("statechange", onStateChange);
    el.addEventListener("verified", onVerified);
    return () => {
      el.removeEventListener("statechange", onStateChange);
      el.removeEventListener("verified", onVerified);
    };
  }, [isClient]);

  useEffect(() => {
    if (value) return;
    ref.current?.reset?.();
  }, [value]);

  const verified = Boolean(value);

  const widget = !isClient ? (
    <div className="min-h-[52px] rounded-xl border border-black/10 bg-white px-4 py-3.5 font-body text-sm text-black/45">
      Loading security check…
    </div>
  ) : (
    <div className={`altcha-field ${className}`}>
      <altcha-widget
        ref={bindWidget as never}
        challenge={CHALLENGE_URL}
        name="altcha"
        style={
          {
            "--altcha-border-radius": "0.75rem",
            "--altcha-color-base": "#ffffff",
            "--altcha-color-base-content": "#111111",
            "--altcha-color-neutral": "rgba(17,17,17,0.2)",
            "--altcha-color-primary": "#ff5b04",
            "--altcha-color-primary-content": "#ffffff",
            "--altcha-border-color": "rgba(0,0,0,0.14)",
            "--altcha-input-background-color": "#ffffff",
            "--altcha-input-color": "#111111",
          } as CSSProperties
        }
      />
    </div>
  );

  if (!framed) return widget;

  return (
    <div
      className={`rounded-xl border-2 px-3.5 py-3.5 transition ${
        verified
          ? "border-emerald-400/70 bg-emerald-50/80"
          : "border-umx-orange/45 bg-[linear-gradient(180deg,#fff7f0_0%,#ffffff_58%)] shadow-[0_0_0_3px_rgba(255,91,4,0.08)]"
      }`}
    >
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <ShieldIcon />
          <div>
            <p className="font-display text-sm font-semibold text-black">
              {title}
            </p>
            <p className="mt-0.5 font-body text-xs text-black/50">{hint}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-display text-[0.65rem] font-semibold tracking-wide uppercase ${
            verified
              ? "bg-emerald-600 text-white"
              : "bg-umx-orange/15 text-umx-orange"
          }`}
        >
          {verified ? "Verified" : "Required"}
        </span>
      </div>
      {widget}
    </div>
  );
}
