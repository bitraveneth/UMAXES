import Image from "next/image";
import Link from "next/link";
import FooterSubscribe from "@/components/FooterSubscribe";
import { logos } from "@/lib/assets";

const menu = [
  { href: "/#products", label: "Products" },
  { href: "/#news", label: "News & Events" },
  { href: "/#features", label: "Why UMAXES" },
  { href: "/support", label: "Support" },
  { href: "/faq", label: "FAQ" },
  { href: "/support/verify", label: "Product verify" },
  { href: "/contact", label: "Contact us" },
] as const;

export default function Footer() {
  return (
    <div className="footer-hang-wrap">
      <footer className="relative bg-umx-orange text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-[1200px] px-4 pt-20 sm:px-6 sm:pt-28">
          <div className="grid grid-cols-3 items-start gap-3 sm:gap-8 lg:gap-14">
            <div className="min-w-0">
              <Link href="/" className="inline-block">
                <div className="relative h-8 w-36 sm:h-10 sm:w-48 lg:h-11 lg:w-56">
                  <Image
                    src={logos.orangeTransparent}
                    alt="UMAXES"
                    fill
                    className="object-contain object-left brightness-0 invert"
                    sizes="224px"
                    priority
                  />
                </div>
              </Link>
              <p className="mt-3 max-w-[16rem] font-body text-[0.7rem] leading-relaxed text-white/80 sm:mt-4 sm:text-sm lg:text-base">
                Adult vape brand behind HOOKAMAX — bold flavor, clean design,
                and a ritual built for 21+.
              </p>
            </div>

            <div className="min-w-0">
              <ul className="flex flex-col gap-1 font-display text-[0.7rem] sm:gap-1.5 sm:text-sm lg:text-[0.95rem]">
                {menu.map((item) => {
                  const className =
                    "footer-menu-link group relative inline-flex items-center gap-2 py-1 text-white/80 transition duration-300 hover:text-white";
                  const inner = (
                    <>
                      <span
                        aria-hidden
                        className="h-px w-0 bg-white transition-all duration-300 group-hover:w-3"
                      />
                      <span className="transition duration-300 group-hover:translate-x-0.5">
                        {item.label}
                      </span>
                    </>
                  );
                  return (
                    <li key={item.href}>
                      {item.href.startsWith("/#") ? (
                        <a href={item.href} className={className}>
                          {inner}
                        </a>
                      ) : (
                        <Link href={item.href} className={className}>
                          {inner}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="min-w-0">
              <FooterSubscribe />
            </div>
          </div>

          <div className="mt-10 border-t border-white/20 pt-4 pb-5 text-center sm:mt-12 sm:pt-5 sm:pb-6">
            <p className="font-display text-[0.65rem] tracking-wide text-white/70 sm:text-[0.7rem]">
              © {new Date().getFullYear()} UMAXES. All rights reserved.
            </p>
          </div>
        </div>

        {/* 80% on orange · 20% always hangs below · page ends there */}
        <div className="footer-brand-band" aria-hidden>
          <svg
            className="footer-hollow-brand"
            viewBox="0 0 1000 78"
            preserveAspectRatio="none"
            role="presentation"
          >
            <text
              x="0"
              y="62"
              textLength="1000"
              lengthAdjust="spacingAndGlyphs"
              className="footer-hollow-brand__text"
            >
              UMAXES
            </text>
          </svg>
        </div>
      </footer>
    </div>
  );
}
