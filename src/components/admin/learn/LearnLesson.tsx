"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import {
  adjacentSlugs,
  getLearnCard,
  listTutorials,
  type LearnSlug,
} from "@/lib/admin-learn";

export function LearnLesson({ slug }: { slug: LearnSlug }) {
  const { t, locale } = useAdminI18n();
  const card = getLearnCard(slug, locale);
  const outline = listTutorials(locale);
  const { prev, next } = adjacentSlugs(slug);
  const index = outline.findIndex((item) => item.slug === slug);

  if (!card) return null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/learn"
          className="inline-flex items-center gap-1 text-sm text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("learn.backToHub")}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="admin-card admin-card-pad h-fit lg:sticky lg:top-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
            {t("learn.outline")}
          </p>
          <ol className="space-y-1">
            {outline.map((item, i) => {
              const active = item.slug === slug;
              return (
                <li key={item.slug}>
                  <Link
                    href={`/admin/learn/${item.slug}`}
                    className={`block rounded-lg px-2.5 py-2 text-sm transition ${
                      active
                        ? "bg-[var(--admin-brand-500)]/10 font-medium text-[var(--admin-brand-500)]"
                        : "text-[var(--admin-muted)] hover:bg-[var(--admin-gray-100)] hover:text-[var(--admin-text)]"
                    }`}
                  >
                    <span className="mr-2 tabular-nums opacity-60">
                      {i + 1}.
                    </span>
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="admin-card admin-card-pad min-w-0">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                {t("learn.lessonOf", {
                  n: index + 1,
                  total: outline.length,
                })}
              </p>
              <h1 className="admin-title mt-1">{card.title}</h1>
              <p className="admin-subtitle mt-2">{card.summary}</p>
            </div>
            {card.relatedHref ? (
              <Link
                href={card.relatedHref}
                className="admin-btn admin-btn-primary inline-flex items-center gap-2"
              >
                {t("learn.openModule")}
                <ExternalLink className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          <section className="space-y-6">
            <div>
              <h2 className="mb-2 text-base font-semibold text-[var(--admin-text)]">
                {locale === "zh" ? "这是什么" : "What it is"}
              </h2>
              <p className="text-[var(--admin-muted)] leading-relaxed">
                {card.what}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-semibold text-[var(--admin-text)]">
                {locale === "zh" ? "如何使用" : "How it works"}
              </h2>
              <ol className="space-y-2">
                {card.steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-[var(--admin-muted)] leading-relaxed"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--admin-gray-100)] text-xs font-semibold text-[var(--admin-brand-500)]">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {card.tip ? (
              <div className="rounded-xl border border-[var(--admin-brand-500)]/20 bg-[var(--admin-brand-500)]/5 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-brand-500)]">
                  {t("learn.tip")}
                </p>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  {card.tip}
                </p>
              </div>
            ) : null}
          </section>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-6">
            {prev ? (
              <Link
                href={`/admin/learn/${prev}`}
                className="admin-btn inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("learn.previous")}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/admin/learn/${next}`}
                className="admin-btn admin-btn-primary inline-flex items-center gap-2"
              >
                {t("learn.next")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link href="/admin/learn" className="admin-btn inline-flex items-center gap-2">
                {t("learn.backToHub")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
