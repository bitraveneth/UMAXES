"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import AltchaField from "@/components/AltchaField";
import AuthMessage from "@/components/auth/AuthMessage";
import AuthMethodPicker from "@/components/auth/AuthMethodPicker";
import PhoneFields from "@/components/auth/PhoneFields";
import {
  AUTH_FIELD_CLASS,
  SUBMIT_BTN_CLASS,
  type AuthMethod,
} from "@/components/auth/auth-shared";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { homeForRole } from "@/lib/rbac";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const registered = searchParams.get("registered") === "1";
  const methodFromUrl = searchParams.get("method");
  const demoId = searchParams.get("demo");

  const [method, setMethod] = useState<AuthMethod>(
    methodFromUrl === "phone" ? "phone" : "email",
  );
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("1");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [altcha, setAltcha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function chooseMethod(next: AuthMethod) {
    setMethod(next);
    setError(null);
    setAltcha("");
    setPassword("");
    if (next === "email") {
      setPhone("");
    } else {
      setEmail("");
    }
  }

  useEffect(() => {
    if (!demoId) return;
    const acc = DEMO_ACCOUNTS.find((a) => a.id === demoId);
    if (!acc) return;

    setMethod("email");
    setEmail(acc.email);
    setPassword(acc.password);
    setPhone("");
    setAltcha("");
    setError(null);
  }, [demoId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!altcha) {
      setError("Please complete the captcha before signing in.");
      return;
    }

    const identifier =
      method === "email"
        ? email.trim()
        : phone.trim().startsWith("+")
          ? phone.trim()
          : `+${countryCode}${phone.replace(/\D/g, "")}`;

    if (!identifier || !password) {
      setError(
        method === "email"
          ? "Enter your email and password."
          : "Enter your phone number and password.",
      );
      return;
    }

    setLoading(true);

    const result = await signIn("credentials", {
      identifier,
      password,
      altcha,
      redirect: false,
    });

    setLoading(false);
    setAltcha("");

    if (!result || result.error || result.ok === false) {
      setError(
        "Invalid login details or captcha expired. Check your details and try again.",
      );
      return;
    }

    const session = await getSession();
    const next = session?.user
      ? homeForRole(
          session.user.role,
          session.user.status,
          session.user.companyLevel,
        )
      : "/account";
    const cb = callbackUrl || "";
    const dest =
      session?.user &&
      ["SUPER_ADMIN", "ADMIN", "SALES", "WAREHOUSE", "LOGISTICS"].includes(
        session.user.role,
      )
        ? next
        : cb.startsWith("/") && !cb.startsWith("//")
          ? cb
          : next;
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="w-full space-y-3.5">
      {registered && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 font-body text-sm text-emerald-800">
          Account created. Sign in to start shopping.
        </p>
      )}

      <AuthMethodPicker value={method} onChange={chooseMethod} mode="signin" />

      <form onSubmit={onSubmit} className="space-y-3">
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

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="block font-display text-sm font-semibold text-black"
            >
              Password
            </label>
            <Link
              href={`/forgot-password?method=${method}`}
              className="font-display text-xs font-semibold text-umx-orange hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={AUTH_FIELD_CLASS}
          />
        </div>

        <AltchaField value={altcha} onChange={setAltcha} />

        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

        <button type="submit" disabled={loading} className={SUBMIT_BTN_CLASS}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-3 pt-2">
        <div className="h-px flex-1 bg-black/10" aria-hidden />
        <p className="shrink-0 font-body text-xs text-black/40">New to UMAXES?</p>
        <div className="h-px flex-1 bg-black/10" aria-hidden />
      </div>
      <Link
        href={
          method
            ? `/register?method=${method}&callbackUrl=${encodeURIComponent(callbackUrl)}`
            : `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
        }
        className="mt-1 inline-flex w-full items-center justify-center rounded-xl border border-black/12 bg-white px-4 py-2.5 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:bg-umx-orange hover:text-white"
      >
        Create an account
      </Link>
    </div>
  );
}
