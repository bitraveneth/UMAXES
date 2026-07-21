"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { getFlavor, product } from "@/lib/assets";

export default function CartDrawer() {
  const { items, quantity, open, setOpen, setQuantity, remove, total } =
    useCart();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[70] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-umx-orange-ink/45 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-umx-cream shadow-[-12px_0_40px_rgba(61,22,5,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 sm:px-6">
          <h2 className="font-display text-lg font-semibold tracking-tight text-black">
            Your cart
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            className="flex h-10 w-10 items-center justify-center rounded-full text-black ring-1 ring-black/15 transition hover:text-umx-orange hover:ring-umx-orange"
            onClick={() => setOpen(false)}
          >
            <span className="font-display text-xl leading-none">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {quantity === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-display text-base font-semibold text-black">
                Cart is empty
              </p>
              <p className="mt-2 max-w-xs font-body text-sm text-black/65">
                Pick a flavor and add it to your cart.
              </p>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="mt-6 rounded-full bg-umx-orange px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-umx-orange-deep"
              >
                Shop UMAXES
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((line) => {
                const flavor = getFlavor(line.flavorId);
                if (!flavor) return null;
                return (
                  <li
                    key={line.flavorId}
                    className="flex gap-4 rounded-2xl border border-black/10 bg-umx-cream-bright p-4"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={flavor.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                      <div className="absolute inset-0 bg-black/15" />
                      <div className="absolute inset-2">
                        <Image
                          src={product.deviceImage}
                          alt={flavor.name}
                          fill
                          className="object-contain drop-shadow-md"
                          sizes="80px"
                        />
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="font-display text-base font-semibold text-black">
                        {flavor.name}
                      </p>
                      <p className="mt-0.5 font-display text-sm text-black/60">
                        ${flavor.price}.00 each
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                        <div className="inline-flex items-center rounded-full border border-black/15">
                          <button
                            type="button"
                            aria-label={`Decrease ${flavor.name}`}
                            className="flex h-9 w-9 items-center justify-center font-display text-lg text-black transition hover:text-umx-orange"
                            onClick={() =>
                              setQuantity(line.flavorId, line.quantity - 1)
                            }
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center font-display text-sm font-semibold text-black">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${flavor.name}`}
                            className="flex h-9 w-9 items-center justify-center font-display text-lg text-black transition hover:text-umx-orange"
                            onClick={() =>
                              setQuantity(line.flavorId, line.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
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
          )}
        </div>

        {quantity > 0 && (
          <div className="border-t border-black/10 px-5 py-5 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm text-black/60">Subtotal</span>
              <span className="font-display text-lg font-semibold text-black">
                ${total}.00
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="block w-full rounded-full bg-umx-orange py-3.5 text-center font-display text-sm font-semibold text-white transition hover:bg-umx-orange-deep"
            >
              Checkout
            </Link>
            <p className="mt-3 text-center font-display text-[0.65rem] tracking-wide text-black/45 uppercase">
              Adults 21+ only · Nicotine is addictive
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
