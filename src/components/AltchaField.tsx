"use client";

import { HUMAN_CHECK_PAYLOAD } from "@/lib/human-check";

type AltchaFieldProps = {
  value: string;
  onChange: (payload: string) => void;
  className?: string;
  /** When false, render checkbox only (no framed panel). Default true. */
  framed?: boolean;
  title?: string;
  hint?: string;
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

/**
 * Lightweight human check — checkbox only (no Altcha PoW).
 * Same value/onChange API as the old captcha field so login/register keep working.
 */
export default function AltchaField({
  value,
  onChange,
  className = "",
  framed = true,
  title = "Security check",
  hint = "Check the box to continue. No waiting.",
}: AltchaFieldProps) {
  const verified = value === HUMAN_CHECK_PAYLOAD;
  const inputId = "umaxes-human-check";

  const checkbox = (
    <label
      htmlFor={inputId}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-3.5 py-3.5 transition ${className} ${
        verified
          ? "border-emerald-400/70"
          : "border-black/14 hover:border-black/25"
      }`}
    >
      <input
        id={inputId}
        type="checkbox"
        name="altcha"
        checked={verified}
        onChange={(e) =>
          onChange(e.target.checked ? HUMAN_CHECK_PAYLOAD : "")
        }
        className="h-5 w-5 shrink-0 rounded border-black/30 accent-[#1b4f72]"
      />
      <span className="font-body text-sm font-medium text-black">
        I am human
      </span>
    </label>
  );

  if (!framed) return checkbox;

  return (
    <div
      className={`rounded-xl border-2 px-3.5 py-3.5 transition ${
        verified
          ? "border-emerald-400/70 bg-emerald-50/80"
          : "border-umx-orange/45 bg-[linear-gradient(180deg,#eef5fa_0%,#ffffff_58%)] shadow-[0_0_0_3px_rgba(27,79,114,0.08)]"
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
          {verified ? "Ready" : "Required"}
        </span>
      </div>
      {checkbox}
    </div>
  );
}
