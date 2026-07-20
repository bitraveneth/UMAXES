export default function Support() {
  return (
    <section id="support" className="bg-umx-cream-warm px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-[1120px]">
        <p className="font-display text-xs font-semibold tracking-[0.12em] text-black uppercase">
          Support
        </p>
        <h2 className="mt-2 max-w-lg font-display text-3xl font-bold tracking-tight text-black sm:text-4xl">
          We’re here to help
        </h2>
        <p className="mt-3 max-w-xl font-body text-lg text-black/75">
          Shipping, returns, and product questions — clear answers for adult
          customers.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="mailto:support@umaxes.com"
            className="rounded-full border border-black bg-black px-6 py-3 font-display text-sm font-semibold text-umx-cream transition hover:border-umx-orange hover:bg-umx-orange hover:text-umx-cream"
          >
            Email support
          </a>
          <a
            href="#products"
            className="rounded-full border border-black px-6 py-3 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange"
          >
            View product
          </a>
        </div>
      </div>
    </section>
  );
}
