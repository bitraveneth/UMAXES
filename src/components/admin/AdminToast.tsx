"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, CircleAlert } from "lucide-react";

export type AdminToastTone = "success" | "error";

export type AdminToastState = {
  message: string;
  detail?: string;
  tone: AdminToastTone;
};

type AdminToastContextValue = {
  toast: AdminToastState | null;
  showToast: (
    message: string,
    tone?: AdminToastTone,
    detail?: string,
  ) => void;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

export function AdminToastProvider({
  children,
  ms = 5000,
}: {
  children: ReactNode;
  ms?: number;
}) {
  const [toast, setToast] = useState<AdminToastState | null>(null);
  const timer = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, tone: AdminToastTone = "success", detail?: string) => {
      setToast({ message, tone, detail });
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setToast(null), ms);
    },
    [ms],
  );

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => ({ toast, showToast }), [toast, showToast]);

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`admin-toast admin-toast-${toast.tone}`}
        >
          <span className="admin-toast-icon" aria-hidden>
            {toast.tone === "error" ? (
              <CircleAlert className="h-6 w-6" strokeWidth={2.2} />
            ) : (
              <Check className="h-6 w-6" strokeWidth={2.6} />
            )}
          </span>
          <span className="admin-toast-copy">
            <span className="admin-toast-title">{toast.message}</span>
            {toast.detail ? (
              <span className="admin-toast-detail">{toast.detail}</span>
            ) : null}
          </span>
        </div>
      ) : null}
    </AdminToastContext.Provider>
  );
}

/** Kept for any leftover call sites; prefer the provider host in the admin layout. */
export function AdminToast({
  message,
  tone = "success",
  detail,
}: {
  message: string | null;
  tone?: AdminToastTone;
  detail?: string;
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`admin-toast admin-toast-${tone}`}
    >
      <span className="admin-toast-icon" aria-hidden>
        {tone === "error" ? (
          <CircleAlert className="h-6 w-6" strokeWidth={2.2} />
        ) : (
          <Check className="h-6 w-6" strokeWidth={2.6} />
        )}
      </span>
      <span className="admin-toast-copy">
        <span className="admin-toast-title">{message}</span>
        {detail ? <span className="admin-toast-detail">{detail}</span> : null}
      </span>
    </div>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (ctx) return ctx;

  throw new Error("useAdminToast must be used inside AdminToastProvider");
}

export function AdminSaveBanner() {
  const { toast } = useAdminToast();
  if (!toast) return null;
  return (
    <div
      className={`admin-save-banner admin-save-banner-${toast.tone}`}
      role="status"
    >
      {toast.tone === "error" ? (
        <CircleAlert className="h-5 w-5 shrink-0" strokeWidth={2.2} />
      ) : (
        <Check className="h-5 w-5 shrink-0" strokeWidth={2.6} />
      )}
      <span>
        <strong>{toast.message}</strong>
        {toast.detail ? ` ${toast.detail}` : ""}
      </span>
    </div>
  );
}
