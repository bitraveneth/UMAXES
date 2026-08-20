import { NextResponse } from "next/server";
import { verifyAltchaPayload } from "@/lib/altcha";
import { sendResetEmailOtp } from "@/lib/email-otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const altcha = body.altcha;

    const captcha = await verifyAltchaPayload(altcha);
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    const result = await sendResetEmailOtp(email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a code will be sent.",
      ...("devCode" in result && result.devCode
        ? { devCode: result.devCode }
        : {}),
    });
  } catch (error) {
    console.error("forgot password email send error", error);
    return NextResponse.json(
      { error: "Unable to send verification code" },
      { status: 500 },
    );
  }
}
