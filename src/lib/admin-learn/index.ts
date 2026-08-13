import type { AdminLocale } from "@/lib/admin-i18n";
import {
  LEARN_CATALOG,
  isLearnSlug,
  learnIndex,
  type LearnMeta,
  type LearnSlug,
} from "./catalog";
import { learnEn, type LearnTutorial } from "./content/en";
import { learnZh } from "./content/zh";

export type { LearnMeta, LearnSlug, LearnTutorial };
export { LEARN_CATALOG, isLearnSlug, learnIndex };

export type LearnCard = LearnMeta & LearnTutorial;

const byLocale = {
  en: learnEn,
  zh: learnZh,
} as const;

export function getTutorial(
  slug: LearnSlug,
  locale: AdminLocale,
): LearnTutorial {
  return byLocale[locale][slug] ?? learnEn[slug];
}

export function listTutorials(locale: AdminLocale): LearnCard[] {
  return LEARN_CATALOG.map((meta) => ({
    ...meta,
    ...getTutorial(meta.slug, locale),
  }));
}

export function getLearnCard(
  slug: LearnSlug,
  locale: AdminLocale,
): LearnCard | null {
  const meta = LEARN_CATALOG.find((item) => item.slug === slug);
  if (!meta) return null;
  return { ...meta, ...getTutorial(slug, locale) };
}

export function adjacentSlugs(slug: LearnSlug): {
  prev: LearnSlug | null;
  next: LearnSlug | null;
} {
  const i = learnIndex(slug);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? LEARN_CATALOG[i - 1]!.slug : null,
    next: i < LEARN_CATALOG.length - 1 ? LEARN_CATALOG[i + 1]!.slug : null,
  };
}
