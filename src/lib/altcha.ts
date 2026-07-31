import {
  create,
  deriveHmacKeySecret,
  randomInt,
  CappedMap,
} from "altcha-lib/frameworks/nextjs";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";

const HMAC_SECRET =
  process.env.ALTCHA_HMAC_SECRET?.trim() ||
  process.env.AUTH_SECRET?.trim() ||
  "umaxes-dev-altcha-secret";

const store = new CappedMap<string, boolean>({ maxSize: 2_000 });

type AltchaApi = ReturnType<typeof create> & {
  verifyPayload: (
    payload: unknown,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
};

let altchaPromise: Promise<AltchaApi> | null = null;

async function createAltcha(): Promise<AltchaApi> {
  const hmacKeySignatureSecret = await deriveHmacKeySecret(HMAC_SECRET);

  const api = create({
    hmacSignatureSecret: HMAC_SECRET,
    hmacKeySignatureSecret,
    createChallengeParameters: () => ({
      algorithm: "PBKDF2/SHA-256",
      cost: 5_000,
      counter: randomInt(5_000, 10_000),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }),
    deriveKey,
    store,
  });

  return {
    ...api,
    async verifyPayload(payload: unknown) {
      if (process.env.NODE_ENV === "development" && payload === "dev-bypass") {
        return { ok: true };
      }

      if (payload == null || payload === "") {
        return { ok: false, error: "Please complete the captcha" };
      }

      const result = await api.verify(
        payload,
        deriveKey,
        HMAC_SECRET,
        hmacKeySignatureSecret,
        store,
      );

      if (result.error || !result.verification?.verified) {
        return {
          ok: false,
          error: result.error || "Captcha verification failed",
        };
      }

      return { ok: true };
    },
  };
}

function getAltcha() {
  if (!altchaPromise) {
    altchaPromise = createAltcha();
  }
  return altchaPromise;
}

export async function altchaChallengeHandler(req: Request) {
  return (await getAltcha()).challengeHandler(req);
}

export async function verifyAltchaPayload(payload: unknown) {
  return (await getAltcha()).verifyPayload(payload);
}
