"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import AltchaField from "@/components/AltchaField";
import AuthMessage from "@/components/auth/AuthMessage";
import AuthMethodPicker from "@/components/auth/AuthMethodPicker";
import PhoneFields from "@/components/auth/PhoneFields";
import {
  AUTH_FIELD_CLASS,
  SUBMIT_BTN_CLASS,
  type AuthMethod,
} from "@/components/auth/auth-shared";

function PanelIntro({
  title,
  body,
  onReset,
}: {
  title: string;
  body: string;
  onReset: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display text-sm font-bold text-black">{title}</p>
        <p className="mt-1.5 font-body text-sm leading-relaxed text-black/70">
          {body}
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="rounded-full px-3 py-1.5 font-display text-[11px] font-semibold tracking-[0.14em] text-black/70 uppercase transition hover:text-umx-orange"
      >
        Switch
      </button>
    </div>
  );
}

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const methodFromUrl = searchParams.get("method");
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [method, setMethod] = useState<AuthMethod | null>(
    methodFromUrl === "phone" || methodFromUrl === "email"
      ? methodFromUrl
      : null,
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    countryCode: "1",
    phone: "",
    otp: "",
    password: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [altcha, setAltcha] = useState("");
  const [phoneE164, setPhoneE164] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function chooseMethod(next: AuthMethod) {
    setMethod(next);
    setError(null);
    setSendError(null);
    setInfo(null);
    setAltcha("");
    setCodeSent(false);
    setPhoneE164(null);
    setTermsAccepted(false);
    setPolicyAccepted(false);
    setForm((prev) => ({
      ...prev,
      email: next === "email" ? prev.email : "",
      phone: next === "phone" ? prev.phone : "",
      otp: "",
    }));
  }

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "phone" || key === "countryCode") next.otp = "";
      return next;
    });
    if (key === "phone" || key === "countryCode") {
      setCodeSent(false);
      setPhoneE164(null);
      setSendError(null);
      setInfo(null);
    }
  }

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
      ok: lenOk && upperOk && lowerOk && otherOk,
      upperOk,
      lowerOk,
      otherOk,
    };
  }

  async function sendCode() {
    setError(null);
    setSendError(null);
    setInfo(null);

    if (!form.phone.trim()) {
      setSendError("Enter your mobile number first.");
      return;
    }

    setSendingCode(true);
    const res = await fetch("/api/auth/phone/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: form.phone,
        countryCode: form.countryCode,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSendingCode(false);

    if (!res.ok) {
      setSendError(data.error || "Could not send verification code");
      return;
    }

    setPhoneE164(data.phone || null);
    setCodeSent(true);
    setInfo(`Code sent to ${data.phone}. Enter it below.`);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSendError(null);
    setInfo(null);

    if (!method) {
      setError("Choose email or phone to continue.");
      return;
    }
    if (!termsAccepted) {
      setError("Please accept the terms and conditions.");
      return;
    }
    if (!policyAccepted) {
      setError("Please confirm the account policy and adult-use notice.");
      return;
    }
    if (!altcha) {
      setError("Please complete the captcha before creating an account.");
      return;
    }

    const pwChecks = getPasswordChecks(form.password);
    if (!pwChecks.ok) {
      setError(
        "Password must be at least 6 characters and include 2 uppercase, 2 lowercase, and 2 digits or symbols.",
      );
      return;
    }

    if (method === "email") {
      if (!form.email.trim()) {
        setError("Enter your email address.");
        return;
      }
    } else {
      if (!form.phone.trim()) {
        setError("Enter your mobile number.");
        return;
      }
      if (!codeSent || !form.otp.trim()) {
        setError("Send and enter the SMS verification code.");
        return;
      }
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: method === "email" ? form.email : "",
        countryCode: form.countryCode,
        phone: method === "phone" ? form.phone : "",
        otp: method === "phone" ? form.otp : "",
        password: form.password,
        altcha,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      setAltcha("");
      if (method === "phone") {
        setForm((prev) => ({ ...prev, otp: "" }));
      }
      return;
    }

    const loginQs = new URLSearchParams({
      registered: "1",
      method: method || "email",
    });
    if (callbackUrl && callbackUrl !== "/account") {
      loginQs.set("callbackUrl", callbackUrl);
    }
    router.push(`/login?${loginQs.toString()}`);
  }

  useEffect(() => {
    // Force re-confirmation after a new security check token is produced.
    if (!altcha) {
      setTermsAccepted(false);
      setPolicyAccepted(false);
    }
  }, [altcha]);

  return (
    <div className="w-full space-y-6">
      <AuthMethodPicker value={method} onChange={chooseMethod} mode="signup" />

      {method && (
        <form onSubmit={onSubmit} className="space-y-5">
          <PanelIntro
            title={method === "email" ? "Email registration" : "Phone registration"}
            body={
              method === "email"
                ? "Create your account with email and password."
                : "Verify your mobile number by SMS, then finish setup."
            }
            onReset={() => setMethod(null)}
          />

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block font-display text-sm font-semibold text-black">
                Your name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Alex Chen"
                className={AUTH_FIELD_CLASS}
              />
            </div>

            {method === "email" ? (
              <div>
                <label htmlFor="email" className="mb-2 block font-display text-sm font-semibold text-black">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@company.com"
                  className={AUTH_FIELD_CLASS}
                />
              </div>
            ) : (
              <>
                <PhoneFields
                  countryCode={form.countryCode}
                  phone={form.phone}
                  onCountryCodeChange={(code) => update("countryCode", code)}
                  onPhoneChange={(value) => update("phone", value)}
                />

                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sendingCode || codeSent}
                  className="w-full rounded-full border border-umx-orange/35 bg-umx-cream-bright py-3 font-display text-sm font-semibold text-umx-orange transition hover:bg-umx-orange/5 hover:shadow-[0_10px_24px_rgba(255,91,4,0.10)] disabled:opacity-60"
                >
                  {sendingCode
                    ? "Sending code..."
                    : codeSent
                      ? `Code sent${phoneE164 ? ` to ${phoneE164}` : ""}`
                      : "Send SMS code"}
                </button>

                {sendError ? <AuthMessage tone="error">{sendError}</AuthMessage> : null}
                {info ? <AuthMessage tone="success">{info}</AuthMessage> : null}

                <div>
                  <label htmlFor="otp" className="mb-2 block font-display text-sm font-semibold text-black">
                    SMS verification code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={form.otp}
                    onChange={(e) => update("otp", e.target.value)}
                    placeholder="6-digit code"
                    className={AUTH_FIELD_CLASS}
                  />
                  {codeSent && (
                    <button
                      type="button"
                      onClick={() => {
                        setCodeSent(false);
                        setSendError(null);
                        setInfo("You can request a new code now.");
                      }}
                      className="mt-2 font-body text-xs font-semibold text-umx-orange underline-offset-2 hover:underline"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-display text-sm font-semibold text-black"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="At least 6 characters (2A 2a 2 digits/symbols)"
                className={AUTH_FIELD_CLASS}
              />

              {form.password.length > 0 ? (
                (() => {
                  const pwChecks = getPasswordChecks(form.password);
                  return (
                    <div className="mt-3 space-y-2 rounded-[1.15rem] border border-white/35 bg-white/55 px-4 py-3 backdrop-blur-sm">
                      <p className="font-display text-xs font-semibold text-black/50">
                        Password must contain:
                      </p>

                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span
                          className={
                            pwChecks.lenOk
                              ? "text-emerald-800"
                              : "text-black/65"
                          }
                        >
                          {pwChecks.lenOk ? "[x]" : "[ ]"} At least 6
                          characters
                        </span>
                        <span className="text-black/55">
                          {form.password.length}/6
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span
                          className={
                            pwChecks.upperOk
                              ? "text-emerald-800"
                              : "text-black/65"
                          }
                        >
                          {pwChecks.upperOk ? "[x]" : "[ ]"} 2 uppercase
                          letters
                        </span>
                        <span className="text-black/55">
                          {pwChecks.upper}/2
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span
                          className={
                            pwChecks.lowerOk
                              ? "text-emerald-800"
                              : "text-black/65"
                          }
                        >
                          {pwChecks.lowerOk ? "[x]" : "[ ]"} 2 lowercase
                          letters
                        </span>
                        <span className="text-black/55">
                          {pwChecks.lower}/2
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span
                          className={
                            pwChecks.otherOk
                              ? "text-emerald-800"
                              : "text-black/65"
                          }
                        >
                          {pwChecks.otherOk ? "[x]" : "[ ]"} 2 digits or
                          symbols
                        </span>
                        <span className="text-black/55">
                          {pwChecks.other}/2
                        </span>
                      </div>
                    </div>
                  );
                })()
              ) : null}
            </div>

            {altcha ? (
              <>
                <label className="flex items-start gap-3 rounded-[1.25rem] border border-white/35 bg-white/55 px-4 py-3 backdrop-blur-sm">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-black/20 text-umx-orange focus:ring-umx-orange"
                  />
                  <span className="font-body text-sm leading-relaxed text-black/60">
                    I agree to the terms and conditions.
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-[1.25rem] border border-white/35 bg-white/55 px-4 py-3 backdrop-blur-sm">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-black/20 text-umx-orange focus:ring-umx-orange"
                  />
                  <span className="font-body text-sm leading-relaxed text-black/60">
                    I confirm I am 21+ and understand account requests are subject to approval.
                  </span>
                </label>
              </>
            ) : null}

            <div className="rounded-[1.25rem] border border-white/35 bg-white/55 px-4 py-2.5 backdrop-blur-sm">
              <p className="font-display text-sm font-semibold text-black">
                Security check
              </p>
              <div className="mt-2">
                <AltchaField value={altcha} onChange={setAltcha} />
              </div>
            </div>
          </div>

          <p className="font-body text-xs leading-relaxed text-black/65">
            New accounts need admin approval before ordering.
          </p>

          {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

          <button type="submit" disabled={loading} className={SUBMIT_BTN_CLASS}>
            <span className="relative z-[1]">
              {loading ? "Submitting..." : "Create account"}
            </span>
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition duration-700 group-hover:translate-x-full"
            />
          </button>
        </form>
      )}

      {!method && error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

      <p className="text-center font-body text-sm text-black/60">
        Already registered?{" "}
        <Link
          href={
            method
              ? `/login?method=${method}&callbackUrl=${encodeURIComponent(callbackUrl)}`
              : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
          }
          className="font-semibold text-umx-orange underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterForm() {
  return (
    <Suspense
      fallback={<p className="font-body text-sm text-black/50">Loading...</p>}
    >
      <RegisterFormInner />
    </Suspense>
  );
}
