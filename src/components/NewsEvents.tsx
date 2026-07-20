"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { blogPosts, type BlogPost } from "@/lib/blog";

const filters = ["All", "News", "Events"] as const;
type Filter = (typeof filters)[number];

function matchesFilter(post: BlogPost, filter: Filter) {
  if (filter === "All") return true;
  return post.category === filter;
}

export default function NewsEvents() {
  const [filter, setFilter] = useState<Filter>("All");

  const posts = useMemo(
    () => blogPosts.filter((p) => matchesFilter(p, filter)),
    [filter]
  );

  return (
    <section
      id="news"
      className="relative overflow-hidden bg-umx-cream px-4 py-20 sm:px-6 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-0 h-80 w-80 translate-x-1/4 rounded-full bg-umx-orange/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 -translate-x-1/4 rounded-full bg-umx-cream-deep/60 blur-3xl"
      />
      <p
        aria-hidden
        className="pointer-events-none absolute top-[6%] left-1/2 -translate-x-1/2 font-display text-[clamp(5rem,16vw,12rem)] font-extrabold tracking-[-0.06em] text-black/[0.035] uppercase select-none"
      >
        Journal
      </p>

      <div className="relative mx-auto max-w-[1200px]">
        <header className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-semibold tracking-[0.2em] text-umx-orange uppercase">
            News & Events
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,6vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-black">
            What’s next
            <span className="text-umx-orange"> for UMAXES.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-body text-base leading-relaxed text-black/65 sm:text-lg">
            Flavor drops, session nights, and the stories behind HOOKAMAX.
          </p>
        </header>

        {/* Filter pills */}
        <div
          className="mt-14 flex justify-center sm:mt-16"
          role="tablist"
          aria-label="Filter posts"
        >
          <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-black/8 shadow-[0_8px_24px_rgba(61,22,5,0.06)]">
            {filters.map((item) => {
              const active = filter === item;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-5 py-2 font-display text-sm font-semibold transition duration-300 ${
                    active
                      ? "bg-umx-orange text-white shadow-[0_8px_18px_rgba(255,91,4,0.35)]"
                      : "text-black/55 hover:text-black"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-black/6 shadow-[0_12px_36px_rgba(61,22,5,0.08)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:shadow-[0_28px_60px_rgba(61,22,5,0.14)] hover:ring-umx-orange/40"
            >
              <div className="relative aspect-[16/11] overflow-hidden bg-umx-cream-warm">
                <Image
                  src={post.image}
                  alt=""
                  fill
                  className="object-cover transition duration-700 ease-out group-hover:scale-[1.08]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                />

                {/* Hover wash */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100"
                />

                {/* Category chip on image */}
                <span className="absolute top-3 left-3 z-[1] rounded-full bg-black/75 px-3 py-1 font-display text-[0.65rem] font-semibold tracking-[0.12em] text-umx-cream uppercase backdrop-blur-sm transition duration-500 group-hover:bg-umx-orange">
                  {post.category}
                </span>

                {/* Index */}
                <span
                  aria-hidden
                  className="absolute top-3 right-3 z-[1] font-display text-xs font-bold tracking-wider text-white/0 transition duration-500 group-hover:text-white/80"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                {/* Orange accent bar */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-umx-orange transition duration-500 ease-out group-hover:scale-x-100"
                />
              </div>

              <div className="flex flex-1 flex-col px-5 py-5 sm:px-6 sm:py-6">
                <time
                  dateTime={post.date}
                  className="font-display text-[0.7rem] font-semibold tracking-[0.14em] text-black/40 uppercase"
                >
                  {post.dateLabel}
                </time>
                <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-black transition duration-300 group-hover:text-umx-orange">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-3 flex-1 font-body text-sm leading-relaxed text-black/60">
                  {post.excerpt}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 font-display text-sm font-semibold text-black transition duration-300 group-hover:text-umx-orange">
                  Read more
                  <span
                    aria-hidden
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-base transition duration-300 group-hover:translate-x-1 group-hover:bg-umx-orange group-hover:text-white"
                  >
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <p className="mt-12 text-center font-body text-black/50">
            No posts in this category yet.
          </p>
        )}
      </div>
    </section>
  );
}
