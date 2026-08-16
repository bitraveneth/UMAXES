"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { StorePrice } from "@/components/StorePrice";
import { useCart } from "@/context/CartContext";
import { getFlavor, product, type FlavorId } from "@/lib/assets";

type Fav = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  image: string | null;
};

export default function FavoritesManager() {
  const { add } = useCart();
  const [favorites, setFavorites] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/account/favorites");
    const data = await res.json();
    if (res.ok) setFavorites(data.favorites || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(productId: string, sku: string) {
    setBusyId(productId);
    setFavorites((prev) => prev.filter((f) => f.productId !== productId));
    try {
      await fetch("/api/account/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, sku }),
      });
    } catch {
      await load();
    } finally {
      setBusyId(null);
    }
  }

  function addToCart(sku: string) {
    add(sku as FlavorId, 1);
    setAddedId(sku);
    window.setTimeout(() => setAddedId(null), 1200);
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden border border-black/10 bg-white"
          >
            <div className="aspect-[4/5] bg-umx-cream" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-2/3 rounded bg-black/8" />
              <div className="h-3 w-1/3 rounded bg-black/6" />
              <div className="h-10 w-full rounded bg-black/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="border border-dashed border-black/15 bg-white px-6 py-16 text-center sm:px-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center bg-umx-orange-wash text-umx-orange">
          <Heart className="h-5 w-5" strokeWidth={1.75} fill="currentColor" />
        </span>
        <h2 className="mt-5 font-display text-xl font-bold text-black">
          No saved flavors yet
        </h2>
        <p className="mx-auto mt-2 max-w-md font-body text-sm leading-relaxed text-black">
          Tap the heart on any product in the shop to save it here for quick
          reorders.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex items-center gap-2 bg-umx-orange px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-umx-orange-deep"
        >
          Browse shop
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {favorites.map((f) => {
        const flavor = getFlavor(f.sku as FlavorId);
        const href = `/product/${f.sku}`;
        const image = f.image || flavor?.image || null;
        const price = flavor?.price;

        return (
          <li
            key={f.id}
            className="group overflow-hidden border border-black/10 bg-white"
          >
            <div className="relative aspect-[4/5] bg-umx-cream">
              <Link href={href} className="absolute inset-0">
                {image ? (
                  <Image
                    src={image}
                    alt={f.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                ) : null}
              </Link>
              <button
                type="button"
                disabled={busyId === f.productId}
                onClick={() => remove(f.productId, f.sku)}
                aria-label={`Remove ${f.name} from wishlist`}
                className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center bg-white text-umx-orange ring-1 ring-black/10 transition hover:bg-umx-orange hover:text-white disabled:opacity-60"
              >
                <Heart className="h-4 w-4" strokeWidth={2} fill="currentColor" />
              </button>
            </div>

            <div className="p-5">
              <p className="font-body text-xs tracking-wide text-black uppercase">
                {product.name}
              </p>
              <Link href={href}>
                <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-black transition hover:text-umx-orange">
                  {f.name}
                </h2>
              </Link>
              {price != null ? (
                <p className="mt-2 font-display text-xl font-bold text-umx-orange">
                  <StorePrice amount={price} />
                </p>
              ) : (
                <p className="mt-2 font-body text-sm text-black">{f.sku}</p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => addToCart(f.sku)}
                  className="inline-flex flex-1 items-center justify-center gap-2 bg-black px-4 py-3 font-display text-sm font-semibold text-white transition hover:bg-umx-orange"
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={2} />
                  {addedId === f.sku ? "Added" : "Add to cart"}
                </button>
                <button
                  type="button"
                  disabled={busyId === f.productId}
                  onClick={() => remove(f.productId, f.sku)}
                  aria-label="Remove from wishlist"
                  className="flex h-12 w-12 shrink-0 items-center justify-center border border-black/12 text-black transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.85} />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
