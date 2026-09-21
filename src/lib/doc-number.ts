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
  /\b(LLC|L\.L\.C|INC|LTD|CORP|CO|LIMITED|INCORPORATED|COMPANY)\b\.?/g;

export function nextSystemId() {
  return String(Math.floor(Math.random() * 9000 + 1000));
}

/** Document date token: 21-SEP-2026 */
export function formatDocDate(date = new Date()) {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[date.getUTCMonth()] || "JAN";
  return `${day}-${mon}-${date.getUTCFullYear()}`;
}

export function slugState(region?: string | null) {
  const raw = (region || "").trim().toUpperCase();
  if (!raw) return "";
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  return raw.replace(/[^A-Z0-9]+/g, "").slice(0, 8);
}

export function slugCompany(name: string) {
  const slug = (name || "")
    .toUpperCase()
    .replace(COMPANY_NOISE, " ")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
  return slug || "CUSTOMER";
}

export function nextOrderNumber() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `UMX-${stamp}-${nextSystemId()}`;
}

/** PI-{STATE}-{COMPANY}-{DD-MON-YYYY}-{SYSID} */
export function nextPiNumber(opts: {
  companyName?: string | null;
  customerName?: string | null;
  region?: string | null;
  orderNumber: string;
  date?: Date;
}) {
  const party = (opts.companyName || opts.customerName || "CUSTOMER").trim();
  const systemId = opts.orderNumber.split("-").pop() || nextSystemId();
  const parts = [
    "PI",
    slugState(opts.region),
    slugCompany(party),
    formatDocDate(opts.date),
    systemId,
  ].filter(Boolean);
  return parts.join("-");
}

export function siblingDocNumber(
  piNumber: string | null | undefined,
  prefix: "PI" | "CI" | "PL",
  orderNumber: string,
) {
  if (piNumber && /^PI-/i.test(piNumber)) {
    return `${prefix}-${piNumber.slice(3)}`;
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
  const prefix = bits[0] || "PI";
  const rest = bits.slice(1);

  let systemId = "";
  if (rest.length && /^\d{3,6}$/.test(rest[rest.length - 1] || "")) {
    systemId = rest.pop() as string;
  }

  let dateLabel = "";
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
    } else if (/^\d{8}$/.test(last)) {
      const mon = MONTHS[Number(last.slice(4, 6)) - 1];
      dateLabel = `${last.slice(6, 8)} ${mon || last.slice(4, 6)} ${last.slice(0, 4)}`;
      rest.pop();
    }
  }

  let state = "";
  if (rest[0] && /^[A-Z]{2}$/.test(rest[0])) {
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
