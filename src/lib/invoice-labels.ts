/** Lightweight invoice label helpers — safe for client components (no DB). */

export function invoiceCommodity() {
  return process.env.INVOICE_COMMODITY || "Umaxes Hookamax";
}

export function invoicePuffsLabel() {
  return process.env.INVOICE_PUFFS_LABEL || "MTL/DLT - 80K/50K";
}
