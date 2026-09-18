/** Bank transfer slip / 水单 — image only, capped so storage stays small. */

export const PAYMENT_SLIP = {
  /** Reject the original upload above this. */
  maxBytes: 1 * 1024 * 1024,
  maxDimension: 1400,
  jpegQuality: 72,
  acceptMime: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptAttr: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
};

export type PaymentSlipStatus = "pending" | "submitted" | "paid" | "on_terms";

export function guessSlipMime(file: { type?: string; name?: string }) {
  const mime = (file.type || "").toLowerCase();
  if ((PAYMENT_SLIP.acceptMime as readonly string[]).includes(mime)) return mime;
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return mime;
}

export function isAllowedSlipMime(mime: string | null | undefined) {
  return Boolean(
    mime && (PAYMENT_SLIP.acceptMime as readonly string[]).includes(mime),
  );
}

export function isImageSlip(mime: string | null | undefined) {
  return Boolean(mime && mime.toLowerCase().startsWith("image/"));
}

export function isPaidStatus(status: string | null | undefined) {
  return status === "paid";
}

export function isSlipSubmitted(status: string | null | undefined) {
  return status === "submitted";
}

export function formatMaxSlipSize() {
  return "1 MB";
}

export function buyerPaymentLabel(opts: {
  orderStatus: string;
  paymentStatus: string | null;
  hasSlip: boolean;
  paid: boolean;
}) {
  if (opts.paid) return "Payment confirmed";
  if (opts.hasSlip || isSlipSubmitted(opts.paymentStatus)) {
    return "Slip uploaded — awaiting confirmation";
  }
  if (opts.orderStatus === "PAYMENT_PENDING" || opts.orderStatus === "SUBMITTED") {
    return "Upload payment slip";
  }
  return "Payment";
}
