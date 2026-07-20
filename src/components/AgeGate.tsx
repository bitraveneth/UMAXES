"use client";

import Image from "next/image";
import { useCallback, useSyncExternalStore } from "react";
import { logos } from "@/lib/assets";

const STORAGE_KEY = "umaxes-age-verified";

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getVerified() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setVerified() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export default function AgeGate() {
  const verified = useSyncExternalStore(subscribe, getVerified, () => true);

  const confirm = useCallback(() => {
    setVerified();
  }, []);

  const exit = useCallback(() => {
    window.location.href = "https://www.google.com";
  }, []);

  if (verified) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-umx-orange-ink/90 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="w-full max-w-md rounded-lg bg-umx-orange-ink px-6 py-10 text-center text-umx-cream shadow-none ring-1 ring-umx-cream/15 sm:px-10">
        <Image
          src={logos.orangeTransparent}
          alt="UMAXES"
          width={280}
          height={48}
          className="mx-auto mb-6 h-auto w-48 object-contain"
          priority
        />
        <h2
          id="age-gate-title"
          className="font-display text-2xl font-bold tracking-tight sm:text-[1.65rem]"
        >
          Are you 21 or older?
        </h2>
        <p className="mt-3 font-body text-base text-umx-cream/80">
          You must be of legal age to enter this site. Nicotine products are for
          adult use only.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={confirm}
            className="rounded bg-umx-orange px-6 py-3 font-display text-sm font-semibold text-umx-cream transition hover:bg-umx-orange-deep"
          >
            Yes, I am 21+
          </button>
          <button
            type="button"
            onClick={exit}
            className="rounded border border-umx-cream/35 px-6 py-3 font-display text-sm font-semibold text-umx-cream transition hover:border-umx-cream"
          >
            No, exit
          </button>
        </div>
      </div>
    </div>
  );
}
