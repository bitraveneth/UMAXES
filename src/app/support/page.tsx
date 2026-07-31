import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import StoreTopPad from "@/components/StoreTopPad";
import {
  BadgeCheck,
  CircleHelp,
  Headphones,
  Mail,
} from "lucide-react";

export const metadata = {
  title: "Support · UMAXES",
  description: "Support, product verification, contact, and FAQ for UMAXES.",
};

const cards = [
  {
    href: "/support/verify",
    title: "Product verification",
    body: "Confirm your HOOKAMAX device is authentic with the code on the pack.",
    icon: BadgeCheck,
  },
  {
    href: "/contact",
    title: "Contact us",
    body: "Shipping, orders, or product questions — send us a message.",
    icon: Mail,
  },
  {
    href: "/faq",
    title: "FAQ",
    body: "Quick answers on age, specs, shipping, returns, and authenticity.",
    icon: CircleHelp,
  },
  {
    href: "mailto:support@umaxes.com",
    title: "Email support",
    body: "Prefer email? Reach the team at support@umaxes.com.",
    icon: Headphones,
  },
] as const;

export default function SupportPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-umx-cream">
        <StoreTopPad className="px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-[1000px]">
            <header className="max-w-2xl">
              <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
                Support
              </p>
              <h1 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[0.98] tracking-[-0.035em] text-black">
                We’re here
                <span className="text-umx-orange"> to help.</span>
              </h1>
              <p className="mt-4 font-body text-base leading-relaxed text-black/65 sm:text-lg">
                Verify your product, browse FAQs, or contact the UMAXES team —
                for adult customers 21+.
              </p>
            </header>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
              {cards.map((card) => {
                const Icon = card.icon;
                const isMail = card.href.startsWith("mailto:");
                const className =
                  "group flex flex-col rounded-[1.5rem] bg-white p-6 shadow-[0_12px_36px_rgba(61,22,5,0.08)] ring-1 ring-black/6 transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_22px_50px_rgba(61,22,5,0.12)] hover:ring-umx-orange/30 sm:p-7";

                const inner = (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-umx-orange/10 text-umx-orange transition duration-500 group-hover:bg-umx-orange group-hover:text-white">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </div>
                    <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-black">
                      {card.title}
                    </h2>
                    <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-black/60">
                      {card.body}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 font-display text-sm font-semibold text-umx-orange transition group-hover:gap-3">
                      {isMail ? "Email now" : "Open"}
                      <span aria-hidden>→</span>
                    </span>
                  </>
                );

                return isMail ? (
                  <a key={card.href} href={card.href} className={className}>
                    {inner}
                  </a>
                ) : (
                  <Link key={card.href} href={card.href} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </StoreTopPad>
      </main>
      <Footer />
    </>
  );
}
