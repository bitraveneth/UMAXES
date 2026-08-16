import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import StoreTopPad from "@/components/StoreTopPad";

export function SupportShell({
  children,
  eyebrow,
  title,
  titleAccent,
  description,
  wide = false,
  align = "left",
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description: string;
  wide?: boolean;
  align?: "left" | "center";
}) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-umx-cream">
        <StoreTopPad className="px-4 pb-20 sm:px-6 sm:pb-28">
          <div className={`mx-auto ${wide ? "max-w-[1200px]" : "max-w-[900px]"}`}>
            <Link
              href="/support"
              className="font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
            >
              ← Support
            </Link>
            <header className={`mt-8 ${align === "center" ? "text-center" : ""}`}>
              <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em] text-black">
                {title}
                {titleAccent ? (
                  <span className="text-umx-orange">{titleAccent}</span>
                ) : null}
              </h1>
              <p
                className={`mt-4 font-body text-base leading-relaxed text-black/65 sm:text-lg ${
                  align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"
                }`}
              >
                {description}
              </p>
            </header>
            <div className="mt-12">{children}</div>
          </div>
        </StoreTopPad>
      </main>
      <Footer />
    </>
  );
}
