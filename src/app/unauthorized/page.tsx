import Link from "next/link";

export const metadata = {
  title: "Access denied · UMAXES",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-umx-cream px-6">
      <div className="max-w-lg text-center">
        <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
          UMAXES
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          You are not authorized to access this website
        </h1>
        <p className="mt-4 font-body text-black/65">
          This site is not available in your region.
        </p>
        <p className="mt-8 font-body text-sm text-black/45">
          If you believe this is an error, contact support.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex border border-black px-5 py-3 font-display text-sm font-semibold transition hover:border-umx-orange hover:text-umx-orange"
        >
          Back
        </Link>
      </div>
    </main>
  );
}
