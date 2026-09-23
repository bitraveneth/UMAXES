import { prisma } from "@/lib/db";
import { faqs as DEFAULT_FAQS, type SupportFaq } from "@/lib/support";

export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  keywords: string;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function parseKeywords(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function toSupportFaq(row: {
  question: string;
  answer: string;
  keywords: string;
}): SupportFaq {
  const keys = parseKeywords(row.keywords);
  return {
    q: row.question,
    a: row.answer,
    keys: keys.length ? keys : [row.question.toLowerCase()],
  };
}

export async function ensureDefaultFaqs() {
  const existing = await prisma.faq.findMany({ select: { question: true } });
  const have = new Set(existing.map((row) => row.question.trim().toLowerCase()));
  const missing = DEFAULT_FAQS.filter(
    (item) => !have.has(item.q.trim().toLowerCase()),
  );
  if (missing.length) {
    await prisma.faq.createMany({
      data: missing.map((item, i) => ({
        question: item.q,
        answer: item.a,
        keywords: item.keys.join(", "),
        sortOrder: existing.length + i,
        published: true,
      })),
    });
  }

  const hookamaxFaq = DEFAULT_FAQS.find((item) => item.q === "What is HOOKAMAX?");
  if (hookamaxFaq) {
    await prisma.faq.updateMany({
      where: {
        question: "What is HOOKAMAX?",
        answer: { contains: "flavor options" },
      },
      data: { answer: hookamaxFaq.a },
    });
  }
}

export async function listPublishedFaqs(): Promise<SupportFaq[]> {
  try {
    await ensureDefaultFaqs();
    const rows = await prisma.faq.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(toSupportFaq);
  } catch {
    return DEFAULT_FAQS;
  }
}

export async function listAllFaqs(): Promise<FaqRow[]> {
  try {
    await ensureDefaultFaqs();
    const rows = await prisma.faq.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (rows.length > 0) return rows;
  } catch (error) {
    console.error("[faq] listAllFaqs failed", error);
  }

  return DEFAULT_FAQS.map((item, i) => ({
    id: `default-${i}`,
    question: item.q,
    answer: item.a,
    keywords: item.keys.join(", "),
    sortOrder: i,
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}
