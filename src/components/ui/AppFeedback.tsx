"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { Check, CircleAlert, Trash2 } from "lucide-react";

export type FeedbackTone = "success" | "danger";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: FeedbackTone;
};

type ToastState = {
  title: string;
  detail?: string;
  tone: FeedbackTone;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmOptions & {
  open: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const danger = tone === "danger";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md overflow-hidden border border-black/10 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-1 ${
            danger ? "bg-red-600" : "bg-emerald-600"
          }`}
        />
        <div className="px-6 py-6 pl-7">
          <span
            className={`flex h-11 w-11 items-center justify-center ${
              danger ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {danger ? (
              <Trash2 className="h-5 w-5" strokeWidth={1.85} />
            ) : (
              <Check className="h-5 w-5" strokeWidth={2.2} />
            )}
          </span>
          <h2
            id={titleId}
            className="mt-4 font-display text-xl font-extrabold text-black"
          >
            {title}
          </h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-black/70">
            {message}
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="border border-black/15 bg-white px-4 py-2.5 font-display text-sm font-semibold text-black transition hover:border-black/30 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className={`px-4 py-2.5 font-display text-sm font-semibold text-white transition disabled:opacity-50 ${
                danger
                  ? "bg-red-700 hover:bg-red-800"
                  : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              {pending ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedbackToast({
  title,
  detail,
  tone,
  onClose,
}: ToastState & { onClose?: () => void }) {
  const danger = tone === "danger";
  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onClose}
      className="pointer-events-auto fixed top-4 left-1/2 z-[90] w-[min(24rem,calc(100vw-1.5rem))] -translate-x-1/2 cursor-pointer overflow-hidden border border-black/10 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1 ${
          danger ? "bg-red-600" : "bg-emerald-600"
        }`}
      />
      <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center ${
            danger ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {danger ? (
            <CircleAlert className="h-4 w-4" strokeWidth={2.1} />
          ) : (
            <Check className="h-4 w-4" strokeWidth={2.4} />
          )}
        </span>
        <span className="min-w-0">
          <span className="block font-display text-sm font-bold text-black">
            {title}
          </span>
          {detail ? (
            <span className="mt-0.5 block font-body text-xs leading-relaxed text-black/65">
              {detail}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function useAppFeedback() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  >(null);

  const showToast = useCallback(
    (title: string, tone: FeedbackTone = "success", detail?: string) => {
      setToast({ title, tone, detail });
      window.setTimeout(() => setToast(null), 4200);
    },
    [],
  );

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...opts, resolve });
    });
  }, []);

  const ui: ReactNode = (
    <>
      {confirmState ? (
        <ConfirmDialog
          open
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          tone={confirmState.tone}
          onCancel={() => {
            confirmState.resolve(false);
            setConfirmState(null);
          }}
          onConfirm={() => {
            confirmState.resolve(true);
            setConfirmState(null);
          }}
        />
      ) : null}
      {toast ? (
        <FeedbackToast
          title={toast.title}
          detail={toast.detail}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );

  return { confirm, showToast, ui };
}
