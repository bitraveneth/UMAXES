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
    <div className="flex items-start justify-between gap-3 border-b border-umx-cream-deep pb-4">
      <div>
        <p className="font-display text-sm font-bold tracking-tight text-black">
          {title}
        </p>
        <p className="mt-1.5 font-body text-sm leading-relaxed text-black/70">
          {body}
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="rounded-full border border-umx-cream-deep bg-umx-cream-bright px-3 py-1.5 font-display text-[10px] font-semibold tracking-[0.16em] text-black/70 uppercase transition hover:border-umx-orange/40 hover:text-umx-orange"
      >
        Switch
      </button>
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const registered = searchParams.get("registered") === "1";
  const methodFromUrl = searchParams.get("method");
  const demoId = searchParams.get("demo");

  const [method, setMethod] = useState<AuthMethod | null>(
    methodFromUrl === "phone" || methodFromUrl === "email"
      ? methodFromUrl
      : null,
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

    // Prefill demo credentials. Captcha must be completed again.
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

    if (!method) {
      setError("Choose email or phone to continue.");
      return;
    }

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
    // Prefer home for staff; keep callback for customers when safe
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
    <div className="w-full space-y-6">
      {registered && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 font-body text-sm text-emerald-800 ring-1 ring-emerald-100">
          Registration received. Sign in after an admin approves your account.
        </p>
      )}

      <AuthMethodPicker value={method} onChange={chooseMethod} mode="signin" />

      {method && (
        <form onSubmit={onSubmit} className="space-y-5">
          <PanelIntro
            title={method === "email" ? "Email sign in" : "Phone sign in"}
            body={
              method === "email"
                ? "Enter the email linked to your account."
                : "Enter the mobile number linked to your account."
            }
            onReset={() => setMethod(null)}
          />

          <div className="space-y-4">
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
              <label htmlFor="password" className="mb-2 block font-display text-sm font-semibold text-black">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className={AUTH_FIELD_CLASS}
              />
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="font-display text-xs font-semibold text-umx-orange underline-offset-2 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-umx-cream-deep bg-umx-cream-warm/60 px-4 py-3">
              <p className="font-display text-[0.7rem] font-semibold tracking-[0.16em] text-black/65 uppercase">
                Security check
              </p>
              <div className="mt-2">
                <AltchaField value={altcha} onChange={setAltcha} />
              </div>
            </div>
          </div>

          {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

          <button type="submit" disabled={loading} className={SUBMIT_BTN_CLASS}>
            <span className="relative z-[1]">
              {loading ? "Signing in..." : "Sign in"}
            </span>
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition duration-700 group-hover:translate-x-full"
            />
          </button>
        </form>
      )}

      {!method && error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

      <div className="border-t border-umx-cream-deep pt-5">
        <p className="text-center font-body text-sm text-black/70">
          No account yet?{" "}
          <Link
            href={method ? `/register?method=${method}` : "/register"}
            className="font-display font-bold text-umx-orange underline decoration-umx-orange/40 underline-offset-4 transition hover:text-umx-orange-deep hover:decoration-umx-orange"
          >
            Create an account
          </Link>
        </p>
      </div>


    </div>
  );
}
