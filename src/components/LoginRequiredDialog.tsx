"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type LoginRequiredContextValue = {
  askLogin: (href: string) => void;
};

const LoginRequiredContext = createContext<LoginRequiredContextValue | null>(
  null,
);

export function useLoginRequired() {
  const ctx = useContext(LoginRequiredContext);
  if (!ctx) {
    throw new Error("useLoginRequired must be used within LoginRequiredProvider");
  }
  return ctx;
}

export function LoginRequiredProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [nextHref, setNextHref] = useState("/shop");

  const askLogin = useCallback((href: string) => {
    setNextHref(href || "/shop");
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const onLoginPage = pathname === "/login" || pathname.startsWith("/login?");
  const signInHref = `/login?callbackUrl=${encodeURIComponent(nextHref)}`;

  return (
    <LoginRequiredContext.Provider value={{ askLogin }}>
      {children}
      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-required-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white px-6 py-7 text-center shadow-[0_24px_64px_rgba(0,0,0,0.28)] ring-1 ring-black/10 sm:px-8 sm:py-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="login-required-title"
              className="font-display text-xl font-bold tracking-[-0.03em] text-black sm:text-2xl"
            >
              Sign in required
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-black/65 sm:text-base">
              You need to log in to see those pages.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              {onLoginPage ? (
                <button
                  type="button"
                  className="rounded-xl bg-[#1b4f72] px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-[#163f5c]"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </button>
              ) : (
                <Link
                  href={signInHref}
                  className="rounded-xl bg-[#1b4f72] px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-[#163f5c]"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              )}
              <button
                type="button"
                className="rounded-xl border border-black/12 bg-white px-5 py-2.5 font-display text-sm font-semibold text-black transition hover:bg-black/[0.04]"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </LoginRequiredContext.Provider>
  );
}
