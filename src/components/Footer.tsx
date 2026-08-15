import Image from "next/image";
import Link from "next/link";
import FooterSubscribe from "@/components/FooterSubscribe";
import { logos } from "@/lib/assets";

const shopLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/#news", label: "News" },
  { href: "/#features", label: "Why UMAXES" },
] as const;

const supportLinks = [
  { href: "/support", label: "Support" },
  { href: "/faq", label: "FAQ" },
  { href: "/support/verify", label: "Verify" },
  { href: "/contact", label: "Contact" },
] as const;

function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const className =
    "font-display text-sm text-white/80 transition hover:text-white";

  if (href.startsWith("/#")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <div className="footer-hang-wrap">
      <footer className="relative bg-umx-orange text-white">
        <div className="relative mx-auto max-w-[1200px] px-5 pt-16 pb-10 sm:px-8 sm:pt-20 sm:pb-12 lg:pt-24 lg:pb-14">
          <div className="grid gap-12 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-14 lg:grid-cols-[1.2fr_0.9fr_1.15fr] lg:gap-x-16">
            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-block">
                <div className="relative h-9 w-40 sm:h-10 sm:w-48">
                  <Image
                    src={logos.creamTransparent}
                    alt="UMAXES"
                    fill
                    className="object-contain object-left"
                    sizes="192px"
                  />
                </div>
              </Link>
              <p className="mt-5 max-w-[22rem] font-body text-[0.95rem] leading-relaxed text-white/88">
                Adult vape brand behind HOOKAMAX — bold flavor, clean design,
                and a ritual built for 21+.
              </p>
              <div className="mt-6 max-w-[22rem] border-t border-white/15 pt-5">
                <p className="font-display text-sm font-semibold tracking-[0.08em] text-white">
                  © {year} UMAXES
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:gap-10">
              <div className="min-w-0">
                <p className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-white/50 uppercase">
                  Shop
                </p>
                <ul className="mt-4 space-y-2.5">
                  {shopLinks.map((item) => (
                    <li key={item.href}>
                      <FooterLink href={item.href} label={item.label} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0">
                <p className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-white/50 uppercase">
                  Help
                </p>
                <ul className="mt-4 space-y-2.5">
                  {supportLinks.map((item) => (
                    <li key={item.href}>
                      <FooterLink href={item.href} label={item.label} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <FooterSubscribe />
            </div>
          </div>
        </div>

        <div className="border-t border-black/15 bg-black px-5 py-5 sm:px-8">
          <p className="mx-auto max-w-[1200px] font-body text-[0.7rem] leading-relaxed text-white/70 sm:text-xs">
            <span className="font-display font-semibold tracking-wide text-umx-orange">
              WARNING:{" "}
            </span>
            This product contains chemicals, including nicotine, which is known
            to the State of California to cause cancer and reproductive harm.
            For more information, visit{" "}
            <a
              href="https://www.p65warnings.ca.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-white/30 underline-offset-2 transition hover:text-white hover:decoration-white"
            >
              p65warnings.ca.gov
            </a>
            . This product is not intended for sale or use by individuals under
            21 years of age. Nicotine is an addictive chemical.
          </p>
        </div>
      </footer>
    </div>
  );
}
