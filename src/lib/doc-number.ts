const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const COMPANY_NOISE =
  /\b(LLC|L\.L\.C|INC|LTD|CORP|CO|LIMITED|INCORPORATED|COMPANY|PARTNERS|PARTNER|GROUP|HOLDINGS|ENTERPRISES|ENTERPRISE|TRADING|INTERNATIONAL|INTL)\b\.?/gi;

export function nextSystemId() {
  return String(Math.floor(Math.random() * 9000 + 1000));
}

/** Document date token: 20260921 (numeric, universal). */
export function formatDocDate(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/** Human label for UI: 2026-09-21 */
export function formatDocDateLabel(token: string) {
  if (/^\d{8}$/.test(token)) {
    return `${token.slice(0, 4)}-${token.slice(4, 6)}-${token.slice(6, 8)}`;
  }
  return token;
}

export function slugState(region?: string | null) {
  const raw = (region || "").trim().toUpperCase();
  if (!raw) return "";
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  return raw.replace(/[^A-Z0-9]+/g, "").slice(0, 8);
}

/** First two meaningful words only, e.g. "Pacific Distro Partners" → PACIFIC-DISTRO */
export function slugCompany(name: string) {
  const words = (name || "")
    .toUpperCase()
    .replace(COMPANY_NOISE, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const slug = words.join("-").slice(0, 24);
  return slug || "CUSTOMER";
}

export function nextOrderNumber() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `UMX-${stamp}-${nextSystemId()}`;
}

/**
 * Universal short doc id (stored on order.piNumber).
 * {COMPANY2}-{STATE}-{YYYYMMDD}
 * Example: PACIFIC-DISTRO-CA-20260921
 * CI/PL add their own prefix via siblingDocNumber.
 */
export function nextPiNumber(opts: {
  companyName?: string | null;
  customerName?: string | null;
  region?: string | null;
  orderNumber: string;
  date?: Date;
}) {
  const party = (opts.companyName || opts.customerName || "CUSTOMER").trim();
  const parts = [
    slugCompany(party),
    slugState(opts.region),
    formatDocDate(opts.date),
  ].filter(Boolean);
  return parts.join("-");
}

export function siblingDocNumber(
  piNumber: string | null | undefined,
  prefix: "PI" | "CI" | "PL",
  orderNumber: string,
) {
  const raw = (piNumber || "").trim();
  if (raw) {
    const body = raw.replace(/^(PI|CI|PL)-/i, "");
    return `${prefix}-${body}`;
  }
  return `${prefix}-${orderNumber.replace(/^UMX-/, "")}`;
}

export type DocNumberParts = {
  prefix: string;
  state: string;
  company: string;
  dateLabel: string;
  systemId: string;
  raw: string;
};

export function parseDocNumber(
  raw: string | null | undefined,
): DocNumberParts {
  const value = (raw || "").trim();
  const empty: DocNumberParts = {
    prefix: "PI",
    state: "",
    company: "",
    dateLabel: "",
    systemId: "",
    raw: value,
  };
  if (!value) return empty;

  const bits = value.split("-").filter(Boolean);
  const hasTypePrefix = /^(PI|CI|PL)$/i.test(bits[0] || "");
  const prefix = hasTypePrefix ? (bits[0] || "PI").toUpperCase() : "";
  const rest = hasTypePrefix ? bits.slice(1) : bits.slice();

  let systemId = "";
  // Only treat trailing 3–6 digit id as system id when not a full YYYYMMDD date
  if (
    rest.length &&
    /^\d{3,6}$/.test(rest[rest.length - 1] || "") &&
    !/^\d{8}$/.test(rest[rest.length - 1] || "")
  ) {
    systemId = rest.pop() as string;
  }

  let dateLabel = "";
  // New universal numeric date: YYYYMMDD
  if (rest.length && /^\d{8}$/.test(rest[rest.length - 1] || "")) {
    dateLabel = formatDocDateLabel(rest.pop() as string);
  } else {
    // Legacy: 21-SEP-2026
    const monthIdx = rest.findIndex(
      (part, i) =>
        MONTHS.includes(part as (typeof MONTHS)[number]) &&
        i > 0 &&
        /^\d{1,2}$/.test(rest[i - 1] || "") &&
        /^\d{4}$/.test(rest[i + 1] || ""),
    );
    if (monthIdx >= 1) {
      const day = String(rest[monthIdx - 1]).padStart(2, "0");
      const mon = rest[monthIdx];
      const year = rest[monthIdx + 1];
      dateLabel = `${day} ${mon} ${year}`;
      rest.splice(monthIdx - 1, 3);
    } else if (rest.length) {
      const last = rest[rest.length - 1] || "";
      const compact = last.match(/^(\d{2})([A-Z]{3})(\d{4})$/);
      if (compact) {
        dateLabel = `${compact[1]} ${compact[2]} ${compact[3]}`;
        rest.pop();
      }
    }
  }

  // Prefer trailing 2-letter state (new order: company then state)
  let state = "";
  if (rest.length && /^[A-Z]{2}$/.test(rest[rest.length - 1] || "")) {
    state = rest.pop() as string;
  } else if (rest[0] && /^[A-Z]{2}$/.test(rest[0])) {
    // Legacy: state first
    state = rest.shift() as string;
  }

  return {
    prefix,
    state,
    company: rest.join("-"),
    dateLabel,
    systemId,
    raw: value,
  };
}
