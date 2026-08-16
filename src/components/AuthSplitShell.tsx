import Image from "next/image";
import Link from "next/link";
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
  eyebrow,
  title,
  description,
  leftTop,
  children,
}: AuthSplitShellProps) {
  return (
    <main className="relative min-h-dvh bg-umx-cream lg:grid lg:grid-cols-2">
      <aside className="relative hidden min-h-dvh flex-col overflow-hidden lg:flex">
        {leftTop ? (
          <div className="absolute left-6 top-10 z-[2] w-[21rem]">
            {leftTop}
          </div>
        ) : null}
        <Image
          src="/images/hero/03.webp"
          alt="UMAXES hero"
          fill
          priority
          className="object-cover"
        />
      </aside>

      <section className="relative flex min-h-dvh flex-col overflow-hidden bg-black">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(255,255,255,0.22),transparent_42%),radial-gradient(ellipse_at_10%_100%,rgba(253,246,227,0.18),transparent_48%),linear-gradient(180deg,rgba(61,22,5,0.12)_0%,transparent_28%,rgba(61,22,5,0.18)_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-[1] flex flex-1 flex-col px-5 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12 xl:px-20">
          <div className="mb-10 flex items-center justify-between gap-4 lg:mb-14">
            <Link href="/" className="relative hidden h-8 w-36 lg:block">
              <Image
                src={logos.creamTransparent}
                alt="UMAXES"
                fill
                className="object-contain object-left"
                sizes="144px"
                priority
              />
            </Link>
            <Link href="/" className="relative h-7 w-32 lg:hidden">
              <Image
                src={logos.creamTransparent}
                alt="UMAXES"
                fill
                className="object-contain object-left"
                sizes="128px"
                priority
              />
            </Link>
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 rounded-full border border-white bg-white py-2 pr-4 pl-2.5 font-display text-xs font-semibold tracking-wide text-black shadow-[0_8px_24px_rgba(61,22,5,0.12)] transition hover:border-umx-orange hover:bg-umx-orange hover:text-white hover:shadow-[0_12px_28px_rgba(255,91,4,0.28)]"
            >
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-full bg-umx-orange/10 text-umx-orange transition group-hover:bg-white/20 group-hover:text-white"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5"
                  aria-hidden
                >
                  <path
                    d="M12.5 4.5 7 10l5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Back to site
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-[34rem] flex-1 flex-col justify-center">
            {eyebrow ? (
              <p className="font-display text-[0.68rem] font-semibold tracking-[0.28em] text-white/70 uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h2
              className={`font-display text-[2.35rem] font-bold tracking-[-0.03em] text-white sm:text-5xl ${eyebrow ? "mt-3" : ""}`}
            >
              {title}
            </h2>
            <p className="mt-4 max-w-md font-body text-[0.98rem] leading-relaxed text-white/72">
              {description}
            </p>

            <div className="mt-9 rounded-[2rem] border border-umx-cream-deep/70 bg-umx-cream p-5 shadow-[0_36px_90px_rgba(61,22,5,0.28),0_1px_0_rgba(255,255,255,0.9)_inset] sm:p-8">
              {children}
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-[26rem] text-center font-body text-[0.7rem] tracking-wide text-white/55">
            Nicotine is an addictive chemical. For adults 21+ only.
          </p>
        </div>
      </section>
    </main>
  );
}
