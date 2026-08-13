"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { listTutorials } from "@/lib/admin-learn";

export function LearnHub() {
  const { t, locale } = useAdminI18n();
  const cards = listTutorials(locale);

  return (
    <div>
      <AdminPageHeaderI18n
        titleKey="learn.title"
        descriptionKey="learn.description"
      />
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
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">
              {card.title}
            </h2>
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
    </div>
  );
}
