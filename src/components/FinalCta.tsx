import Link from "next/link";

export default function FinalCta() {
  return (
    <section className="bg-black px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto flex max-w-[1120px] flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-umx-cream sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="mt-2 max-w-md font-body text-lg text-umx-cream/90">
            Adults 21+. One device. Browse the UMAXES Shop and check out when ready.
          </p>
        </div>
        <Link
          href="/shop"
          className="rounded border border-umx-cream px-7 py-3.5 font-display text-sm font-semibold text-umx-cream transition hover:border-umx-orange hover:bg-umx-orange hover:text-umx-cream"
        >
          Shop UMAXES One
        </Link>
      </div>
    </section>
  );
}
