/**
 * Carrier tracking sync — pluggable provider.
 *
 * Set TRACKING_PROVIDER=mock (default) or aftership / 17track when keys exist.
 * Mock advances: pending → in_transit → delivered based on shippedAt age
 * so local demos can auto-complete without a real carrier API.
 */

export type TrackingNormalizedStatus =
  | "pending"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "unknown";

export type TrackingResult = {
  status: TrackingNormalizedStatus;
  description: string;
  events: { at: string; description: string; location?: string }[];
  provider: string;
  raw?: unknown;
};

function daysSince(iso: Date | string | null | undefined) {
  if (!iso) return 0;
  const t = typeof iso === "string" ? new Date(iso) : iso;
  return Math.max(0, (Date.now() - t.getTime()) / (1000 * 60 * 60 * 24));
}

/** Demo provider — no external API. */
export async function trackWithMock(input: {
  carrier: string | null;
  trackingNumber: string;
  shippedAt?: Date | string | null;
}): Promise<TrackingResult> {
  const age = daysSince(input.shippedAt);
  const carrier = input.carrier || "Carrier";
  const tn = input.trackingNumber;

  if (age >= 3) {
    return {
      status: "delivered",
      description: `Delivered (mock · ${carrier} ${tn})`,
      provider: "mock",
      events: [
        {
          at: new Date(Date.now() - 3 * 86400000).toISOString(),
          description: "Picked up",
        },
        {
          at: new Date(Date.now() - 1.5 * 86400000).toISOString(),
          description: "In transit",
        },
        {
          at: new Date().toISOString(),
          description: "Delivered",
        },
      ],
    };
  }

  if (age >= 0.5) {
    return {
      status: "in_transit",
      description: `In transit (mock · ${carrier} ${tn})`,
      provider: "mock",
      events: [
        {
          at: new Date(Date.now() - age * 86400000).toISOString(),
          description: "Picked up",
        },
        {
          at: new Date().toISOString(),
          description: "In transit to destination",
        },
      ],
    };
  }

  return {
    status: "pending",
    description: `Label created (mock · ${carrier} ${tn})`,
    provider: "mock",
    events: [
      {
        at: new Date().toISOString(),
        description: "Shipment information received",
      },
    ],
  };
}

/**
 * Optional AfterShip (set AFTERSHIP_API_KEY). Falls back to mock on error/missing key.
 */
async function trackWithAfterShip(input: {
  carrier: string | null;
  trackingNumber: string;
  shippedAt?: Date | string | null;
}): Promise<TrackingResult> {
  const key = process.env.AFTERSHIP_API_KEY;
  if (!key) return trackWithMock(input);

  try {
    const res = await fetch(
      `https://api.aftership.com/tracking/2024-01/trackings?tracking_numbers=${encodeURIComponent(input.trackingNumber)}`,
      {
        headers: {
          "as-api-key": key,
          "Content-Type": "application/json",
        },
        next: { revalidate: 0 },
      },
    );
    if (!res.ok) return trackWithMock(input);
    const data = (await res.json()) as {
      data?: {
        trackings?: {
          tag?: string;
          checkpoints?: {
            checkpoint_time?: string;
            message?: string;
            location?: string;
          }[];
        }[];
      };
    };
    const row = data.data?.trackings?.[0];
    const tag = (row?.tag || "").toLowerCase();
    let status: TrackingNormalizedStatus = "unknown";
    if (tag.includes("delivered")) status = "delivered";
    else if (tag.includes("outfordelivery") || tag.includes("out_for_delivery"))
      status = "out_for_delivery";
    else if (tag.includes("transit") || tag.includes("intransit"))
      status = "in_transit";
    else if (tag.includes("exception") || tag.includes("attemptfail"))
      status = "exception";
    else if (tag.includes("info") || tag.includes("pending")) status = "pending";

    return {
      status,
      description: `${tag || "unknown"} (AfterShip)`,
      provider: "aftership",
      events: (row?.checkpoints || []).slice(0, 12).map((c) => ({
        at: c.checkpoint_time || new Date().toISOString(),
        description: c.message || "Update",
        location: c.location,
      })),
      raw: row,
    };
  } catch {
    return trackWithMock(input);
  }
}

export async function fetchTracking(input: {
  carrier: string | null;
  trackingNumber: string;
  shippedAt?: Date | string | null;
}): Promise<TrackingResult> {
  const provider = (process.env.TRACKING_PROVIDER || "mock").toLowerCase();
  if (provider === "aftership") return trackWithAfterShip(input);
  return trackWithMock(input);
}

export function shipmentStatusFromTracking(
  status: TrackingNormalizedStatus,
): "pending" | "shipped" | "delivered" {
  if (status === "delivered") return "delivered";
  if (
    status === "in_transit" ||
    status === "out_for_delivery" ||
    status === "exception"
  ) {
    return "shipped";
  }
  return "pending";
}
