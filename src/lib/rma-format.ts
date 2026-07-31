/** Shared helpers for RMA / return address snapshots. */

export type ParsedShipAddress = {
  lines: string[];
  route: string;
  city: string;
  country: string;
  raw: string;
};

export function parseAddressSnap(snap: string | null | undefined): ParsedShipAddress {
  const raw = snap?.trim() || "";
  if (!raw) {
    return { lines: [], route: "—", city: "", country: "", raw: "" };
  }
  try {
    const address = JSON.parse(raw) as {
      line1?: string;
      line2?: string | null;
      city?: string;
      region?: string | null;
      postalCode?: string;
      country?: string;
      label?: string;
    };
    const lines = [
      [address.line1, address.line2].filter(Boolean).join(", "),
      [address.city, address.region, address.postalCode]
        .filter(Boolean)
        .join(", "),
      address.country,
    ].filter(Boolean) as string[];
    const route =
      [address.city, address.country].filter(Boolean).join(" → ") || "—";
    return {
      lines,
      route,
      city: address.city || "",
      country: address.country || "",
      raw,
    };
  } catch {
    return {
      lines: [raw.slice(0, 120)],
      route: raw.slice(0, 40),
      city: "",
      country: "",
      raw,
    };
  }
}

export function formatCompanyLevel(level: string): string {
  switch (level) {
    case "DISTRO":
      return "Distributor";
    case "WHOLESALER":
      return "Wholesaler";
    case "SHOP":
      return "Shop";
    default:
      return level;
  }
}
