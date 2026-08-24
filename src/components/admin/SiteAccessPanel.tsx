"use client";

import { useState, useTransition } from "react";
import { AdminCard } from "@/components/admin/ui";
import { Globe2, LogIn, Shield } from "lucide-react";

type HomeMode = "home" | "login";

type Props = {
  initial: {
    homepageAsLogin: boolean;
    publicSignInEnabled: boolean;
  };
};

export default function SiteAccessPanel({ initial }: Props) {
  const [mode, setMode] = useState<HomeMode>(
    initial.homepageAsLogin ? "login" : "home",
  );
  const [savedMode, setSavedMode] = useState<HomeMode>(
    initial.homepageAsLogin ? "login" : "home",
  );
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = mode !== savedMode;

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/system/site-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ homepageAsLogin: mode === "login" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Save failed");
        const next: HomeMode = data.settings?.homepageAsLogin ? "login" : "home";
        setMode(next);
        setSavedMode(next);
        setMessage("Saved.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  const optionClass =
    "flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/50 px-4 py-3.5 transition has-[:checked]:border-[var(--admin-brand-500)] has-[:checked]:bg-[var(--admin-brand-50)] has-[:checked]:shadow-[inset_0_0_0_1px_var(--admin-brand-500)]";

  return (
    <AdminCard>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
          <Shield className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="admin-section-title mb-1">Site access</h2>
          <p className="text-sm text-[var(--admin-muted)]">
            Choose what guests see at <span className="font-mono">/</span>.
            Logged-in users always see the home page. Pick one, then Save.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <label className={optionClass}>
              <input
                type="radio"
                name="site-home-mode"
                className="h-4 w-4 accent-[var(--admin-brand-500)]"
                checked={mode === "home"}
                disabled={pending}
                onChange={() => {
                  setMode("home");
                  setMessage(null);
                  setError(null);
                }}
              />
              <span className="min-w-0">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--admin-text)]">
                  <Globe2
                    className="h-4 w-4 text-[var(--admin-brand-500)]"
                    aria-hidden
                  />
                  Home page
                </span>
                <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                  Marketing homepage
                </span>
              </span>
            </label>

            <label className={optionClass}>
              <input
                type="radio"
                name="site-home-mode"
                className="h-4 w-4 accent-[var(--admin-brand-500)]"
                checked={mode === "login"}
                disabled={pending}
                onChange={() => {
                  setMode("login");
                  setMessage(null);
                  setError(null);
                }}
              />
              <span className="min-w-0">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--admin-text)]">
                  <LogIn
                    className="h-4 w-4 text-[var(--admin-brand-500)]"
                    aria-hidden
                  />
                  Sign in page
                </span>
                <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                  Guests go to login; members still see home
                </span>
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={pending || !dirty}
              className="admin-btn admin-btn-primary"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            {message ? (
              <p className="text-sm font-medium text-[var(--admin-success-700)]">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="text-sm font-medium text-[var(--admin-error-700)]">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </AdminCard>
  );
}
