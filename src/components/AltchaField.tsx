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
};

const CHALLENGE_URL = "/api/altcha/challenge";

type AltchaEl = HTMLElement & {
  challenge?: string;
  reset?: () => void;
};

export default function AltchaField({
  value,
  onChange,
  className = "",
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
    // React may not forward custom-element attrs; set property + attribute.
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

  if (!isClient) {
    return (
      <div
        className={`min-h-[58px] rounded-2xl border border-white/35 bg-white/60 px-4 py-4 font-body text-sm text-black/45 backdrop-blur-sm ${className}`}
      >
        Loading security check...
      </div>
    );
  }

  return (
    <div className={`altcha-field ${className}`}>
      <altcha-widget
        ref={bindWidget as never}
        challenge={CHALLENGE_URL}
        name="altcha"
        style={
          {
            "--altcha-border-radius": "1rem",
            "--altcha-color-base": "rgba(255,255,255,0.72)",
            "--altcha-color-base-content": "#111111",
            "--altcha-color-neutral": "rgba(17,17,17,0.18)",
            "--altcha-color-primary": "#111111",
            "--altcha-color-primary-content": "#ffffff",
            "--altcha-border-color": "rgba(255,255,255,0.32)",
            "--altcha-input-background-color": "rgba(255,255,255,0.62)",
            "--altcha-input-color": "#111111",
          } as CSSProperties
        }
      />
    </div>
  );
}
