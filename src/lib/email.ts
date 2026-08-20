import nodemailer from "nodemailer";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

function fromAddress() {
  return (
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    SITE_CONTACT_EMAIL
  );
}

export function buildSignupOtpEmail(opts: {
  code: string;
  email: string;
}) {
  const minutes = 10;
  const subject = `${opts.code} is your UMAXES verification code`;
  const text = [
    "UMAXES",
    "",
    "Your verification code:",
    opts.code,
    "",
    `This code expires in ${minutes} minutes.`,
    "If you did not request this, you can ignore this email.",
    "",
    `Questions? ${SITE_CONTACT_EMAIL}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>UMAXES verification</title>
</head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Georgia,'Times New Roman',serif;color:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#111111;padding:28px 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:#f7f4ee;font-weight:700;">UMAXES</p>
              <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.25;color:#ffffff;font-weight:700;">Verify your email</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:#2a2824;">
                Use this one-time code to finish creating your shop account for
                <strong style="color:#111111;">${escapeHtml(opts.email)}</strong>.
              </p>
              <div style="margin:28px 0;padding:22px 18px;border-radius:16px;background:#f7f4ee;border:1px solid #d9d6cf;text-align:center;">
                <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#666666;font-weight:700;">Verification code</p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:36px;letter-spacing:0.28em;font-weight:800;color:#111111;">${escapeHtml(opts.code)}</p>
              </div>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#5c574f;">
                This code expires in <strong>${minutes} minutes</strong>. Do not share it with anyone.
              </p>
              <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#8a847a;">
                If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="border-top:1px solid #eceae4;padding-top:18px;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#8a847a;">
                  Adults 21+ only · ${escapeHtml(SITE_CONTACT_EMAIL)}
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

export function buildResetOtpEmail(opts: {
  code: string;
  email: string;
}) {
  const minutes = 10;
  const subject = `${opts.code} is your UMAXES password reset code`;
  const text = [
    "UMAXES",
    "",
    "Your password reset code:",
    opts.code,
    "",
    `This code expires in ${minutes} minutes.`,
    "If you did not request a password reset, you can ignore this email.",
    "",
    `Questions? ${SITE_CONTACT_EMAIL}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>UMAXES password reset</title>
</head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Georgia,'Times New Roman',serif;color:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#111111;padding:28px 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:#f7f4ee;font-weight:700;">UMAXES</p>
              <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.25;color:#ffffff;font-weight:700;">Reset your password</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:#2a2824;">
                Use this one-time code to reset the password for
                <strong style="color:#111111;">${escapeHtml(opts.email)}</strong>.
              </p>
              <div style="margin:28px 0;padding:22px 18px;border-radius:16px;background:#f7f4ee;border:1px solid #d9d6cf;text-align:center;">
                <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#666666;font-weight:700;">Reset code</p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:36px;letter-spacing:0.28em;font-weight:800;color:#111111;">${escapeHtml(opts.code)}</p>
              </div>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#5c574f;">
                This code expires in <strong>${minutes} minutes</strong>. Do not share it with anyone.
              </p>
              <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#8a847a;">
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="border-top:1px solid #eceae4;padding-top:18px;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#8a847a;">
                  Adults 21+ only · ${escapeHtml(SITE_CONTACT_EMAIL)}
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!isSmtpConfigured()) {
    return {
      ok: false as const,
      error: "Email delivery is not configured (SMTP)",
    };
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: fromAddress(),
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });

    return { ok: true as const };
  } catch (error) {
    console.error("smtp sendMail", error);
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Unable to send email";
    return { ok: false as const, error: message };
  }
}
