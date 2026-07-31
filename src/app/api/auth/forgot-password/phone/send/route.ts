import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAltchaPayload } from "@/lib/altcha";
import {
  isTwilioVerifyConfigured,
  sendPhoneVerification,
  toE164,
} from "@/lib/twilio";

export async function POST(request: Request) {
  try {
    if (!isTwilioVerifyConfigured()) {
      return NextResponse.json(
        { error: "Phone verification is not configured" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const countryCode =
      String(body.countryCode ?? "1").replace(/\D/g, "") || "1";
    const phoneRaw = String(body.phone ?? "").trim();
    const altcha = body.altcha;

    const captcha = await verifyAltchaPayload(altcha);
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    const phone = toE164(phoneRaw.startsWith("+") ? phoneRaw : phoneRaw, countryCode);
    if (!phone) {
      return NextResponse.json(
        { error: "Enter a valid mobile number" },
        { status: 400 },
      );
    }

    // Avoid leaking account existence
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "If an account exists for that phone, a code will be sent.",
      });
    }

    const sent = await sendPhoneVerification(phone);
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Verification code sent.",
    });
  } catch (error) {
    console.error("forgot password send error", error);
    return NextResponse.json(
      { error: "Unable to send verification code" },
      { status: 500 },
    );
  }
}

