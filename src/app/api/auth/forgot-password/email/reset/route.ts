import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyAltchaPayload } from "@/lib/altcha";
import { verifyResetEmailOtp } from "@/lib/email-otp";

function passwordOk(password: string) {
  const upper = (password.match(/[A-Z]/g) || []).length;
  const lower = (password.match(/[a-z]/g) || []).length;
  const digits = (password.match(/[0-9]/g) || []).length;
  const symbols = (password.match(/[^A-Za-z0-9]/g) || []).length;
  const other = digits + symbols;
  return password.length >= 6 && upper >= 2 && lower >= 2 && other >= 2;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const otp = String(body.otp ?? "").trim();
    const newPassword = String(body.newPassword ?? "");
    const altcha = body.altcha;

    const captcha = await verifyAltchaPayload(altcha);
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 },
      );
    }

    if (!otp || otp.length < 4) {
      return NextResponse.json(
        { error: "Enter the email verification code" },
        { status: 400 },
      );
    }

    if (!passwordOk(newPassword)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters and include 2 uppercase, 2 lowercase, and 2 digits or symbols.",
        },
        { status: 400 },
      );
    }

    const verified = await verifyResetEmailOtp(email, otp);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      ok: true,
      message: "Password updated.",
    });
  } catch (error) {
    console.error("forgot password email reset error", error);
    return NextResponse.json(
      { error: "Unable to reset password" },
      { status: 500 },
    );
  }
}
