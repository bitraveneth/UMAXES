"use client";

import Image from "next/image";
import { useCallback, useState, useSyncExternalStore } from "react";
import { logos } from "@/lib/assets";

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getVerified() {
  return sessionVerified;
}

function setVerified() {
  sessionVerified = true;
  listeners.forEach((l) => l());
}

let sessionVerified = false;

export default function AgeGate() {
  const verified = useSyncExternalStore(subscribe, getVerified, () => true);
  const [denied, setDenied] = useState(false);

  const confirm = useCallback(() => {
    setVerified();
  }, []);

  if (verified) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="w-full max-w-[36rem] rounded-[1.75rem] bg-umx-cream px-8 py-12 text-center text-black shadow-[0_24px_64px_rgba(0,0,0,0.35)] ring-1 ring-black/10 sm:px-14 sm:py-16">
        <Image
          src={logos.orangeTransparent}
          alt="UMAXES"
          width={220}
          height={38}
          className="mx-auto mb-8 h-auto w-48 object-contain brightness-0 sm:mb-10 sm:w-56"
          sizes="224px"
          quality={70}
          priority
        />
        {denied ? (
          <>
            <h2
              id="age-gate-title"
              className="font-display text-[clamp(1.85rem,4vw,2.5rem)] font-extrabold leading-[1.1] tracking-[-0.035em]"
            >
              You are not allowed to see this website.
            </h2>
            <p className="mx-auto mt-5 max-w-md font-body text-base leading-[1.8] text-black/70 sm:text-lg">
              UMAXES products are for adults 21+ only. If you are 21 or older,
              confirm below to enter.
            </p>
            <button
              type="button"
              onClick={confirm}
              className="mt-8 rounded-full bg-black px-8 py-4 font-display text-sm font-semibold tracking-[0.12em] text-umx-cream uppercase transition hover:bg-black/85"
            >
              Yes, I am 21+
            </button>
          </>
        ) : (
          <>
            <h2
              id="age-gate-title"
              className="font-display text-[clamp(1.85rem,4vw,2.5rem)] font-extrabold leading-[1.1] tracking-[-0.035em]"
            >
              Are you 21 or older?
            </h2>
            <p className="mx-auto mt-5 max-w-md font-body text-base leading-[1.8] text-black/70 sm:text-lg">
              You must be of legal age to enter this site. Nicotine products are
              for adult use only.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <button
                type="button"
                onClick={confirm}
                className="rounded-full bg-black px-8 py-4 font-display text-sm font-semibold tracking-[0.12em] text-umx-cream uppercase transition hover:bg-black/85"
              >
                Yes, I am 21+
              </button>
              <button
                type="button"
                onClick={() => setDenied(true)}
                className="rounded-full border-2 border-black px-8 py-4 font-display text-sm font-semibold tracking-[0.12em] text-black uppercase transition hover:bg-black hover:text-umx-cream"
              >
                No
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
