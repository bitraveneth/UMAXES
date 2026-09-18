/** Bank transfer slip / 水单 uploaded by the buyer, confirmed by Info. */

export const PAYMENT_SLIP = {
  maxBytes: 8 * 1024 * 1024,
  acceptMime: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ] as const,
  acceptAttr:
    "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf",
};

export type PaymentSlipStatus = "pending" | "submitted" | "paid" | "on_terms";

export function isImageSlip(mime: string | null | undefined) {
  return Boolean(mime && mime.toLowerCase().startsWith("image/"));
}

export function isPaidStatus(status: string | null | undefined) {
  return status === "paid";
}

export function isSlipSubmitted(status: string | null | undefined) {
  return status === "submitted";
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
