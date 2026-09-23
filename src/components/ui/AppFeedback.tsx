"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
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
  const confirmRef = useRef<HTMLButtonElement>(null);
  const danger = tone === "danger";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => confirmRef.current?.focus(), 20);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
      if (e.key === "Enter" && !pending) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === "BUTTON" || tag === "A" || tag === "TEXTAREA") return;
        e.preventDefault();
        onConfirm();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel, onConfirm, pending]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[26rem] overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)]"
      >
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-1.5 ${
            danger ? "bg-red-600" : "bg-emerald-600"
          }`}
        />
        <div className="px-6 py-6 pl-8">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
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
            className="mt-4 font-display text-xl font-extrabold tracking-tight text-black"
          >
            {title}
          </h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-black/68">
            {message}
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="rounded-xl border border-black/12 bg-white px-4 py-2.5 font-display text-sm font-semibold text-black transition hover:border-black/28 hover:bg-black/[0.02] disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className={`rounded-xl px-4 py-2.5 font-display text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                danger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
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
  okLabel = "OK",
  onClose,
}: ToastState & { okLabel?: string; onClose?: () => void }) {
  const danger = tone === "danger";
  const titleId = useId();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        onClose?.();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[26rem] overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)]"
      >
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-1.5 ${
            danger ? "bg-red-600" : "bg-emerald-600"
          }`}
        />
        <div className="px-6 py-6 pl-8">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              danger ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {danger ? (
              <CircleAlert className="h-5 w-5" strokeWidth={1.85} />
            ) : (
              <Check className="h-5 w-5" strokeWidth={2.2} />
            )}
          </span>
          <h2
            id={titleId}
            className="mt-4 font-display text-xl font-extrabold tracking-tight text-black"
          >
            {title}
          </h2>
          {detail ? (
            <p className="mt-2 font-body text-sm leading-relaxed text-black/68">
              {detail}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-xl px-4 py-2.5 font-display text-sm font-semibold text-white shadow-sm transition ${
                danger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {okLabel}
            </button>
          </div>
        </div>
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
      window.setTimeout(() => setToast(null), 6000);
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
