import Image from "next/image";
import Link from "next/link";
import { logos } from "@/lib/assets";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

const helpLinks = [
  { href: "/support", label: "Support" },
  { href: "/faq", label: "FAQ" },
  { href: "/support/verify", label: "Verify" },
  { href: "/contact", label: "Contact" },
] as const;

export default function AuthFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-[2] shrink-0 bg-[#1b4f72] text-white">
      <div className="mx-auto flex max-w-[72rem] flex-col gap-6 px-5 py-7 sm:flex-row sm:items-start sm:justify-between sm:gap-10 sm:px-8 sm:py-8">
        <div className="min-w-0">
          <div className="relative h-8 w-36 sm:h-9 sm:w-40">
            <Image
              src={logos.blueWordmarkOnDark}
              alt="UMAXES"
              fill
              className="object-contain object-left"
              sizes="160px"
            />
          </div>
          <a
            href={`mailto:${SITE_CONTACT_EMAIL}`}
            className="mt-3 inline-block font-display text-sm font-semibold text-white/90 transition hover:text-white"
          >
            {SITE_CONTACT_EMAIL}
          </a>
          <p className="mt-3 font-display text-xs font-semibold tracking-[0.08em] text-white/70">
            © {year} UMAXES
          </p>
        </div>

        <nav aria-label="Help">
          <p className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-white/50 uppercase">
            Help
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {helpLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-display text-sm text-white/85 transition hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/20 bg-[#e8eef6] px-5 py-4 sm:px-8">
        <p className="mx-auto max-w-[72rem] font-body text-[0.75rem] leading-relaxed text-black/70 sm:text-sm">
          <span className="font-display font-semibold tracking-[0.08em] text-[#1b4f72] uppercase">
            Warning:{" "}
          </span>
          This product contains chemicals, including nicotine, which is known to
          the State of California to cause cancer and reproductive harm. For
          adults 21 years of age or older only. Nicotine is an addictive
          chemical.
        </p>
      </div>
    </footer>
  );
}
