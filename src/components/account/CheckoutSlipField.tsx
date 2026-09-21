"use client";

import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import {
  PAYMENT_SLIP,
  formatMaxSlipSize,
  guessSlipMime,
  isAllowedSlipMime,
} from "@/lib/payment-slip";

export function validateCheckoutSlip(file: File): string | null {
  if (file.size > PAYMENT_SLIP.maxBytes) {
    return `Image must be under ${formatMaxSlipSize()}.`;
  }
  if (!isAllowedSlipMime(guessSlipMime(file))) {
    return "Use a JPG, PNG, or WebP photo of the bank slip.";
  }
  return null;
}

export default function CheckoutSlipField({
  file,
  onChange,
  disabled = false,
}: {
  file: File | null;
  onChange: (file: File | null, error: string | null) => void;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="mt-4 overflow-hidden border border-dashed border-black/15 bg-[#f7f9fb] pb-4">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-black">
            Payment slip
            <span className="ml-2 font-body text-xs font-normal text-black/45">
              Optional
            </span>
          </p>
          <p className="mt-1 font-body text-xs leading-relaxed text-black/55">
            Already paid? Attach a photo of the bank slip here. You can also
            upload it later from the order. Not required to place the order.
          </p>
        </div>
        {file ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(null, null)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-black/45 transition hover:text-red-700 disabled:opacity-50"
            aria-label="Remove payment slip"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      {file && preview ? (
        <div className="mt-3 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="max-h-40 w-full bg-white object-contain ring-1 ring-black/8"
          />
          <p className="mt-2 truncate font-body text-xs text-black/55">
            {file.name}
          </p>
        </div>
      ) : (
        <label className="mt-3 mx-4 mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 border border-black/8 bg-white px-4 py-6 text-center transition hover:border-[#1b4f72]/40">
          <ImagePlus className="h-5 w-5 text-[#1b4f72]" strokeWidth={1.85} />
          <span className="font-display text-sm font-semibold text-black">
            Choose bank slip photo
          </span>
          <span className="font-body text-xs text-black/45">
            JPG, PNG, or WebP · max {formatMaxSlipSize()}
          </span>
          <input
            type="file"
            accept={PAYMENT_SLIP.acceptAttr}
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              const next = e.target.files?.[0] || null;
              e.currentTarget.value = "";
              if (!next) {
                onChange(null, null);
                return;
              }
              onChange(next, validateCheckoutSlip(next));
            }}
          />
        </label>
      )}
    </div>
  );
}
