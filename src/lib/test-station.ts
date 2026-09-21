/** SOP: each selling case includes one test station kit with one device. */
export const TEST_STATION_SKU = "test-station";
export const TEST_STATION_NAME = "Test Station (incl. 1 device)";
export const TEST_STATION_PER_CASE_COPY =
  "1 case = 1 test station with 1 device";

export function formatTestStationLine(qty: number) {
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  if (n <= 0) return "0 test stations";
  if (n === 1) return "1 test station · 1 device inside";
  return `${n} test stations · 1 device inside each`;
}
