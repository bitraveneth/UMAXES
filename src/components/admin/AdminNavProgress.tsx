"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top bar while App Router navigates between admin pages.
 * Live DB pages can take seconds — this makes clicks feel responsive.
 */
export default function AdminNavProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (anchor.target === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/admin")) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.pathname === window.location.pathname) return;
        setPending(true);
      } catch {
        /* ignore */
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!pending) return null;

  return (
    <div
      className="admin-nav-progress"
      role="progressbar"
      aria-label="Loading page"
    />
  );
}
