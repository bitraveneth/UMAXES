"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import AltchaField from "@/components/AltchaField";
import AuthMessage from "@/components/auth/AuthMessage";
import AuthMethodPicker from "@/components/auth/AuthMethodPicker";
import PhoneFields from "@/components/auth/PhoneFields";
import {
  AUTH_FIELD_CLASS,
  SUBMIT_BTN_CLASS,
  type AuthMethod,
} from "@/components/auth/auth-shared";

type Step = 1 | 2;

function subscribeDesktop(onStoreChange: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getDesktopSnapshot() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function getServerSnapshot() {
  return false;
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerSnapshot,
  );
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

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const methodFromUrl = searchParams.get("method");
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const isDesktop = useIsDesktop();

  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<AuthMethod>(
    methodFromUrl === "phone" ? "phone" : "email",
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
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  useEffect(() => {
    if (!isDesktop) setStep(1);
  }, [isDesktop]);

  function chooseMethod(next: AuthMethod) {
    setMethod(next);
    setError(null);
    setSendError(null);
    setInfo(null);
    setAltcha("");
    setCodeSent(false);
    setTermsAccepted(false);
    setPolicyAccepted(false);
    setDevOtpHint(null);
    setStep(1);
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
      if (key === "phone" || key === "countryCode" || key === "email") {
        next.otp = "";
      }
      return next;
    });
    if (key === "phone" || key === "countryCode" || key === "email") {
      setCodeSent(false);
      setSendError(null);
      setInfo(null);
      setDevOtpHint(null);
    }
  }

  async function sendCode() {
    setError(null);
    setSendError(null);
    setInfo(null);
    setDevOtpHint(null);

    if (method === "email") {
      if (!form.email.trim()) {
        setSendError("Enter your email address first.");
        return;
      }

      setSendingCode(true);
      const res = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json().catch(() => ({}));
      setSendingCode(false);

      if (!res.ok) {
        setSendError(data.error || "Could not send verification code");
        return;
      }

      setCodeSent(true);
      setInfo("Code sent. Check your email.");
      if (data.devCode) {
        setDevOtpHint(String(data.devCode));
        setForm((prev) => ({ ...prev, otp: String(data.devCode) }));
      }
      return;
    }

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

    setCodeSent(true);
    setInfo(`Code sent${data.phone ? ` to ${data.phone}` : ""}.`);
  }

  function validateAccountStep() {
    if (!form.name.trim()) {
      setError("Enter your name.");
      return false;
    }
    if (method === "email") {
      if (!form.email.trim()) {
        setError("Enter your email address.");
        return false;
      }
      if (!codeSent || !form.otp.trim()) {
        setError("Send and enter the email verification code.");
        return false;
      }
    } else {
      if (!form.phone.trim()) {
        setError("Enter your mobile number.");
        return false;
      }
      if (!codeSent || !form.otp.trim()) {
        setError("Send and enter the SMS verification code.");
        return false;
      }
    }
    return true;
  }

  function goNext(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSendError(null);
    if (!validateAccountStep()) return;
    setStep(2);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSendError(null);
    setInfo(null);

    if (!isDesktop && !validateAccountStep()) return;

    if (!termsAccepted) {
      setError("Please accept the terms and conditions.");
      return;
    }
    if (!policyAccepted) {
      setError("Please confirm you are 21+.");
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

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: method === "email" ? form.email : "",
        countryCode: form.countryCode,
        phone: method === "phone" ? form.phone : "",
        otp: form.otp,
        password: form.password,
        altcha,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      setAltcha("");
      setForm((prev) => ({ ...prev, otp: "" }));
      if (isDesktop) setStep(1);
      return;
    }

    const loginQs = new URLSearchParams({
      registered: "1",
      method,
    });
    if (callbackUrl && callbackUrl !== "/account") {
      loginQs.set("callbackUrl", callbackUrl);
    }
    router.push(`/login?${loginQs.toString()}`);
  }

  const pwChecks =
    form.password.length > 0 ? getPasswordChecks(form.password) : null;

  const accountFields = (
    <>
      <AuthMethodPicker value={method} onChange={chooseMethod} mode="signup" />

      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block font-display text-sm font-semibold text-black"
        >
          Name
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
          <label
            htmlFor="email"
            className="mb-1.5 block font-display text-sm font-semibold text-black"
          >
            Email
          </label>
          <div className="flex gap-2">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@company.com"
              className={`min-w-0 flex-1 ${AUTH_FIELD_CLASS}`}
            />
            <button
              type="button"
              onClick={sendCode}
              disabled={sendingCode || codeSent}
              className="shrink-0 rounded-xl border border-black/10 bg-[#f8f6f2] px-4 font-display text-sm font-semibold text-umx-orange transition hover:border-umx-orange hover:bg-umx-orange/5 disabled:opacity-60"
            >
              {sendingCode ? "Sending…" : codeSent ? "Sent" : "Send code"}
            </button>
          </div>
        </div>
      ) : (
        <PhoneFields
          countryCode={form.countryCode}
          phone={form.phone}
          onCountryCodeChange={(code) => update("countryCode", code)}
          onPhoneChange={(value) => update("phone", value)}
          endAction={
            <button
              type="button"
              onClick={sendCode}
              disabled={sendingCode || codeSent}
              className="shrink-0 rounded-xl border border-black/10 bg-[#f8f6f2] px-4 font-display text-sm font-semibold text-umx-orange transition hover:border-umx-orange hover:bg-umx-orange/5 disabled:opacity-60"
            >
              {sendingCode ? "Sending…" : codeSent ? "Sent" : "Send code"}
            </button>
          }
        />
      )}

      {sendError ? <AuthMessage tone="error">{sendError}</AuthMessage> : null}
      {info ? <AuthMessage tone="success">{info}</AuthMessage> : null}
      {devOtpHint ? (
        <AuthMessage tone="success">
          Local test code: <strong>{devOtpHint}</strong>
        </AuthMessage>
      ) : null}

      {codeSent ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor="otp"
              className="block font-display text-sm font-semibold text-black"
            >
              Verification code
            </label>
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setSendError(null);
                setDevOtpHint(null);
                setInfo(null);
                update("otp", "");
              }}
              className="font-display text-sm font-semibold text-umx-orange hover:underline"
            >
              Resend
            </button>
          </div>
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
        </div>
      ) : null}
    </>
  );

  const securityFields = (
    <>
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block font-display text-sm font-semibold text-black"
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
          placeholder="••••••••"
          className={AUTH_FIELD_CLASS}
        />
        {pwChecks ? (
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-body text-xs text-black/50">
            <li className={pwChecks.lenOk ? "text-emerald-700" : undefined}>
              {pwChecks.lenOk ? "✓" : "○"} 6+ characters
            </li>
            <li className={pwChecks.upperOk ? "text-emerald-700" : undefined}>
              {pwChecks.upperOk ? "✓" : "○"} 2 uppercase
            </li>
            <li className={pwChecks.lowerOk ? "text-emerald-700" : undefined}>
              {pwChecks.lowerOk ? "✓" : "○"} 2 lowercase
            </li>
            <li className={pwChecks.otherOk ? "text-emerald-700" : undefined}>
              {pwChecks.otherOk ? "✓" : "○"} 2 digits/symbols
            </li>
          </ul>
        ) : null}
      </div>

      <AltchaField value={altcha} onChange={setAltcha} />

      <div className="space-y-2">
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-black/20 text-umx-orange focus:ring-umx-orange"
          />
          <span className="font-body text-sm text-black/65">
            I agree to the terms and conditions.
          </span>
        </label>
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={policyAccepted}
            onChange={(e) => setPolicyAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-black/20 text-umx-orange focus:ring-umx-orange"
          />
          <span className="font-body text-sm text-black/65">
            I confirm I am 21+ years old.
          </span>
        </label>
      </div>
    </>
  );

  const signInFooter = (
    <>
      <div className="flex items-center gap-3 pt-1">
        <div className="h-px flex-1 bg-black/10" aria-hidden />
        <p className="shrink-0 font-body text-xs text-black/40">
          Already have an account?
        </p>
        <div className="h-px flex-1 bg-black/10" aria-hidden />
      </div>
      <Link
        href={
          method
            ? `/login?method=${method}&callbackUrl=${encodeURIComponent(callbackUrl)}`
            : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        }
        className="mt-1 inline-flex w-full items-center justify-center rounded-xl border border-black/12 bg-white px-4 py-2.5 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:bg-umx-orange hover:text-white"
      >
        Sign in
      </Link>
    </>
  );

  // Mobile: single-step form (unchanged flow)
  if (!isDesktop) {
    return (
      <div className="w-full space-y-3">
        <form onSubmit={onSubmit} className="space-y-3">
          {accountFields}
          {securityFields}
          {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
          <button type="submit" disabled={loading} className={SUBMIT_BTN_CLASS}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        {signInFooter}
      </div>
    );
  }

  // Desktop: two steps
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-center gap-2">
        <span
          className={`h-1.5 w-8 rounded-full ${
            step === 1 ? "bg-umx-orange" : "bg-black/15"
          }`}
          aria-hidden
        />
        <span
          className={`h-1.5 w-8 rounded-full ${
            step === 2 ? "bg-umx-orange" : "bg-black/15"
          }`}
          aria-hidden
        />
      </div>
      <p className="text-center font-display text-[0.65rem] font-semibold tracking-[0.16em] text-black/40 uppercase">
        {step === 1 ? "Step 1 · Account details" : "Step 2 · Password & security"}
      </p>

      {step === 1 ? (
        <form onSubmit={goNext} className="space-y-3">
          {accountFields}
          {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
          <button type="submit" className={SUBMIT_BTN_CLASS}>
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep(1);
            }}
            className="font-display text-xs font-semibold text-umx-orange hover:underline"
          >
            ← Back to account details
          </button>
          {securityFields}
          {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
          <button type="submit" disabled={loading} className={SUBMIT_BTN_CLASS}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      {signInFooter}
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
