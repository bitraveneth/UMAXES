"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpDown,
  BadgeCheck,
  ChevronRight,
  CircleHelp,
  Droplets,
  Eye,
  Flame,
  Grid2x2,
  Heart,
  LayoutList,
  Package,
  Search,
  ShoppingBag,
  Snowflake,
  SlidersHorizontal,
  Sparkles,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import {
  storeTopPadClass,
  useCompactMobileStoreChrome,
} from "@/hooks/useStoreChrome";
import { useSession } from "next-auth/react";
import {
  flavorProfiles,
  flavors,
  product,
  type Flavor,
  type FlavorProfile,
} from "@/lib/assets";

const FAVORITES_KEY = "umaxes-shop-favorites";

const priceRanges = [
  { id: "all", label: "Any price", min: 0, max: Infinity },
  { id: "under-30", label: "Under $30", min: 0, max: 29.99 },
  { id: "30-32", label: "$30 – $32", min: 30, max: 32 },
  { id: "over-32", label: "$33 & up", min: 33, max: Infinity },
] as const;

type PriceRangeId = (typeof priceRanges)[number]["id"];
type SortId =
  | "featured"
  | "popular"
  | "name-asc"
  | "price-asc"
  | "price-desc";
type FinishFilter = "all" | "iced" | "smooth";
type ViewMode = "grid" | "list";

const sortOptions: { id: SortId; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "popular", label: "Best selling" },
  { id: "name-asc", label: "Name A–Z" },
  { id: "price-asc", label: "Price: Low to high" },
  { id: "price-desc", label: "Price: High to low" },
];

const profileIcons: Record<FlavorProfile, typeof Flame> = {
  Tropical: Flame,
  Ice: Snowflake,
  Berry: Droplets,
  Mint: Sparkles,
  Candy: Tag,
};

/** Deterministic demo social proof until real analytics exist */
function flavorStats(id: string) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const n = hash >>> 0;
  return {
    views: 1800 + (n % 6400),
    sold: 96 + (n % 520),
  };
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function isIced(flavor: Flavor) {
  return flavor.profile === "Ice" || /ice/i.test(flavor.name);
}

function StatsRow({ flavorId, className = "" }: { flavorId: string; className?: string }) {
  const stats = flavorStats(flavorId);
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 font-display text-xs font-semibold tracking-wide text-black/45 ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5 text-umx-orange" strokeWidth={2.1} aria-hidden />
        {formatCount(stats.views)} views
      </span>
      <span className="inline-flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-umx-orange" strokeWidth={2.1} aria-hidden />
        {formatCount(stats.sold)} sold
      </span>
    </div>
  );
}

