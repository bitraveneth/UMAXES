import { HUMAN_CHECK_PAYLOAD } from "@/lib/human-check";

/**
 * Auth forms send a simple human-check token (checkbox).
 * Real Altcha PoW is no longer required — keeps login/register instant.
 */
export async function verifyAltchaPayload(payload: unknown) {
  if (process.env.ALTCHA_BYPASS === "true") {
    return { ok: true as const };
  }

  if (process.env.NODE_ENV === "development" && payload === "dev-bypass") {
    return { ok: true as const };
  }

  if (payload == null || payload === "") {
    return {
      ok: false as const,
      error: "Please confirm you are human",
    };
  }

  if (payload === HUMAN_CHECK_PAYLOAD) {
    return { ok: true as const };
  }

  // Legacy Altcha payloads from old tabs — accept so mid-session users aren't stuck
  if (typeof payload === "string" && payload.length > 20) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    error: "Please confirm you are human",
  };
}

/** Challenge endpoint kept for older clients; returns a no-op response. */
export async function altchaChallengeHandler(_req: Request) {
  return Response.json({
    algorithm: "SHA-256",
    challenge: "disabled",
    salt: "human-check",
    signature: "human-check",
  });
}
