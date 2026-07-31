"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";

export default function DemoAccountsLeftCard() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const demoId = searchParams.get("demo");

  function hrefFor(id: string) {
    const base = `/login?method=email&demo=${encodeURIComponent(id)}`;
    if (!callbackUrl) return base;
    return `${base}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }

  return (
    <div className="rounded-[1.75rem] border border-umx-cream-deep/80 bg-umx-cream p-4 shadow-[0_24px_60px_rgba(0,0,0,0.28),0_1px_0_rgba(255,255,255,0.9)_inset]">
      <div className="mb-3.5 border-b border-umx-cream-deep pb-3">
        <p className="font-display text-[0.65rem] font-semibold tracking-[0.2em] text-black/55 uppercase">
          Demo accounts
        </p>
        <p className="mt-1.5 font-body text-xs leading-relaxed text-black/65">
          Tap to fill email path, then complete the captcha.
        </p>
      </div>

      <div className="space-y-2">
        {DEMO_ACCOUNTS.map((acc) => {
          const isActive = demoId === acc.id;

          return (
            <Link
              key={acc.id}
              href={hrefFor(acc.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-[1.15rem] border px-3.5 py-3 text-left transition duration-200 ${
                isActive
                  ? "border-umx-orange/45 bg-umx-cream-bright shadow-[0_10px_24px_rgba(255,91,4,0.12)]"
                  : "border-umx-cream-deep bg-umx-cream-warm/70 hover:border-umx-orange/30 hover:bg-umx-cream-bright hover:shadow-[0_8px_20px_rgba(61,22,5,0.06)]"
              }`}
            >
              <div className="min-w-0">
                <p className="font-display text-sm font-bold tracking-tight text-black">
                  {acc.label}
                  <span className="ml-1.5 font-body text-xs font-normal text-black/60">
                    {acc.note}
                  </span>
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-display text-[10px] font-semibold tracking-[0.12em] uppercase ${
                  isActive
                    ? "bg-umx-orange text-white"
                    : "bg-black/[0.06] text-black/60"
                }`}
              >
                Fill
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
