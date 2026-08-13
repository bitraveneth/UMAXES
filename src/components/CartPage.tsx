"use client";

import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { QtyStepper } from "@/components/QtyStepper";
import { useCart } from "@/context/CartContext";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";
import { getFlavor, product } from "@/lib/assets";

export default function CartPage() {
  const { items, quantity, setQuantity, remove, total } = useCart();
  const compactChrome = useCompactMobileStoreChrome();

  return (
    <>
      <Header />
      <main
        className={`flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-16 lg:pb-12 ${storeTopPadClass(compactChrome)}`}
      >
        <div className="mx-auto max-w-3xl">
          <header className="mb-8 sm:mb-10">
            <p className="font-display text-xs font-semibold tracking-[0.18em] text-umx-orange uppercase">
              Your bag
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Cart
            </h1>
            <p className="mt-2 font-body text-black/65">
              {quantity === 0
                ? "No items yet — browse the collection and add flavors."
                : `${quantity} item${quantity === 1 ? "" : "s"} ready when you are.`}
            </p>
          </header>

          {quantity === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold text-black">
                Cart is empty
              </p>
              <p className="mx-auto mt-2 max-w-sm font-body text-sm text-black/60">
                Pick a HOOKAMAX flavor and add it to your cart.
              </p>
              <Link
                href="/shop"
                className="mt-8 inline-flex rounded-full bg-umx-orange px-7 py-3.5 font-display text-sm font-semibold !text-white transition hover:bg-umx-orange-deep"
              >
                Shop UMAXES
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <ul className="space-y-3">
                {items.map((line) => {
                  const flavor = getFlavor(line.flavorId);
                  if (!flavor) return null;
                  return (
                    <li
                      key={line.flavorId}
                      className="flex gap-4 rounded-2xl border border-black/10 bg-white p-4 sm:p-5"
                    >
                      <Link
                        href={`/product/${flavor.id}`}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28"
                      >
                        <Image
                          src={flavor.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                        <div className="absolute inset-0 bg-black/15" />
                        <div className="absolute inset-2">
                          <Image
                            src={product.deviceImage}
                            alt={flavor.name}
                            fill
                            className="object-contain drop-shadow-md"
                            sizes="96px"
                          />
                        </div>
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/product/${flavor.id}`}
                              className="font-display text-base font-semibold text-black transition hover:text-umx-orange sm:text-lg"
                            >
                              {flavor.name}
                            </Link>
                            <p className="mt-0.5 font-display text-sm text-black/55">
                              ${flavor.price}.00 each
                            </p>
                          </div>
                          <p className="shrink-0 font-display text-base font-bold text-black">
                            ${(flavor.price * line.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                          <QtyStepper
                            value={line.quantity}
                            ariaLabel={flavor.name}
                            allowRemove
                            onChange={(qty) =>
                              setQuantity(line.flavorId, qty)
                            }
                          />
                          <button
                            type="button"
                            className="font-display text-xs font-semibold tracking-wide text-black/45 uppercase transition hover:text-umx-orange"
                            onClick={() => remove(line.flavorId)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-display text-sm text-black/60">
                    Subtotal
                  </span>
                  <span className="font-display text-2xl font-bold text-black">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <p className="mt-2 font-body text-sm text-black/50">
                  Shipping calculated at checkout.
                </p>
                <Link
                  href="/checkout"
                  className="mt-5 block w-full rounded-full bg-umx-orange py-3.5 text-center font-display text-sm font-semibold !text-white transition hover:bg-umx-orange-deep sm:text-base"
                >
                  Checkout
                </Link>
                <Link
                  href="/shop"
                  className="mt-3 block w-full py-2.5 text-center font-display text-sm font-semibold text-black/60 transition hover:text-umx-orange"
                >
                  Continue shopping
                </Link>
                <p className="mt-4 text-center font-display text-[0.65rem] tracking-wide text-black/40 uppercase">
                  Adults 21+ only · Nicotine is addictive
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
