"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { createFaq, deleteFaq, updateFaq } from "@/lib/admin-actions";
import { faqs as DEFAULT_FAQS } from "@/lib/support";
import { AdminBadge } from "@/components/admin/ui";
import { useAdminI18n } from "./AdminI18n";
import { useAppFeedback } from "@/components/ui/AppFeedback";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  keywords: string;
  sortOrder: number;
  published: boolean;
};

type Props = { items: FaqItem[] };

type Draft = {
  id?: string;
  question: string;
  answer: string;
  sortOrder: string;
  published: boolean;
};

function emptyDraft(nextOrder: number): Draft {
  return {
    question: "",
    answer: "",
    sortOrder: String(nextOrder),
    published: true,
  };
}

export default function FaqManager({ items }: Props) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const { confirm, showToast, ui } = useAppFeedback();

  const rows = useMemo<FaqItem[]>(() => {
    if (items.length > 0) return items;
    return DEFAULT_FAQS.map((item, i) => ({
      id: `default-${i}`,
      question: item.q,
      answer: item.a,
      keywords: item.keys.join(", "),
      sortOrder: i,
      published: true,
    }));
  }, [items]);

  const nextOrder = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1,
    [rows],
  );

  function openCreate() {
    setError(null);
    setMessage(null);
    setDraft(emptyDraft(nextOrder));
  }

  function openEdit(row: FaqItem) {
    setError(null);
    setMessage(null);
    setDraft({
      id: row.id,
      question: row.question,
      answer: row.answer,
      sortOrder: String(row.sortOrder),
      published: row.published,
    });
  }

  function save() {
    if (!draft) return;
    const payload = {
      question: draft.question,
      answer: draft.answer,
      sortOrder: Number(draft.sortOrder),
      published: draft.published,
    };
    startTransition(async () => {
      setError(null);
      setMessage(null);
      try {
        if (draft.id && !draft.id.startsWith("default-")) {
          await updateFaq({ id: draft.id, ...payload });
        } else {
          await createFaq(payload);
        }
        setMessage(t("faq.saved"));
        setDraft(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("faq.saveFailed"));
      }
    });
  }

  async function remove(row: FaqItem) {
    if (row.id.startsWith("default-")) {
      setError("Save this FAQ once so it is stored, then you can delete it.");
      return;
    }
    const ok = await confirm({
      title: t("common.remove"),
      message: t("faq.deleteConfirm", { question: row.question }),
      confirmLabel: t("common.remove"),
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      setError(null);
      setMessage(null);
      try {
        await deleteFaq(row.id);
        if (draft?.id === row.id) setDraft(null);
        setMessage(t("faq.deleted"));
        showToast(t("faq.deleted"), "danger");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("faq.saveFailed"));
      }
    });
  }

  return (
    <>
      {ui}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm admin-muted">
            {rows.length} {rows.length === 1 ? "question" : "questions"}
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="admin-btn admin-btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t("faq.add")}
          </button>
        </div>

        {error ? (
          <p className="mb-3 text-sm text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="mb-3 text-sm text-[var(--admin-brand-700)]">{message}</p>
        ) : null}

        <ul className="admin-list">
          {rows.length === 0 ? (
            <li className="admin-list-item text-sm admin-muted">{t("faq.empty")}</li>
          ) : (
            rows.map((row) => (
              <li key={row.id} className="admin-list-item">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--admin-gray-800)]">
                      {row.question}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm admin-muted">
                      {row.answer}
                    </p>
                    <div className="mt-2">
                      <AdminBadge tone={row.published ? "success" : "neutral"}>
                        {row.published ? t("common.active") : t("common.inactive")}
                      </AdminBadge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      {t("common.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      disabled={pending}
                      className="admin-btn admin-btn-danger admin-btn-sm disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      {t("common.remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {draft ? (
        <form
          className="admin-card admin-card-pad h-fit"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="admin-section-title">
              {draft.id ? t("faq.edit") : t("faq.add")}
            </h2>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg p-1 text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-gray-800)]"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <label className="admin-label mt-4">
            {t("faq.question")}
            <input
              value={draft.question}
              onChange={(e) =>
                setDraft({ ...draft, question: e.target.value })
              }
              required
              className="admin-input mt-1 w-full"
            />
          </label>
          <label className="admin-label mt-3">
            {t("faq.answer")}
            <textarea
              value={draft.answer}
              onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
              required
              rows={7}
              className="admin-input mt-1 w-full resize-y"
            />
          </label>
          <label className="admin-label mt-3">
            {t("faq.sortOrder")}
            <input
              type="number"
              value={draft.sortOrder}
              onChange={(e) =>
                setDraft({ ...draft, sortOrder: e.target.value })
              }
              className="admin-input mt-1 w-full"
            />
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--admin-gray-700)]">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) =>
                setDraft({ ...draft, published: e.target.checked })
              }
            />
            {t("faq.published")}
          </label>
          <button
            type="submit"
            disabled={pending}
            className="admin-btn admin-btn-primary mt-5 w-full disabled:opacity-50"
          >
            {pending ? "…" : t("common.save")}
          </button>
        </form>
      ) : null}
    </div>
    </>
  );
}
