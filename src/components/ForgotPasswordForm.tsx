"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AltchaField from "@/components/AltchaField";
import AuthMessage from "@/components/auth/AuthMessage";
import PhoneFields from "@/components/auth/PhoneFields";
import {
  AUTH_FIELD_CLASS,
  type AuthMethod,
} from "@/components/auth/auth-shared";
import { useSearchParams, useRouter } from "next/navigation";

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

function SecurityBlock({
  title,
  helper,
  value,
  onChange,
}: {
  title: string;
  helper: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/35 bg-white/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-sm">
      <p className="font-display text-sm font-semibold text-black">{title}</p>
      <p className="mt-1 font-body text-sm leading-relaxed text-black/70">
        {helper}
      </p>
      <div className="mt-3">
        <AltchaField value={value} onChange={onChange} />
      </div>
    </div>
  );
}

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get("method") as AuthMethod | null;

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pwChecks = useMemo(
    () => getPasswordChecks(newPassword),
    [newPassword],
  );

  const phoneE164 = useMemo(() => {
    if (!phone.trim()) return null;
    return toE164Local(phone.trim(), countryCode);
  }, [phone, countryCode]);

  async function sendCode() {
    setError(null);
    setSendError(null);
    setSendInfo(null);
    if (!phoneE164) {
      setSendError("Enter a valid mobile number.");
      return;
    }
    if (!altchaSend) {
      setSendError("Please complete the security check to send the code.");
      return;
    }

    setSendingCode(true);
    try {
      const res = await fetch("/api/auth/forgot-password/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode,
          phone,
          altcha: altchaSend,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendError(data.error || "Unable to send verification code");
        return;
      }
      setCodeSent(true);
      setOtp("");
      setAltchaSend("");
      setSendInfo(data.message || "Verification code sent. Enter it below.");
    } finally {
      setSendingCode(false);
    }
  }

  async function resetPassword() {
    setError(null);
    setSendError(null);
    if (!codeSent || !otp.trim()) {
      setError("Enter the SMS verification code.");
      return;
    }
    if (!pwChecks.ok) {
      setError(
        "Password must be at least 6 characters and include 2 uppercase, 2 lowercase, and 2 digits or symbols.",
      );
      return;
    }
    if (!altchaReset) {
      setError("Please complete the security check to reset your password.");
      return;
    }
    if (!phoneE164) {
      setError("Enter a valid mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        "/api/auth/forgot-password/phone/reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            countryCode,
            phone,
            otp,
            newPassword,
            altcha: altchaReset,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Unable to reset password");
        return;
      }

      router.push("/login?method=phone&reset=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-5">
      {method === "email" ? (
        <p className="rounded-xl bg-white/40 px-4 py-3 font-body text-xs text-black/55">
          Password reset is available via phone OTP for now.
        </p>
      ) : null}

      <PhoneFields
        countryCode={countryCode}
        phone={phone}
        onCountryCodeChange={setCountryCode}
        onPhoneChange={setPhone}
      />

      <SecurityBlock
        title="Send verification code"
        helper="Complete the security check, then we will send an SMS code."
        value={altchaSend}
        onChange={setAltchaSend}
      />

      <button
        type="button"
        onClick={sendCode}
        disabled={sendingCode}
        className="w-full rounded-full bg-umx-orange py-3.5 font-display text-sm font-bold tracking-wide text-white shadow-[0_14px_32px_rgba(255,91,4,0.28)] transition hover:bg-umx-orange-mid disabled:opacity-60"
      >
        {sendingCode ? "Sending..." : "Send SMS code"}
      </button>

      {sendError ? <AuthMessage tone="error">{sendError}</AuthMessage> : null}
      {sendInfo ? <AuthMessage tone="success">{sendInfo}</AuthMessage> : null}

      <div>
        <label
          htmlFor="otp"
          className="mb-2 block font-display text-sm font-semibold text-black"
        >
          SMS verification code
        </label>
        <input
          id="otp"
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required={codeSent}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="6-digit code"
          className={AUTH_FIELD_CLASS}
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="mb-2 block font-display text-sm font-semibold text-black"
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
          placeholder="At least 6 characters"
          className={AUTH_FIELD_CLASS}
        />

        <div className="mt-3 space-y-2 rounded-[1.15rem] border border-white/25 bg-white/35 px-4 py-3 backdrop-blur-sm">
          <p className="font-display text-xs font-semibold text-black/50">
            Password must contain:
          </p>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span
              className={pwChecks.lenOk ? "text-emerald-800" : "text-black/40"}
            >
              {pwChecks.lenOk ? "[x]" : "[ ]"} At least 6 characters
            </span>
            <span className="text-black/35">
              {newPassword.length}/6
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span
              className={pwChecks.upperOk ? "text-emerald-800" : "text-black/40"}
            >
              {pwChecks.upperOk ? "[x]" : "[ ]"} 2 uppercase letters
            </span>
            <span className="text-black/35">{pwChecks.upper}/2</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span
              className={pwChecks.lowerOk ? "text-emerald-800" : "text-black/40"}
            >
              {pwChecks.lowerOk ? "[x]" : "[ ]"} 2 lowercase letters
            </span>
            <span className="text-black/35">{pwChecks.lower}/2</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span
              className={pwChecks.otherOk ? "text-emerald-800" : "text-black/40"}
            >
              {pwChecks.otherOk ? "[x]" : "[ ]"} 2 digits or symbols
            </span>
            <span className="text-black/35">{pwChecks.other}/2</span>
          </div>
        </div>
      </div>

      <SecurityBlock
        title="Reset password"
        helper="Complete the security check, then submit your new password."
        value={altchaReset}
        onChange={setAltchaReset}
      />

      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

      <button
        type="button"
        onClick={resetPassword}
        disabled={loading}
        className="w-full rounded-full bg-umx-orange py-3.5 font-display text-sm font-bold tracking-wide text-white shadow-[0_14px_32px_rgba(255,91,4,0.28)] transition hover:bg-umx-orange-mid disabled:opacity-60"
      >
        {loading ? "Resetting..." : "Reset password"}
      </button>

      <p className="text-center font-body text-sm text-black/60">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-umx-orange underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

