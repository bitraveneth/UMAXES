/** SOP: each selling case includes one test station kit with one device. */
export const TEST_STATION_SKU = "test-station";
export const TEST_STATION_NAME = "Test Station";
export const TEST_STATION_PER_CASE_COPY =
  "Each case adds 1 test station with 1 device";

export function formatTestStationQty(qty: number) {
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  if (n === 1) return "1 test station";
  return `${n} test stations`;
}

/** Compact line for lists: "3 test stations · 1 device in each" */
export function formatTestStationLine(qty: number) {
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  if (n <= 0) return "No test stations on this order";
  if (n === 1) return "Quantity 1 test station · 1 device in this kit";
  return `Quantity ${n} test stations · 1 device in each kit`;
}

/** Full buyer-facing explanation. */
export function formatTestStationMessage(qty: number) {
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  if (n <= 0) {
    return `Add a case to include a test station. ${TEST_STATION_PER_CASE_COPY}.`;
  }
  const qtyLabel = formatTestStationQty(n);
  const device =
    n === 1
      ? "This station includes 1 device."
      : "Each station includes 1 device.";
  return `Quantity ${qtyLabel}. ${device} ${TEST_STATION_PER_CASE_COPY}.`;
}
