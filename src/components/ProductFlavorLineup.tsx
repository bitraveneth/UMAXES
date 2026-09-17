import Image from "next/image";
import Link from "next/link";
import { flavors, type Flavor } from "@/lib/assets";

export default function ProductFlavorLineup({ flavor }: { flavor: Flavor }) {
  return (
    <section
      id="flavor-options"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
      aria-label="HOOKAMAX flavor options"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-umx-cream-deep/45 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1200px]">
        <header className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
            Flavor options
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            HOOKA
            <span className="text-umx-orange">MAX</span> flavors
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-body text-base leading-relaxed text-black/65 sm:text-lg">
            Same device. Pick the taste that fits your mood.
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:mt-16 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {flavors.map((item) => {
            const current = item.id === flavor.id;
            return (
              <li key={item.id}>
                <Link
                  href={`/product/${item.id}`}
                  scroll={false}
                  aria-current={current ? "page" : undefined}
                  className={`group flex h-full flex-col overflow-hidden rounded-[1.25rem] border bg-umx-cream-warm shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:border-black/16 hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)] ${
                    current
                      ? "border-black/25 ring-1 ring-black/20"
                      : "border-black/8"
                  }`}
                >
                  <div
                    className="relative aspect-square overflow-hidden"
                    style={{ backgroundColor: `${item.accent}22` }}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-3.5 py-3 sm:px-4 sm:py-3.5">
                    <p className="font-display text-[0.62rem] font-semibold tracking-[0.16em] text-black/40 uppercase">
                      {current ? "Viewing" : "HOOKAMAX"}
                    </p>
                    <p className="mt-1 font-display text-sm font-bold tracking-tight text-black sm:text-[0.95rem]">
                      {item.name}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
