import twilio from "twilio";
import type { Twilio } from "twilio";
import { toE164 } from "@/lib/phone";

export { toE164 };

type TwilioConfig = {
  accountSid: string;
  verifyServiceSid: string;
  /** API Key SID (SK…) preferred */
  apiKeySid?: string;
  apiKeySecret?: string;
  /** Fallback Account Auth Token */
  authToken?: string;
};

function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim();
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const preferApiKey = process.env.TWILIO_USE_API_KEY === "true";

  if (!accountSid || !verifyServiceSid) return null;

  // Prefer API Key when explicitly enabled (needs Standard key or Verify permissions).
  if (preferApiKey && apiKeySid && apiKeySecret) {
    return { accountSid, verifyServiceSid, apiKeySid, apiKeySecret };
  }

  if (authToken) {
    return { accountSid, verifyServiceSid, authToken };
  }

  if (apiKeySid && apiKeySecret) {
    return { accountSid, verifyServiceSid, apiKeySid, apiKeySecret };
  }

  return null;
}

function createTwilioClient(config: TwilioConfig): Twilio {
  if (config.apiKeySid && config.apiKeySecret) {
    return twilio(config.apiKeySid, config.apiKeySecret, {
      accountSid: config.accountSid,
    });
  }

  return twilio(config.accountSid, config.authToken!);
}

export function isTwilioVerifyConfigured() {
  return getTwilioConfig() !== null;
}

export async function sendPhoneVerification(phoneE164: string) {
  const config = getTwilioConfig();
  if (!config) {
    return {
      ok: false as const,
      error: "Phone verification is not configured",
    };
  }

  try {
    const client = createTwilioClient(config);
    const verification = await client.verify.v2
      .services(config.verifyServiceSid)
      .verifications.create({ to: phoneE164, channel: "sms" });

    return {
      ok: true as const,
      status: verification.status,
      to: phoneE164,
    };
  } catch (error) {
    console.error("twilio send verification", error);
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Unable to send verification code";
    return { ok: false as const, error: message };
  }
}

export async function checkPhoneVerification(phoneE164: string, code: string) {
  const config = getTwilioConfig();
  if (!config) {
    return {
      ok: false as const,
      error: "Phone verification is not configured",
    };
  }

  const otp = code.replace(/\D/g, "");
  if (otp.length < 4 || otp.length > 10) {
    return { ok: false as const, error: "Enter the verification code from SMS" };
  }

  try {
    const client = createTwilioClient(config);
    const check = await client.verify.v2
      .services(config.verifyServiceSid)
      .verificationChecks.create({ to: phoneE164, code: otp });

    if (check.status !== "approved") {
      return { ok: false as const, error: "Invalid or expired verification code" };
    }

    return { ok: true as const };
  } catch (error) {
    console.error("twilio check verification", error);
    return {
      ok: false as const,
      error: "Invalid or expired verification code",
    };
  }
}
