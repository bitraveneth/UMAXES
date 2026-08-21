import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyAltchaPayload } from "@/lib/altcha";
import { verifySignupEmailOtp } from "@/lib/email-otp";
import {
  checkPhoneVerification,
  isTwilioVerifyConfigured,
  toE164,
} from "@/lib/twilio";

export async function POST(request: Request) {
  try {
    const { getSiteSettings } = await import("@/lib/site-settings");
    const site = await getSiteSettings();
    if (!site.publicSignInEnabled) {
      return NextResponse.json(
        { error: "Registration is temporarily closed" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const countryCode = String(body.countryCode ?? "1").replace(/\D/g, "") || "1";
    const phoneRaw = String(body.phone ?? "").trim();
    const otp = String(body.otp ?? "").trim();
    const password = String(body.password ?? "");
    const altcha = body.altcha;

    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password are required" },
        { status: 400 },
      );
    }

    const phone = phoneRaw
      ? toE164(phoneRaw.startsWith("+") ? phoneRaw : phoneRaw, countryCode)
      : null;

    if (phoneRaw && !phone) {
      return NextResponse.json(
        { error: "Enter a valid mobile number" },
        { status: 400 },
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 },
      );
    }

    const upper = (password.match(/[A-Z]/g) || []).length;
    const lower = (password.match(/[a-z]/g) || []).length;
    const digits = (password.match(/[0-9]/g) || []).length;
    const symbols = (password.match(/[^A-Za-z0-9]/g) || []).length;
    const other = digits + symbols;

    const passwordOk =
      password.length >= 6 && upper >= 2 && lower >= 2 && other >= 2;

    if (!passwordOk) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters and include 2 uppercase, 2 lowercase, and 2 digits or symbols.",
        },
        { status: 400 },
      );
    }

    const captcha = await verifyAltchaPayload(altcha);
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    if (email) {
      if (!otp) {
        return NextResponse.json(
          { error: "Enter the email verification code" },
          { status: 400 },
        );
      }
      const verified = await verifySignupEmailOtp(email, otp);
      if (!verified.ok) {
        return NextResponse.json({ error: verified.error }, { status: 400 });
      }
    }

    if (phone) {
      if (!isTwilioVerifyConfigured()) {
        return NextResponse.json(
          { error: "Phone verification is not configured" },
          { status: 503 },
        );
      }
      if (!otp) {
        return NextResponse.json(
          { error: "Enter the SMS verification code" },
          { status: 400 },
        );
      }
      const verified = await checkPhoneVerification(phone, otp);
      if (!verified.ok) {
        return NextResponse.json({ error: verified.error }, { status: 400 });
      }
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Email is already registered" },
          { status: 409 },
        );
      }
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json(
          { error: "Phone is already registered" },
          { status: 409 },
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Public self-signup is always retail (SHOP) and auto-approved.
    // Wholesale / distributor accounts are created by admin and may stay PENDING until approved.
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name,
          status: "APPROVED",
          level: "SHOP",
          creditLimit: 0,
          paymentTermsDays: 0,
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          passwordHash,
          role: "CUSTOMER",
          companyRole: "OWNER",
          status: "APPROVED",
          companyId: company.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTERED",
          entity: "User",
          entityId: user.id,
          meta: JSON.stringify({
            companyId: company.id,
            level: "SHOP",
            autoApproved: true,
            phoneVerified: Boolean(phone),
          }),
        },
      });

      return { userId: user.id, companyId: company.id };
    });

    return NextResponse.json({
      ok: true,
      message: "Account created. You can sign in and shop now.",
      ...result,
    });
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json(
      { error: "Unable to register right now" },
      { status: 500 },
    );
  }
}
