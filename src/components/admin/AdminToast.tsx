"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, CircleAlert } from "lucide-react";

export function AdminToast({
  message,
  tone = "success",
}: {
  message: string | null;
  tone?: "success" | "error";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !message) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`admin-toast admin-toast-${tone}`}
    >
      {tone === "error" ? (
        <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      ) : (
        <Check className="h-4 w-4 shrink-0" strokeWidth={2.4} />
      )}
      <span>{message}</span>
    </div>,
    document.body,
  );
}

export function useAdminToast(ms = 2800) {
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const timer = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, tone: "success" | "error" = "success") => {
      setToast({ message, tone });
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

  return { toast, showToast };
}
