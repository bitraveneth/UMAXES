import { NextResponse } from "next/server";
import { sendSignupEmailOtp } from "@/lib/email-otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    const result = await sendSignupEmailOtp(email);
    if (!result.ok) {
      const status =
        result.error === "Email is already registered" ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      ok: true,
      email: result.email,
      message: "Verification code sent",
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (error) {
    console.error("email send error", error);
    return NextResponse.json(
      { error: "Unable to send verification code" },
      { status: 500 },
    );
  }
}
