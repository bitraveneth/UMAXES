/** HOOKAMAX ships as a case. One case (pack) is 95 selling pieces. */
export const PCS_PER_CASE = 95;

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
