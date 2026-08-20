import Image from "next/image";
import Link from "next/link";
import AuthImageCarousel from "@/components/AuthImageCarousel";
import { logos } from "@/lib/assets";

type AuthSplitShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  leftDescription: string;
  leftTop?: React.ReactNode;
  children: React.ReactNode;
};

export default function AuthSplitShell({
  title,
  description,
  children,
}: AuthSplitShellProps) {
  return (
    <main className="umx-brand-orange fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-[#e8e0d6]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,91,4,0.12),transparent_55%)]"
      />

      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 z-[2] inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 font-display text-xs font-semibold tracking-wide text-black transition hover:border-umx-orange hover:bg-umx-orange hover:text-white sm:top-5 sm:right-6 sm:text-sm"
      >
        Visit website
      </Link>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-6">
        <div className="my-auto flex w-full max-w-[64rem] flex-col lg:max-w-[72rem]">
          <div className="mb-4 flex flex-col items-center text-center sm:mb-5">
            <div className="relative h-8 w-40 sm:h-9 sm:w-44">
              <Image
                src={logos.orangeTransparent}
                alt="UMAXES"
                fill
                className="object-contain brightness-0"
                sizes="176px"
                priority
              />
            </div>
            <p className="mt-2 font-display text-[0.7rem] font-semibold tracking-[0.28em] text-black/55 uppercase sm:text-xs">
              Members portal
            </p>
          </div>

          {/* Mobile: natural height. Desktop: shared comfortable sign-in card size */}
          <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(0,0,0,0.12)] ring-1 ring-black/5 lg:h-[min(42.5rem,calc(100dvh-7.5rem))] lg:flex-row lg:rounded-[1.25rem]">
            <AuthImageCarousel />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="h-1 w-full shrink-0 bg-gradient-to-r from-umx-orange via-[#ff7a33] to-[#ffb888] lg:hidden" />

              <div className="flex min-h-0 flex-1 flex-col justify-center px-6 py-6 sm:px-8 sm:py-7 lg:overflow-hidden lg:px-10 lg:pt-8 lg:pb-10 xl:px-11">
                <div className="w-full">
                  <div className="mb-5 text-center">
                    <h1 className="font-display text-[1.45rem] font-bold tracking-[-0.03em] text-black sm:text-[1.6rem]">
                      {title}
                    </h1>
                    <p className="mx-auto mt-1.5 max-w-sm font-body text-sm text-black/48">
                      {description}
                    </p>
                  </div>

                  <div className="w-full">{children}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-[2] shrink-0 border-t border-black/10 bg-[#1a1a1a] px-4 py-2.5 text-center sm:px-6 sm:py-3">
        <p className="mx-auto max-w-4xl font-body text-[0.7rem] leading-snug text-white/70 sm:text-xs">
          <span className="font-display font-semibold tracking-[0.08em] text-umx-orange uppercase">
            Warning:
          </span>{" "}
          This product contains nicotine. Nicotine is an addictive chemical. For
          adults 21 years of age or older only.
        </p>
      </footer>
    </main>
  );
}
