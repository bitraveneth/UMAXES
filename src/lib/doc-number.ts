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

/** Document date token: 260923 (YYMMDD). */
export function formatDocDate(date = new Date()) {
  const y = String(date.getUTCFullYear()).slice(-2);
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/** Human label for UI: 2026-09-23 */
export function formatDocDateLabel(token: string) {
  if (/^\d{6}$/.test(token)) {
    return `20${token.slice(0, 2)}-${token.slice(2, 4)}-${token.slice(4, 6)}`;
  }
  if (/^\d{8}$/.test(token)) {
    return `${token.slice(0, 4)}-${token.slice(4, 6)}-${token.slice(6, 8)}`;
  }
  return token;
}

/** 2-letter region: NY, CA; "New York" → NY; longer codes → first 2 letters. */
export function slugState(region?: string | null) {
  const raw = (region || "").trim().toUpperCase();
  if (!raw) return "";
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  const words = raw
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[1][0] || ""}`;
  }
  return (words[0] || "").replace(/[^A-Z0-9]+/g, "").slice(0, 2);
}

/** First two meaningful words, e.g. "Pacific Distro Partners" → PACIFIC-DISTRO */
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

/** Company initials: "Pacific Distro Partners" → PD */
export function companyInitials(name: string) {
  const words = (name || "")
    .toUpperCase()
    .replace(COMPANY_NOISE, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[1][0] || ""}` || "CU";
  }
  if (words[0]) {
    return words[0].slice(0, 2) || "CU";
  }
  return "CU";
}

/**
 * Order id: UMX-{COMPANY_INITIALS}{YYMMDD}
 * Same body as PI, without client state. Example: UMX-PD260923
 * Optional seq suffix when the same company places multiple orders that day.
 */
export function nextOrderNumber(opts?: {
  companyName?: string | null;
  customerName?: string | null;
  date?: Date;
  seq?: string | number | null;
}) {
  const party = (opts?.companyName || opts?.customerName || "CUSTOMER").trim();
  const body = `${companyInitials(party)}${formatDocDate(opts?.date)}`;
  const seq =
    opts?.seq != null && String(opts.seq).trim() !== ""
      ? `-${String(opts.seq).trim()}`
      : "";
  return `UMX-${body}${seq}`;
}

/**
 * Short doc id stored on order.piNumber (no type prefix):
 * {COMPANY_INITIALS}{YYMMDD}{STATE}
 * Example: PD260923NY
 * CI/PL/PI add prefix via siblingDocNumber → PI-PD260923NY
 */
export function nextPiNumber(opts: {
  companyName?: string | null;
  customerName?: string | null;
  region?: string | null;
  orderNumber?: string;
  date?: Date;
}) {
  const party = (opts.companyName || opts.customerName || "CUSTOMER").trim();
  return `${companyInitials(party)}${formatDocDate(opts.date)}${slugState(opts.region)}`;
}

/** Strip optional PI-/CI-/PL- type prefix from a stored doc id. */
export function docNumberBody(value: string | null | undefined) {
  return (value || "").trim().replace(/^(PI|CI|PL)-/i, "");
}

/**
 * Doc filename / export id.
 * PI keeps the stored body (e.g. PD260923NY) — label is separate ("PI No.").
 * PL/CI add their type prefix: PL-PD260923NY
 */
export function siblingDocNumber(
  piNumber: string | null | undefined,
  prefix: "PI" | "CI" | "PL",
  orderNumber: string,
) {
  const body =
    docNumberBody(piNumber) || orderNumber.replace(/^UMX-/, "").trim();
  if (!body) return prefix;
  if (prefix === "PI") return body;
  return `${prefix}-${body}`;
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

  // Short style: PD260923NY or PL-PD260923NY
  const compact = rest.join("-");
  const short = compact.match(/^([A-Z]{2})(\d{6})([A-Z]{0,2})$/);
  if (short && rest.length === 1) {
    return {
      prefix,
      company: short[1],
      dateLabel: formatDocDateLabel(short[2]),
      state: short[3] || "",
      systemId: "",
      raw: value,
    };
  }

  let systemId = "";
  if (
    rest.length &&
    /^\d{3,6}$/.test(rest[rest.length - 1] || "") &&
    !/^\d{8}$/.test(rest[rest.length - 1] || "")
  ) {
    systemId = rest.pop() as string;
  }

  let dateLabel = "";
  if (rest.length && /^\d{8}$/.test(rest[rest.length - 1] || "")) {
    dateLabel = formatDocDateLabel(rest.pop() as string);
  } else if (rest.length && /^\d{6}$/.test(rest[rest.length - 1] || "")) {
    dateLabel = formatDocDateLabel(rest.pop() as string);
  } else {
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
      const legacyCompact = last.match(/^(\d{2})([A-Z]{3})(\d{4})$/);
      if (legacyCompact) {
        dateLabel = `${legacyCompact[1]} ${legacyCompact[2]} ${legacyCompact[3]}`;
        rest.pop();
      }
    }
  }

  let state = "";
  if (rest.length && /^[A-Z]{2}$/.test(rest[rest.length - 1] || "")) {
    state = rest.pop() as string;
  } else if (rest[0] && /^[A-Z]{2}$/.test(rest[0])) {
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
