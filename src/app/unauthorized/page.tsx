import Image from "next/image";
import { logos } from "@/lib/assets";

export const metadata = {
  title: "Access unavailable · UMAXES",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[#111111] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,91,4,0.22),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.7) 0.6px, transparent 0.6px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="relative mb-8 h-9 w-44">
          <Image
            src={logos.orangeTransparent}
            alt="UMAXES"
            fill
            className="object-contain brightness-0 invert"
            sizes="176px"
            priority
          />
        </div>

        <p className="font-display text-[0.7rem] font-semibold tracking-[0.28em] text-umx-orange uppercase">
          Access restricted
        </p>

        <h1 className="mt-4 max-w-xl font-display text-[1.85rem] font-bold leading-tight tracking-[-0.03em] sm:text-[2.35rem]">
          You are not authorized to view this website
        </h1>

        <p className="mx-auto mt-5 max-w-md font-body text-[0.95rem] leading-relaxed text-white/60">
          This UMAXES experience is not available in your region. If you reached
          this page by mistake, please try again from an authorized location.
        </p>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-sm">
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-white/45 uppercase">
            Need help?
          </p>
          <a
            href="mailto:info@umaxesvape.com"
            className="mt-2 inline-block font-display text-sm font-semibold text-umx-orange transition hover:text-white"
          >
            info@umaxesvape.com
          </a>
        </div>
      </div>

      <footer className="relative z-[1] border-t border-white/10 px-6 py-4 text-center">
        <p className="font-body text-[0.7rem] text-white/35">
          Adults 21+ only · Nicotine is an addictive chemical
        </p>
      </footer>
    </main>
  );
}
