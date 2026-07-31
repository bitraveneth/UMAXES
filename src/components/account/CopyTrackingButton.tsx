"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyTrackingButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 border border-black/15 bg-white px-3 py-2 font-display text-xs font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-umx-orange" strokeWidth={2.5} />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
