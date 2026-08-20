"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import AltchaField from "@/components/AltchaField";
import AuthMessage from "@/components/auth/AuthMessage";
import AuthMethodPicker from "@/components/auth/AuthMethodPicker";
import PhoneFields from "@/components/auth/PhoneFields";
import {
  AUTH_FIELD_CLASS,
  SUBMIT_BTN_CLASS,
  type AuthMethod,
} from "@/components/auth/auth-shared";

function getPasswordChecks(pw: string) {
  const lenOk = pw.length >= 6;
  const upper = (pw.match(/[A-Z]/g) || []).length;
  const lower = (pw.match(/[a-z]/g) || []).length;
  const digits = (pw.match(/[0-9]/g) || []).length;
  const symbols = (pw.match(/[^A-Za-z0-9]/g) || []).length;
  const other = digits + symbols;

  const upperOk = upper >= 2;
  const lowerOk = lower >= 2;
  const otherOk = other >= 2;

  return {
    lenOk,
    upper,
    lower,
    other,
    upperOk,
    lowerOk,
    otherOk,
    ok: lenOk && upperOk && lowerOk && otherOk,
  };
}

function toE164Local(phone: string, defaultCountryCode = "1"): string | null {
  const raw = phone.trim();
  if (!raw) return null;

  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  const cc = defaultCountryCode.replace(/\D/g, "") || "1";
  const local = digits.replace(/^0+/, "");
  if (local.length < 7 || local.length > 12) return null;
  return `+${cc}${local}`;
}

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const methodFromUrl = searchParams.get("method");

  const [method, setMethod] = useState<AuthMethod>(
    methodFromUrl === "phone" ? "phone" : "email",
  );
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("1");
  const [phone, setPhone] = useState("");

  const [altchaSend, setAltchaSend] = useState("");
  const [altchaReset, setAltchaReset] = useState("");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendInfo, setSendInfo] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pwChecks = useMemo(
    () => (newPassword.length > 0 ? getPasswordChecks(newPassword) : null),
    [newPassword],
  );

  const phoneE164 = useMemo(() => {
    if (!phone.trim()) return null;
    return toE164Local(phone.trim(), countryCode);
  }, [phone, countryCode]);

  function chooseMethod(next: AuthMethod) {
    setMethod(next);
    setCodeSent(false);
    setOtp("");
    setNewPassword("");
    setAltchaSend("");
    setAltchaReset("");
    setSendError(null);
    setSendInfo(null);
    setDevOtpHint(null);
    setError(null);
  }

  async function sendCode() {
    setError(null);
    setSendError(null);
    setSendInfo(null);
    setDevOtpHint(null);

    if (!altchaSend) {
      setSendError("Please complete the security check to send the code.");
      return;
    }

    if (method === "email") {
      if (!email.trim() || !email.includes("@")) {
        setSendError("Enter a valid email address.");
        return;
      }
    } else if (!phoneE164) {
      setSendError("Enter a valid mobile number.");
      return;
    }

    setSendingCode(true);
    try {
      const res = await fetch(
        method === "email"
          ? "/api/auth/forgot-password/email/send"
          : "/api/auth/forgot-password/phone/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            method === "email"
              ? { email, altcha: altchaSend }
              : { countryCode, phone, altcha: altchaSend },
          ),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendError(data.error || "Unable to send verification code");
        return;
      }
      setCodeSent(true);
      setOtp("");
      setAltchaSend("");
      setSendInfo(
        data.message ||
          (method === "email"
            ? "If an account exists for that email, a code will be sent."
            : "Verification code sent."),
      );
      if (data.devCode) setDevOtpHint(String(data.devCode));
    } finally {
      setSendingCode(false);
    }
  }

  async function resetPassword() {
    setError(null);
    setSendError(null);
    if (!codeSent || !otp.trim()) {
      setError(
        method === "email"
          ? "Enter the email verification code."
          : "Enter the SMS verification code.",
      );
      return;
    }
    const checks = getPasswordChecks(newPassword);
    if (!checks.ok) {
      setError(
        "Password must be at least 6 characters and include 2 uppercase, 2 lowercase, and 2 digits or symbols.",
      );
      return;
    }
    if (!altchaReset) {
      setError("Please complete the security check to reset your password.");
      return;
    }
    if (method === "email") {
      if (!email.trim()) {
        setError("Enter a valid email address.");
        return;
      }
    } else if (!phoneE164) {
      setError("Enter a valid mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        method === "email"
          ? "/api/auth/forgot-password/email/reset"
          : "/api/auth/forgot-password/phone/reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            method === "email"
              ? { email, otp, newPassword, altcha: altchaReset }
              : {
                  countryCode,
                  phone,
                  otp,
                  newPassword,
                  altcha: altchaReset,
                },
          ),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Unable to reset password");
        return;
      }

      router.push(`/login?method=${method}&reset=1`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-3.5">
      {!codeSent ? (
        <>
          <AuthMethodPicker
            value={method}
            onChange={chooseMethod}
            mode="signin"
          />

          {method === "email" ? (
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block font-display text-sm font-semibold text-black"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={AUTH_FIELD_CLASS}
              />
            </div>
          ) : (
            <PhoneFields
              countryCode={countryCode}
              phone={phone}
              onCountryCodeChange={setCountryCode}
              onPhoneChange={setPhone}
            />
          )}

          <AltchaField value={altchaSend} onChange={setAltchaSend} />

          {sendError ? <AuthMessage tone="error">{sendError}</AuthMessage> : null}

          <button
            type="button"
            onClick={sendCode}
            disabled={sendingCode}
            className={SUBMIT_BTN_CLASS}
          >
            {sendingCode
              ? "Sending…"
              : method === "email"
                ? "Send email code"
                : "Send SMS code"}
          </button>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
            <p className="font-body text-sm text-emerald-800">
              {sendInfo ||
                (method === "email"
                  ? "Check your email for the verification code."
                  : "Code sent. Enter it below to set a new password.")}
            </p>
            {devOtpHint ? (
              <p className="mt-1 font-body text-sm text-emerald-900">
                Local test code: <strong>{devOtpHint}</strong>
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setOtp("");
                setNewPassword("");
                setAltchaReset("");
                setSendInfo(null);
                setSendError(null);
                setDevOtpHint(null);
                setError(null);
              }}
              className="mt-1.5 font-display text-xs font-semibold text-umx-orange hover:underline"
            >
              {method === "email"
                ? "Change email / resend"
                : "Change number / resend"}
            </button>
          </div>

          <div>
            <label
              htmlFor="otp"
              className="mb-1.5 block font-display text-sm font-semibold text-black"
            >
              Verification code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              className={AUTH_FIELD_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block font-display text-sm font-semibold text-black"
            >
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={AUTH_FIELD_CLASS}
            />
            {pwChecks ? (
              <ul className="mt-2 space-y-1 font-body text-sm text-black/50">
                <li className={pwChecks.lenOk ? "text-emerald-700" : undefined}>
                  {pwChecks.lenOk ? "✓" : "○"} At least 6 characters
                </li>
                <li
                  className={pwChecks.upperOk ? "text-emerald-700" : undefined}
                >
                  {pwChecks.upperOk ? "✓" : "○"} 2 uppercase letters
                </li>
                <li
                  className={pwChecks.lowerOk ? "text-emerald-700" : undefined}
                >
                  {pwChecks.lowerOk ? "✓" : "○"} 2 lowercase letters
                </li>
                <li
                  className={pwChecks.otherOk ? "text-emerald-700" : undefined}
                >
                  {pwChecks.otherOk ? "✓" : "○"} 2 digits or symbols
                </li>
              </ul>
            ) : null}
          </div>

          <AltchaField value={altchaReset} onChange={setAltchaReset} />

          {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

          <button
            type="button"
            onClick={resetPassword}
            disabled={loading}
            className={SUBMIT_BTN_CLASS}
          >
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </>
      )}

      <div className="flex items-center gap-3 pt-2">
        <div className="h-px flex-1 bg-black/10" aria-hidden />
        <p className="shrink-0 font-body text-xs text-black/40">
          Remembered your password?
        </p>
        <div className="h-px flex-1 bg-black/10" aria-hidden />
      </div>
      <Link
        href={`/login?method=${method}`}
        className="mt-1 inline-flex w-full items-center justify-center rounded-xl border border-black/12 bg-white px-4 py-2.5 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:bg-umx-orange hover:text-white"
      >
        Sign in
      </Link>
    </div>
  );
}
