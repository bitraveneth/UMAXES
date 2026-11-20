"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ListChecks } from "lucide-react";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { getSimpleSop, listTutorials } from "@/lib/admin-learn";

export function LearnHub() {
  const { t, locale } = useAdminI18n();
  const cards = listTutorials(locale);
  const sop = getSimpleSop(locale);

  return (
    <div className="space-y-10">
      <AdminPageHeaderI18n
        titleKey="learn.title"
        descriptionKey="learn.description"
      />

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-600)]">
            <ListChecks className="h-5 w-5" strokeWidth={1.85} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">
              {sop.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">{sop.intro}</p>
          </div>
        </div>
        <ol className="space-y-3">
          {sop.steps.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-xl border border-[var(--admin-border)]/80 bg-[var(--admin-hover)]/30 px-3 py-3 sm:px-4"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--admin-gray-100)] text-xs font-semibold tabular-nums text-[var(--admin-brand-600)]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--admin-text)]">
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[var(--admin-muted)]">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-gray-100)] text-[var(--admin-text)]">
            <BookOpen className="h-5 w-5" strokeWidth={1.85} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">
              {t("learn.coursesTitle")}
            </h2>
            <p className="mt-0.5 text-sm text-[var(--admin-muted)]">
              {t("learn.coursesHint")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => (
            <Link
              key={card.slug}
              href={`/admin/learn/${card.slug}`}
              className="admin-card admin-card-pad group flex flex-col transition hover:border-[var(--admin-brand-500)]"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--admin-gray-100)] text-sm font-semibold text-[var(--admin-brand-500)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {card.saOnly ? (
                  <span className="admin-badge admin-badge-warning text-[10px] uppercase tracking-wide">
                    Super Admin
                  </span>
                ) : null}
              </div>
              <h3 className="text-lg font-semibold text-[var(--admin-text)]">
                {card.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-[var(--admin-muted)]">
                {card.summary}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--admin-brand-500)]">
                {t("learn.start")}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
