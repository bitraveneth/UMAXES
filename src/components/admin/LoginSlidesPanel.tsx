"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  createLoginSlide,
  deleteLoginSlide,
  reorderLoginSlides,
  updateLoginSlide,
} from "@/lib/admin-actions";
import { LOGIN_IMAGE } from "@/lib/login-image";
import { formatBytes } from "@/lib/product-image";
import { useAdminI18n } from "./AdminI18n";
import { useAppFeedback } from "@/components/ui/AppFeedback";

export type LoginSlideItem = {
  id: string;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
};

type Props = { items: LoginSlideItem[] };

export default function LoginSlidesPanel({ items }: Props) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, showToast, ui } = useAppFeedback();

  const rows = useMemo(
    () =>
      [...items].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
      ),
    [items],
  );

  function refresh(msg?: string) {
    startTransition(() => {
      router.refresh();
      if (msg) showToast(msg, "success");
    });
  }

  async function uploadFile(file: File): Promise<string | null> {
    if (file.size > LOGIN_IMAGE.maxUploadBytes) {
      setError(
        `File is ${formatBytes(file.size)} — max is ${formatBytes(LOGIN_IMAGE.maxUploadBytes)}.`,
      );
      return null;
    }

    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/admin/upload/login-image", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as {
      error?: string;
      url?: string;
    };
    if (!res.ok || !data.url) {
      setError(data.error || t("loginImages.uploadFailed"));
      return null;
    }
    return data.url;
  }

  async function onAdd(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (!url) return;
      await createLoginSlide({ imageUrl: url });
      refresh(t("loginImages.uploaded"));
    } catch {
      setError(t("loginImages.uploadFailed"));
    } finally {
      setUploading(false);
      if (addInputRef.current) addInputRef.current.value = "";
    }
  }

  async function onReplace(file: File | null) {
    if (!file || !replaceId) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (!url) return;
      await updateLoginSlide({ id: replaceId, imageUrl: url });
      refresh(t("loginImages.saved"));
    } catch {
      setError(t("loginImages.uploadFailed"));
    } finally {
      setUploading(false);
      setReplaceId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  }

  function setOrder(id: string, sortOrder: number) {
    startTransition(async () => {
      setError(null);
      try {
        await updateLoginSlide({ id, sortOrder });
        refresh(t("loginImages.saved"));
      } catch (e) {
        setError(e instanceof Error ? e.message : t("loginImages.saveFailed"));
      }
    });
  }

  function toggleActive(row: LoginSlideItem) {
    startTransition(async () => {
      setError(null);
      try {
        await updateLoginSlide({ id: row.id, active: !row.active });
        refresh(t("loginImages.saved"));
      } catch (e) {
        setError(e instanceof Error ? e.message : t("loginImages.saveFailed"));
      }
    });
  }

  async function move(row: LoginSlideItem, dir: -1 | 1) {
    const index = rows.findIndex((r) => r.id === row.id);
    const swap = index + dir;
    if (index < 0 || swap < 0 || swap >= rows.length) return;
    const next = [...rows];
    const tmp = next[index]!;
    next[index] = next[swap]!;
    next[swap] = tmp;
    startTransition(async () => {
      setError(null);
      try {
        await reorderLoginSlides(next.map((r) => r.id));
        refresh(t("loginImages.saved"));
      } catch (e) {
        setError(e instanceof Error ? e.message : t("loginImages.saveFailed"));
      }
    });
  }

  async function onDelete(row: LoginSlideItem) {
    const ok = await confirm({
      title: t("loginImages.delete"),
      message: t("loginImages.deleteConfirm"),
      confirmLabel: t("loginImages.delete"),
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      setError(null);
      try {
        await deleteLoginSlide(row.id);
        refresh(t("loginImages.deleted"));
      } catch (e) {
        setError(e instanceof Error ? e.message : t("loginImages.saveFailed"));
      }
    });
  }

  const busy = pending || uploading;

  return (
    <div className="space-y-5">
      {ui}

      <input
        ref={replaceInputRef}
        type="file"
        accept={LOGIN_IMAGE.acceptAttr}
        className="sr-only"
        disabled={busy}
        onChange={(e) => onReplace(e.target.files?.[0] || null)}
      />

      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-[var(--admin-text)]">
            {t("loginImages.current")}
          </h2>
          <label
            className={`admin-btn admin-btn-primary inline-flex cursor-pointer ${
              busy ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {uploading && !replaceId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
            )}
            {uploading && !replaceId
              ? t("loginImages.uploading")
              : t("loginImages.add")}
            <input
              ref={addInputRef}
              type="file"
              accept={LOGIN_IMAGE.acceptAttr}
              className="sr-only"
              disabled={busy}
              onChange={(e) => onAdd(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-3 font-body text-sm text-[var(--admin-error-700)]">
            {error}
          </p>
        ) : null}

        {rows.length === 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => addInputRef.current?.click()}
            className="mt-5 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--admin-border)] bg-[var(--admin-hover)] px-6 py-14 text-center transition hover:border-[var(--admin-brand-500)] disabled:opacity-50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-700)]">
              <ImagePlus className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <span className="font-display text-sm font-semibold text-[var(--admin-text)]">
              {t("loginImages.add")}
            </span>
            <span className="font-body text-xs text-[var(--admin-muted)]">
              JPEG, PNG, or WebP · max 4 MB
            </span>
          </button>
        ) : (
          <ul className="mt-5 divide-y divide-[var(--admin-border)] rounded-2xl border border-[var(--admin-border)]">
            {rows.map((row, index) => (
              <li
                key={row.id}
                className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <span className="w-6 shrink-0 text-center font-display text-sm font-semibold tabular-nums text-[var(--admin-muted)]">
                    {index + 1}
                  </span>
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)] sm:h-24 sm:w-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="flex items-center gap-2 font-body text-sm text-[var(--admin-text)]">
                      <span className="font-display text-[10px] font-semibold tracking-[0.12em] text-[var(--admin-muted)] uppercase">
                        {t("loginImages.order")}
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        defaultValue={row.sortOrder}
                        key={`${row.id}-${row.sortOrder}`}
                        disabled={busy}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isFinite(n) || n === row.sortOrder) return;
                          setOrder(row.id, n);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="w-16 rounded-lg border border-[var(--admin-border)] bg-white px-2 py-1.5 text-center font-display text-sm font-semibold tabular-nums"
                      />
                    </label>
                    <p className="mt-1 font-body text-xs text-[var(--admin-muted)]">
                      {row.active
                        ? t("loginImages.active")
                        : t("loginImages.hidden")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => move(row, -1)}
                    className="admin-btn admin-btn-secondary admin-btn-sm disabled:opacity-40"
                    aria-label={t("loginImages.moveUp")}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === rows.length - 1}
                    onClick={() => move(row, 1)}
                    className="admin-btn admin-btn-secondary admin-btn-sm disabled:opacity-40"
                    aria-label={t("loginImages.moveDown")}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setReplaceId(row.id);
                      replaceInputRef.current?.click();
                    }}
                    className="admin-btn admin-btn-secondary admin-btn-sm disabled:opacity-50"
                  >
                    <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
                    {t("loginImages.replace")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleActive(row)}
                    className="admin-btn admin-btn-secondary admin-btn-sm disabled:opacity-50"
                  >
                    {row.active
                      ? t("loginImages.hide")
                      : t("loginImages.show")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDelete(row)}
                    className="admin-btn admin-btn-secondary admin-btn-sm text-[var(--admin-error-700)] disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("loginImages.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
