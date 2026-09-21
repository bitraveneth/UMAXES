/** HOOKAMAX ships as a case. One case (pack) is 95 selling pieces. */
export const PCS_PER_CASE = 95;

/** Catalog MOQ for case-packed SKUs. Stored on PriceByLevel.moq as cases. */
export const CASE_MOQ_CASES = 1;

/** Piece count for one case. Cart and orders still store pieces. */
export const CASE_MOQ_PCS = PCS_PER_CASE;

/**
 * Free channel bonus line (95+1). Not a shop product and not sold by the case.
 * Orders attach it automatically; customers never add it from the catalog.
 */
export const TEST_STATION_SKU = "test-station";

export function isCasePackedSku(sku: string) {
  return sku !== TEST_STATION_SKU;
}

/** If an old row still has 95 (pieces), treat it as 1 case — not 95 cases. */
export function caseMoqFromStored(moq: number) {
  const n = Math.max(1, Math.floor(Number(moq) || CASE_MOQ_CASES));
  if (n >= PCS_PER_CASE) return Math.max(CASE_MOQ_CASES, Math.round(n / PCS_PER_CASE));
  return n;
}

/** Minimum order quantity in pieces for a SKU. */
export function minOrderPcs(sku: string, moq: number) {
  if (!isCasePackedSku(sku)) return Math.max(1, Math.floor(Number(moq) || 1));
  return caseMoqFromStored(moq) * PCS_PER_CASE;
}

export function pcsFromCases(cases: number) {
  const n = Math.floor(Number(cases) || 0);
  if (n <= 0) return 0;
  return n * PCS_PER_CASE;
}

export function casesFromPcs(pcs: number) {
  const n = Math.floor(Number(pcs) || 0);
  if (n <= 0) return 0;
  return Math.round(n / PCS_PER_CASE);
}

/** Snap a piece count onto whole cases. Any leftover pieces become 1 case. */
export function snapToCasePcs(pcs: number) {
  const n = Math.floor(Number(pcs) || 0);
  if (n <= 0) return 0;
  return pcsFromCases(Math.max(1, Math.round(n / PCS_PER_CASE)));
}

export function isWholeCases(pcs: number) {
  const n = Math.floor(Number(pcs) || 0);
  return n > 0 && n % PCS_PER_CASE === 0;
}

export function formatCases(cases: number) {
  const n = Math.max(0, Math.floor(Number(cases) || 0));
  return n === 1 ? "1 case" : `${n} cases`;
}

export function formatPack(pcs: number) {
  const cases = casesFromPcs(pcs);
  const pieces = pcsFromCases(cases);
  return `${formatCases(cases)} · ${pieces.toLocaleString()} pcs`;
}

export const PACK_COPY = `1 case = ${PCS_PER_CASE} pieces. Sold by the case — + adds one case.`;
