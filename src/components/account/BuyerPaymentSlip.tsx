"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { PAYMENT_SLIP, isImageSlip } from "@/lib/payment-slip";

export default function BuyerPaymentSlip({
  orderId,
  paid,
  hasSlip,
  slipMime,
  fileName,
  paymentRef,
}: {
  orderId: string;
  paid: boolean;
  hasSlip: boolean;
  slipMime: string | null;
  fileName: string | null;
  paymentRef: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState(paymentRef || "");
  const slipHref = `/api/orders/${orderId}/payment-slip`;

  async function onFile(file: File | undefined) {
    if (!file || paid) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      if (reference.trim()) fd.set("reference", reference.trim());
      const res = await fetch(`/api/orders/${orderId}/payment-slip`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not upload that slip.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not upload that slip.");
    } finally {
      setBusy(false);
    }
  }

  if (paid) {
    return (
      <section className="border border-emerald-200 bg-emerald-50 px-5 py-4">
        <p className="font-display text-sm font-semibold text-emerald-900">
          Payment confirmed
        </p>
        <p className="mt-1 font-body text-sm text-emerald-900/80">
          Info confirmed the funds. This order counts toward rebate quantity.
        </p>
        {hasSlip ? (
          <a
            href={slipHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-emerald-900 underline"
          >
            View payment slip
          </a>
        ) : null}
      </section>
    );
  }

  return (
    <section className="border border-black/10 bg-white p-5 sm:p-6">
      <p className="font-display text-sm font-bold text-black">Payment slip</p>
      <p className="mt-1 font-body text-sm text-black/60">
        {hasSlip
          ? "Slip received. UMAXES Info will confirm after finance sees the funds — then the order is complete for rebate."
          : "Pay the proforma by TT / wire, then upload the bank slip (水单). Uploading does not finish the order — Info confirms arrival."}
      </p>

      {hasSlip ? (
        <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-black/10">
          {isImageSlip(slipMime) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slipHref}
              alt={fileName || "Payment slip"}
              className="max-h-72 w-full object-contain bg-[#f7f8fa]"
            />
          ) : (
            <a
              href={slipHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-4 font-display text-sm font-semibold text-black hover:bg-black/[0.03]"
            >
              <FileText className="h-5 w-5 text-[#1b4f72]" />
              {fileName || "Open payment slip PDF"}
            </a>
          )}
        </div>
      ) : null}

      <label className="mt-4 block">
        <span className="font-display text-sm font-semibold text-black">
          Bank reference (optional)
        </span>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          disabled={busy}
          className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2.5 font-body text-sm text-black outline-none focus:border-black"
          placeholder="TT / wire number"
        />
      </label>

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-black bg-black px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-[#1b4f72]">
        <Upload className="h-4 w-4" />
        {busy ? "Uploading…" : hasSlip ? "Replace slip" : "Upload payment slip"}
        <input
          type="file"
          accept={PAYMENT_SLIP.acceptAttr}
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.currentTarget.value = "";
            void onFile(file);
          }}
        />
      </label>
      <p className="mt-2 font-body text-xs text-black/45">
        JPG, PNG, WebP, or PDF · max 8 MB
      </p>
      {error ? (
        <p className="mt-2 font-body text-sm text-red-700">{error}</p>
      ) : null}
    </section>
  );
}
