"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "ok" | "invalid" | "empty";

export default function VerifyForm() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleaned) {
      setStatus("empty");
      return;
    }
    // Demo check: codes 12+ alphanumeric chars ending with UX validate as authentic
    const valid = /^[A-Z0-9]{10,}$/.test(cleaned) && cleaned.includes("UX");
    setStatus(valid ? "ok" : "invalid");
  }

  return (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_12px_36px_rgba(61,22,5,0.08)] ring-1 ring-black/6 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="verify-code"
            className="font-display text-xs font-semibold tracking-[0.14em] text-black/45 uppercase"
          >
            Verification code
          </label>
          <input
            id="verify-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setStatus("idle");
            }}
            placeholder="e.g. HMX24UX9K2Q1"
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-black/10 bg-umx-cream px-4 py-3.5 font-display text-base tracking-wide text-black outline-none transition focus:border-umx-orange focus:ring-2 focus:ring-umx-orange/20"
          />
          <p className="mt-2 font-body text-sm text-black/50">
            Find the code on the scratch panel or sticker on your packaging.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex rounded-full bg-black px-7 py-3.5 font-display text-sm font-semibold text-umx-cream transition hover:bg-umx-orange hover:text-white"
        >
          Verify product
        </button>
      </form>

      {status === "ok" && (
        <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 font-display text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
          Authentic UMAXES product. You’re good to go.
        </div>
      )}
      {status === "invalid" && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-display text-sm font-semibold text-red-800 ring-1 ring-red-200">
          We couldn’t verify that code. Double-check and try again, or contact
          support.
        </div>
      )}
      {status === "empty" && (
        <div className="mt-6 rounded-xl bg-umx-orange/10 px-4 py-3 font-display text-sm font-semibold text-umx-orange-ink ring-1 ring-umx-orange/25">
          Enter a verification code to continue.
        </div>
      )}
    </div>
  );
}
