import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
    const countryCode = String(body.countryCode ?? "1").replace(/\D/g, "") || "1";
    const phoneRaw = String(body.phone ?? "").trim();
    const phone = toE164(phoneRaw.startsWith("+") ? phoneRaw : phoneRaw, countryCode);
    if (!phone) {
      return NextResponse.json(
        { error: "Enter a valid mobile number" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "This phone number is already registered" },
        { status: 409 },
      );
    }

    const sent = await sendPhoneVerification(phone);
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      phone,
      message: "Verification code sent",
    });
  } catch (error) {
    console.error("phone send error", error);
    return NextResponse.json(
      { error: "Unable to send verification code" },
      { status: 500 },
    );
  }
}
