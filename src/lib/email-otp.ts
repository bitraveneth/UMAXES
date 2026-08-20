import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  buildResetOtpEmail,
  buildSignupOtpEmail,
  isSmtpConfigured,
  sendMail,
} from "@/lib/email";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_ATTEMPTS = 8;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function deliverEmailOtp(opts: {
  email: string;
  code: string;
  expiresAt: Date;
  mail: { subject: string; text: string; html: string };
}) {
  const smtpReady = isSmtpConfigured();

  if (smtpReady) {
    const sent = await sendMail({
      to: opts.email,
      subject: opts.mail.subject,
      text: opts.mail.text,
      html: opts.mail.html,
    });
    if (!sent.ok) {
      return { ok: false as const, error: sent.error };
    }
  } else if (process.env.NODE_ENV === "production") {
    return {
      ok: false as const,
      error: "Email delivery is not configured on this server",
    };
  } else {
    console.log(
      `\n[email-otp:dev] ${opts.email} → code ${opts.code} (expires ${opts.expiresAt.toISOString()})\n`,
    );
  }

  return {
    ok: true as const,
    email: opts.email,
    /** Only exposed in local/dev when SMTP is not set — for testing without a mailbox. */
    devCode:
      !smtpReady && process.env.NODE_ENV !== "production" ? opts.code : undefined,
  };
}

export async function sendSignupEmailOtp(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) {
    return { ok: false as const, error: "Enter a valid email address" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { ok: false as const, error: "Email is already registered" };
  }

  const latest = await prisma.emailOtp.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (
    latest &&
    Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    return {
      ok: false as const,
      error: "Please wait a moment before requesting another code",
    };
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.emailOtp.create({
    data: { email, codeHash, expiresAt },
  });

  return deliverEmailOtp({
    email,
    code,
    expiresAt,
    mail: buildSignupOtpEmail({ code, email }),
  });
}

/** Password reset: send OTP only if the account exists (generic message to caller). */
export async function sendResetEmailOtp(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) {
    return { ok: false as const, error: "Enter a valid email address" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    // Same shape as a successful send so we do not leak account existence.
    return {
      ok: true as const,
      email,
      silent: true as const,
    };
  }

  const latest = await prisma.emailOtp.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (
    latest &&
    Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    return {
      ok: false as const,
      error: "Please wait a moment before requesting another code",
    };
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.emailOtp.create({
    data: { email, codeHash, expiresAt },
  });

  return deliverEmailOtp({
    email,
    code,
    expiresAt,
    mail: buildResetOtpEmail({ code, email }),
  });
}

export async function verifySignupEmailOtp(rawEmail: string, rawCode: string) {
  const email = normalizeEmail(rawEmail);
  const code = String(rawCode || "").replace(/\D/g, "");

  if (!email || code.length < 4 || code.length > 10) {
    return {
      ok: false as const,
      error: "Enter the verification code from your email",
    };
  }

  const row = await prisma.emailOtp.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    return {
      ok: false as const,
      error: "No verification code found. Request a new one.",
    };
  }

  if (row.expiresAt.getTime() < Date.now()) {
    return {
      ok: false as const,
      error: "Verification code expired. Request a new one.",
    };
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    return {
      ok: false as const,
      error: "Too many attempts. Request a new code.",
    };
  }

  const match = await bcrypt.compare(code, row.codeHash);
  await prisma.emailOtp.update({
    where: { id: row.id },
    data: {
      attempts: { increment: 1 },
      ...(match ? { consumedAt: new Date() } : {}),
    },
  });

  if (!match) {
    return { ok: false as const, error: "Invalid or expired verification code" };
  }

  return { ok: true as const, email };
}

export const verifyResetEmailOtp = verifySignupEmailOtp;
