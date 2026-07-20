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
    <div className="w-full">
      <p className="font-display text-[0.6rem] font-semibold tracking-[0.16em] text-white uppercase sm:text-xs sm:tracking-[0.18em]">
        Stay in the loop
      </p>
      <p className="mt-2 hidden font-body text-sm leading-relaxed text-white/75 sm:mt-3 sm:block">
        Flavor drops and session news in your inbox.
      </p>

      {done ? (
        <p className="mt-3 rounded-full bg-white/15 px-3 py-2.5 font-display text-[0.65rem] font-semibold text-white ring-1 ring-white/25 sm:mt-5 sm:px-5 sm:py-3 sm:text-sm">
          You’re on the list.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:mt-5 sm:gap-2.5">
          <label htmlFor="footer-email" className="sr-only">
            Email address
          </label>
          <input
            id="footer-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-full border border-white/25 bg-white/10 px-3 py-2 font-body text-[0.7rem] text-white outline-none placeholder:text-white/45 transition focus:border-white focus:bg-white/15 sm:px-4 sm:py-3 sm:text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-white px-3 py-2 font-display text-[0.7rem] font-semibold !text-umx-orange transition hover:bg-umx-cream sm:px-5 sm:py-3 sm:text-sm"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
