/** SOP: each selling case includes one test station kit with one device. */
export const TEST_STATION_SKU = "test-station";
export const TEST_STATION_NAME = "Test Station";
export const TEST_STATION_PER_CASE_COPY = "1 case = 1 test station · 1 device";

export function formatTestStationQty(qty: number) {
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  if (n === 1) return "1 test station";
  return `${n} test stations`;
}

/** Short line for order rows: "Qty 3 · 1 device each" */
export function formatTestStationLine(qty: number) {
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  if (n <= 0) return "Qty 0";
  if (n === 1) return "Qty 1 · 1 device";
  return `Qty ${n} · 1 device each`;
}

/** Kept for older call sites — same short line. */
export function formatTestStationMessage(qty: number) {
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  if (n <= 0) return TEST_STATION_PER_CASE_COPY;
  return formatTestStationLine(n);
}