function ShopCard({
  flavor,
  view,
  favorited,
  onToggleFavorite,
}: {
  flavor: Flavor;
  view: ViewMode;
  favorited: boolean;
  onToggleFavorite: () => void;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const ProfileIcon = profileIcons[flavor.profile];

  function handleAdd() {
    add(flavor.id);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1000);
  }

  if (view === "list") {
    return (
      <article className="group grid grid-cols-[140px_minmax(0,1fr)] gap-5 border-b border-black/8 py-6 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:gap-8">
        <Link
          href={`/product/${flavor.id}`}
          className="relative aspect-[4/5] overflow-hidden bg-umx-cream ring-1 ring-black/6 sm:aspect-square"
        >
          <Image
            src={flavor.image}
            alt={flavor.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="220px"
          />
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-umx-cream px-2 py-1 font-display text-[0.65rem] font-bold tracking-[0.12em] text-black/60 uppercase">
              <ProfileIcon className="h-3 w-3 text-umx-orange" strokeWidth={2.2} aria-hidden />
              {flavor.profile}
            </span>
            {isIced(flavor) && (
              <span className="inline-flex items-center gap-1 font-display text-[0.65rem] font-semibold tracking-wide text-sky-700 uppercase">
                <Snowflake className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                Iced
              </span>
            )}
          </div>
          <Link href={`/product/${flavor.id}`}>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-black transition hover:text-umx-orange">
              {flavor.name}
            </h2>
          </Link>
          <p className="mt-1 font-body text-sm text-black/50">{product.name}</p>
          <StatsRow flavorId={flavor.id} className="mt-3" />
          <p className="mt-3 line-clamp-2 max-w-xl font-body text-sm leading-relaxed text-black/55 sm:text-base">
            {flavor.description}
          </p>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center">
          <p className="font-display text-3xl font-bold text-black">${flavor.price}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-label={favorited ? "Remove from favorites" : "Save flavor"}
              className={`flex h-12 w-12 items-center justify-center border transition ${
                favorited
                  ? "border-umx-orange bg-umx-orange text-white"
                  : "border-black/15 text-black hover:border-umx-orange hover:text-umx-orange"
              }`}
            >
              <Heart
                className="h-4 w-4"
                strokeWidth={2.1}
                fill={favorited ? "currentColor" : "none"}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className={`px-5 py-3 font-display text-sm font-semibold transition ${
                added
                  ? "bg-umx-orange text-white"
                  : "bg-black text-umx-cream hover:bg-umx-orange"
              }`}
            >
              {added ? "Added" : "Add"}
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-umx-cream ring-1 ring-black/6">
        <Link href={`/product/${flavor.id}`} className="absolute inset-0 block">
          <Image
            src={flavor.image}
            alt={flavor.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 380px"
            quality={70}
          />
        </Link>

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 bg-white/95 px-2.5 py-1.5 font-display text-[0.65rem] font-bold tracking-[0.12em] text-black uppercase">
            <ProfileIcon className="h-3.5 w-3.5 text-umx-orange" strokeWidth={2.2} aria-hidden />
            {flavor.profile}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={favorited ? "Remove from favorites" : "Save flavor"}
            className={`flex h-11 w-11 items-center justify-center backdrop-blur-sm transition ${
              favorited
                ? "bg-umx-orange text-white"
                : "bg-white/90 text-black hover:bg-umx-orange hover:text-white"
            }`}
          >
            <Heart
              className="h-4 w-4"
              strokeWidth={2.1}
              fill={favorited ? "currentColor" : "none"}
              aria-hidden
            />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent px-4 pt-12 pb-3">
          <StatsRow flavorId={flavor.id} className="text-white/90 [&_svg]:text-umx-orange" />
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link href={`/product/${flavor.id}`}>
              <h2 className="line-clamp-2 min-h-[2.6em] font-display text-xl leading-[1.3] font-bold tracking-tight text-black transition hover:text-umx-orange sm:text-2xl">
                {flavor.name}
              </h2>
            </Link>
            <p className="mt-1.5 flex items-center gap-1.5 font-body text-sm text-black/50">
              <Package className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              {product.name}
            </p>
          </div>
          <p className="shrink-0 pt-0.5 font-display text-2xl font-bold text-black">
            ${flavor.price}
          </p>
        </div>

        <p className="mt-3 line-clamp-2 min-h-[2.75em] font-body text-sm leading-relaxed text-black/55 sm:text-base">
          {flavor.description}
        </p>

        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-6">
          <button
            type="button"
            onClick={handleAdd}
            className={`inline-flex items-center justify-center gap-2 py-3.5 font-display text-sm font-semibold tracking-wide transition duration-300 sm:text-base ${
              added
                ? "bg-umx-orange text-white"
                : "bg-black text-umx-cream hover:bg-umx-orange hover:text-white"
            }`}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2.1} aria-hidden />
            {added ? "Added" : "Add to cart"}
          </button>
          <Link
            href={`/product/${flavor.id}`}
            aria-label={`View ${flavor.name}`}
            className="flex h-full w-14 items-center justify-center border border-black/15 text-black transition hover:border-umx-orange hover:text-umx-orange"
          >
            <LayoutList className="h-4 w-4" strokeWidth={2.1} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

function FilterPanel({
  query,
  setQuery,
  profiles,
  setProfiles,
  priceRange,
  setPriceRange,
  finish,
  setFinish,
  favoritesOnly,
  setFavoritesOnly,
  onClear,
  showSearch = true,
}: {
  query: string;
  setQuery: (value: string) => void;
  profiles: FlavorProfile[];
  setProfiles: (next: FlavorProfile[]) => void;
  priceRange: PriceRangeId;
  setPriceRange: (id: PriceRangeId) => void;
  finish: FinishFilter;
  setFinish: (value: FinishFilter) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (value: boolean) => void;
  onClear: () => void;
  showSearch?: boolean;
}) {
  function toggleProfile(profile: FlavorProfile) {
    if (profiles.includes(profile)) {
      setProfiles(profiles.filter((p) => p !== profile));
    } else {
      setProfiles([...profiles, profile]);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold tracking-[0.14em] text-black uppercase">
          <SlidersHorizontal className="h-4 w-4 text-umx-orange" strokeWidth={2.2} aria-hidden />
          Filters
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="font-display text-xs font-semibold tracking-wide text-umx-orange transition hover:text-umx-orange-deep"
        >
          Clear all
        </button>
      </div>

      {showSearch ? (
      <label className="block">
        <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-black">
          <Search className="h-4 w-4 text-umx-orange" strokeWidth={2.2} aria-hidden />
          Search
        </span>
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-black/35"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Flavor name…"
            className="w-full border border-black/12 bg-white py-2.5 pr-3 pl-10 font-body text-sm text-black outline-none transition placeholder:text-black/35 focus:border-umx-orange"
          />
        </div>
      </label>
      ) : null}

      <fieldset>
        <legend className="inline-flex items-center gap-2 font-display text-sm font-bold text-black">
          <Sparkles className="h-4 w-4 text-umx-orange" strokeWidth={2.2} aria-hidden />
          Flavor profile
        </legend>
        <div className="mt-4 space-y-1">
          {flavorProfiles.map((profile) => {
            const checked = profiles.includes(profile);
            const count = flavors.filter((f) => f.profile === profile).length;
            const Icon = profileIcons[profile];
            return (
              <label
                key={profile}
                className={`flex cursor-pointer items-center justify-between gap-3 px-2 py-2 transition ${
                  checked ? "bg-umx-orange/10" : "hover:bg-black/[0.03]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProfile(profile)}
                    className="h-4 w-4 accent-umx-orange"
                  />
                  <Icon className="h-4 w-4 text-umx-orange" strokeWidth={2} aria-hidden />
                  <span className="font-display text-sm font-medium text-black">
                    {profile}
                  </span>
                </span>
                <span className="font-display text-xs text-black/35">{count}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="inline-flex items-center gap-2 font-display text-sm font-bold text-black">
          <Snowflake className="h-4 w-4 text-umx-orange" strokeWidth={2.2} aria-hidden />
          Finish
        </legend>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {(
            [
              { id: "all", label: "All finishes", icon: Package },
              { id: "iced", label: "Iced only", icon: Snowflake },
              { id: "smooth", label: "Smooth / no ice", icon: Droplets },
            ] as const
          ).map((option) => {
            const Icon = option.icon;
            const active = finish === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFinish(option.id)}
                className={`inline-flex items-center gap-2.5 px-3 py-2.5 text-left font-display text-sm font-semibold transition ${
                  active
                    ? "bg-black text-umx-cream"
                    : "bg-white text-black ring-1 ring-black/10 hover:ring-umx-orange/40"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="inline-flex items-center gap-2 font-display text-sm font-bold text-black">
          <Tag className="h-4 w-4 text-umx-orange" strokeWidth={2.2} aria-hidden />
          Price
        </legend>
        <div className="mt-4 space-y-2.5">
          {priceRanges.map((range) => (
            <label
              key={range.id}
              className="flex cursor-pointer items-center gap-3 py-1"
            >
              <input
                type="radio"
                name="price-range"
                checked={priceRange === range.id}
                onChange={() => setPriceRange(range.id)}
                className="h-4 w-4 accent-umx-orange"
              />
              <span className="font-display text-sm font-medium text-black">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label
        className={`flex cursor-pointer items-center gap-3 px-3 py-3 ring-1 transition ${
          favoritesOnly
            ? "bg-umx-orange/10 ring-umx-orange/30"
            : "bg-white ring-black/10"
        }`}
      >
        <input
          type="checkbox"
          checked={favoritesOnly}
          onChange={(e) => setFavoritesOnly(e.target.checked)}
          className="h-4 w-4 accent-umx-orange"
        />
        <Heart
          className="h-4 w-4 text-umx-orange"
          strokeWidth={2.1}
          fill={favoritesOnly ? "currentColor" : "none"}
          aria-hidden
        />
        <span className="font-display text-sm font-semibold text-black">
          Saved flavors only
        </span>
      </label>
    </div>
  );
}

function ShopAside({
  quantity,
  total,
  onOpenCart,
  favoritesCount,
}: {
  quantity: number;
  total: number;
  onOpenCart: () => void;
  favoritesCount: number;
}) {
  return (
    <aside className="hidden space-y-4 xl:block">
      <div className="sticky top-28 space-y-4">
        <div className="overflow-hidden border border-black/8 bg-white">
          <div className="bg-umx-orange px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 font-display text-sm font-bold tracking-[0.12em] uppercase">
                <ShoppingBag className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                Your bag
              </p>
              {quantity > 0 && (
                <span className="bg-white px-2 py-0.5 font-display text-xs font-bold text-umx-orange">
                  {quantity}
                </span>
              )}
            </div>
          </div>

          <div className="px-5 py-5">
            <p className="font-display text-[0.65rem] font-semibold tracking-[0.16em] text-black/40 uppercase">
              Subtotal
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-black">
              ${total.toFixed(2)}
            </p>
            <p className="mt-2 font-body text-sm text-black/55">
              {quantity === 0
                ? "Add a flavor to get started."
                : `${quantity} item${quantity === 1 ? "" : "s"} ready to checkout.`}
            </p>

            <button
              type="button"
              onClick={onOpenCart}
              className="mt-5 w-full bg-black py-3.5 font-display text-sm font-semibold text-umx-cream transition hover:bg-umx-orange hover:text-white"
            >
              {quantity > 0 ? "View cart" : "Open cart"}
            </button>
            {quantity > 0 && (
              <Link
                href="/checkout"
                className="mt-2 block w-full border border-black/15 py-3 text-center font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange"
              >
                Checkout
              </Link>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-black/8 pt-4">
              <span className="inline-flex items-center gap-1.5 font-display text-xs font-semibold text-black/45">
                <Heart className="h-3.5 w-3.5 text-umx-orange" strokeWidth={2.2} aria-hidden />
                Saved flavors
              </span>
              <span className="font-display text-sm font-bold text-black">
                {favoritesCount}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden border border-black/8 bg-white">
          <div className="border-b border-black/8 px-5 py-4">
            <p className="font-display text-sm font-bold tracking-[0.12em] text-black uppercase">
              Need help?
            </p>
            <p className="mt-1 font-body text-sm text-black/50">
              Support for adult customers 21+.
            </p>
          </div>

          <div className="divide-y divide-black/8">
            {(
              [
                {
                  href: "/support/verify",
                  title: "Verify product",
                  body: "Check authenticity",
                  icon: BadgeCheck,
                },
                {
                  href: "/faq",
                  title: "FAQ",
                  body: "Quick answers",
                  icon: CircleHelp,
                },
                {
                  href: "/contact",
                  title: "Order help",
                  body: "Shipping & support",
                  icon: Package,
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-umx-cream"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-umx-orange/10 text-umx-orange transition group-hover:bg-umx-orange group-hover:text-white">
                    <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm font-bold text-black transition group-hover:text-umx-orange">
                      {item.title}
                    </span>
                    <span className="block font-body text-xs text-black/45">
                      {item.body}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-black/25 transition group-hover:translate-x-0.5 group-hover:text-umx-orange"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function ShopCatalog() {
  const { quantity, total, setOpen } = useCart();
  const { data: session, status: authStatus } = useSession();
  const compactChrome = useCompactMobileStoreChrome();
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<FlavorProfile[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRangeId>("all");
  const [finish, setFinish] = useState<FinishFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortId>("featured");
  const [view, setView] = useState<ViewMode>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesReady, setFavoritesReady] = useState(false);

  const syncFavoritesToApi =
    authStatus === "authenticated" && session?.user?.role === "CUSTOMER";

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      if (authStatus === "loading") return;

      if (syncFavoritesToApi) {
        try {
          const res = await fetch("/api/account/favorites");
          const data = await res.json();
          if (!cancelled && res.ok && Array.isArray(data.favorites)) {
            setFavorites(
              data.favorites
                .map((f: { sku?: string }) => f.sku)
                .filter(Boolean) as string[],
            );
          }
        } catch {
          /* keep empty */
        }
        if (!cancelled) setFavoritesReady(true);
        return;
      }

      try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as string[];
          if (!cancelled && Array.isArray(parsed)) setFavorites(parsed);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setFavoritesReady(true);
    }

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, [authStatus, syncFavoritesToApi]);

  useEffect(() => {
    if (!favoritesReady || syncFavoritesToApi) return;
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites, favoritesReady, syncFavoritesToApi]);

  const activePrice = priceRanges.find((r) => r.id === priceRange) ?? priceRanges[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = flavors.filter((flavor) => {
      const profileOk =
        profiles.length === 0 || profiles.includes(flavor.profile);
      const priceOk =
        flavor.price >= activePrice.min && flavor.price <= activePrice.max;
      const finishOk =
        finish === "all" ||
        (finish === "iced" ? isIced(flavor) : !isIced(flavor));
      const favOk = !favoritesOnly || favorites.includes(flavor.id);
      const searchOk =
        !q ||
        flavor.name.toLowerCase().includes(q) ||
        flavor.tagline.toLowerCase().includes(q) ||
        flavor.description.toLowerCase().includes(q);
      return profileOk && priceOk && finishOk && favOk && searchOk;
    });

    const next = [...list];
    if (sort === "popular") {
      next.sort(
        (a, b) => flavorStats(b.id).sold - flavorStats(a.id).sold
      );
    }
    if (sort === "name-asc") next.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price-asc") next.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") next.sort((a, b) => b.price - a.price);
    return next;
  }, [query, profiles, activePrice, finish, favoritesOnly, favorites, sort]);

  const activeFilterCount =
    profiles.length +
    (priceRange === "all" ? 0 : 1) +
    (finish === "all" ? 0 : 1) +
    (favoritesOnly ? 1 : 0) +
    (query.trim() ? 1 : 0);

  function clearFilters() {
    setQuery("");
    setProfiles([]);
    setPriceRange("all");
    setFinish("all");
    setFavoritesOnly(false);
  }

  async function toggleFavorite(id: string) {
    const wasFavorited = favorites.includes(id);
    setFavorites((prev) =>
      wasFavorited ? prev.filter((x) => x !== id) : [...prev, id],
    );

    if (!syncFavoritesToApi) return;

    try {
      const res = await fetch("/api/account/favorites", {
        method: wasFavorited ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: id }),
      });
      if (!res.ok) {
        setFavorites((prev) =>
          wasFavorited
            ? [...prev, id]
            : prev.filter((x) => x !== id),
        );
      }
    } catch {
      setFavorites((prev) =>
        wasFavorited ? [...prev, id] : prev.filter((x) => x !== id),
      );
    }
  }

  return (
    <div
      className={`bg-white pb-[calc(8.5rem+env(safe-area-inset-bottom))] lg:pb-16 ${storeTopPadClass(compactChrome)}`}
    >
      <div className="border-b border-black/8 bg-umx-cream">
        <div className="mx-auto max-w-[1680px] px-4 py-8 text-center sm:px-6 sm:py-12 lg:px-6 xl:px-8">
          <h1 className="font-display text-[clamp(2.25rem,8vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            <span className="text-umx-orange">UMAXES</span> Shop
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1680px] px-4 sm:px-5 lg:px-6 xl:px-8">
        <div className="flex flex-col gap-3 border-b border-black/8 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="relative w-full sm:min-w-[200px] sm:max-w-xs sm:flex-1 lg:min-w-[240px] lg:flex-none">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-black/35"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search flavors"
              className="w-full border border-black/15 bg-white py-2.5 pr-3 pl-10 font-display text-sm font-semibold text-black outline-none focus:border-umx-orange"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 border border-black/15 bg-white px-3.5 py-2.5 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-umx-orange px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <label className="inline-flex items-center gap-2 border border-black/15 bg-white px-3 py-2.5">
              <ArrowUpDown className="h-4 w-4 text-black/45" strokeWidth={2} aria-hidden />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                className="bg-transparent font-display text-sm font-semibold text-black outline-none"
                aria-label="Sort products"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="inline-flex border border-black/15">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className={`flex h-11 w-11 items-center justify-center transition ${
                  view === "grid"
                    ? "bg-black text-umx-cream"
                    : "bg-white text-black hover:text-umx-orange"
                }`}
              >
                <Grid2x2 className="h-4 w-4" strokeWidth={2.1} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className={`flex h-11 w-11 items-center justify-center border-l border-black/15 transition ${
                  view === "list"
                    ? "bg-black text-umx-cream"
                    : "bg-white text-black hover:text-umx-orange"
                }`}
              >
                <LayoutList className="h-4 w-4" strokeWidth={2.1} aria-hidden />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 items-center gap-2 border border-black/15 bg-white px-3.5 font-display text-sm font-semibold text-black transition hover:border-umx-orange hover:text-umx-orange"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={2.1} aria-hidden />
              <span className="hidden sm:inline">Cart</span>
              {quantity > 0 && (
                <span className="bg-umx-orange px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                  {quantity}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_260px] xl:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-28 border border-black/8 bg-umx-cream/70 p-5">
              <FilterPanel
                query={query}
                setQuery={setQuery}
                profiles={profiles}
                setProfiles={setProfiles}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                finish={finish}
                setFinish={setFinish}
                favoritesOnly={favoritesOnly}
                setFavoritesOnly={setFavoritesOnly}
                onClear={clearFilters}
              />
            </div>
          </aside>

          <div>
            {filtered.length === 0 ? (
              <div className="border border-dashed border-black/15 bg-umx-cream/50 px-6 py-16 text-center">
                <Search className="mx-auto h-8 w-8 text-black/25" strokeWidth={1.75} aria-hidden />
                <p className="mt-4 font-display text-lg font-bold text-black">
                  No flavors match
                </p>
                <p className="mt-2 font-body text-sm text-black/55">
                  Try clearing filters or searching another name.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 bg-black px-5 py-3 font-display text-sm font-semibold text-umx-cream transition hover:bg-umx-orange"
                >
                  Clear filters
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 items-stretch gap-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 xl:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((flavor) => (
                  <ShopCard
                    key={flavor.id}
                    flavor={flavor}
                    view="grid"
                    favorited={favorites.includes(flavor.id)}
                    onToggleFavorite={() => toggleFavorite(flavor.id)}
                  />
                ))}
              </div>
            ) : (
              <div>
                {filtered.map((flavor) => (
                  <ShopCard
                    key={flavor.id}
                    flavor={flavor}
                    view="list"
                    favorited={favorites.includes(flavor.id)}
                    onToggleFavorite={() => toggleFavorite(flavor.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <ShopAside
            quantity={quantity}
            total={total}
            onOpenCart={() => setOpen(true)}
            favoritesCount={favorites.length}
          />
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-umx-orange-ink/45"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,340px)] flex-col bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
              <p className="font-display text-base font-bold text-black">Filters</p>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center text-black"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <FilterPanel
                query={query}
                setQuery={setQuery}
                profiles={profiles}
                setProfiles={setProfiles}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                finish={finish}
                setFinish={setFinish}
                favoritesOnly={favoritesOnly}
                setFavoritesOnly={setFavoritesOnly}
                onClear={clearFilters}
                showSearch={false}
              />
            </div>
            <div className="border-t border-black/8 p-4">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-umx-orange py-3.5 font-display text-sm font-semibold text-white"
              >
                Show {filtered.length} products
              </button>
            </div>
          </div>
        </div>
      )}

      {quantity > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-black/8 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6 lg:bottom-0 xl:hidden">
          <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4">
            <div>
              <p className="font-display text-sm font-semibold text-black">
                {quantity} {quantity === 1 ? "item" : "items"} · ${total.toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 bg-umx-orange px-5 py-3 font-display text-sm font-semibold text-white"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={2.1} aria-hidden />
              View cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
