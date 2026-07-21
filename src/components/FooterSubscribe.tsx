"use client";

import { FormEvent, useState } from "react";

export default function FooterSubscribe() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  }

  return (
    <div className="w-full max-w-md lg:ml-auto lg:max-w-sm">
      <p className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-white/50 uppercase">
        Stay in the loop
      </p>
      <p className="mt-3 font-body text-sm leading-relaxed text-white/80">
        Flavor drops and session news — straight to your inbox.
      </p>

      {done ? (
        <p className="mt-5 font-display text-sm font-semibold text-white">
          You’re on the list.
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-stretch"
        >
          <label htmlFor="footer-email" className="sr-only">
            Email address
          </label>
          <input
            id="footer-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            className="min-w-0 flex-1 rounded-full border border-white/25 bg-white/10 px-4 py-3 font-body text-sm text-white outline-none placeholder:text-white/45 transition focus:border-white focus:bg-white/15"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-white px-5 py-3 font-display text-sm font-semibold text-umx-orange transition hover:bg-umx-cream"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
