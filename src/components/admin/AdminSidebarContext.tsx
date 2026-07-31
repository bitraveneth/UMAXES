"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type AdminShellContextValue = {
  isMobileOpen: boolean;
  isExpanded: boolean;
  theme: Theme;
  toggleMobile: () => void;
  closeMobile: () => void;
  toggleExpanded: () => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

const THEME_KEY = "umaxes-admin-theme";

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isExpanded, setExpanded] = useState(true);
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
    const preferred =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setThemeState(preferred);
    const shell = document.querySelector(".admin-shell");
    if (shell) {
      shell.classList.toggle("dark", preferred === "dark");
    }
    const loc = window.localStorage.getItem("umaxes-admin-locale");
    if (shell && (loc === "zh" || loc === "en")) {
      shell.setAttribute("lang", loc === "zh" ? "zh-CN" : "en");
      shell.classList.toggle("admin-locale-zh", loc === "zh");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(THEME_KEY, theme);
    const shell = document.querySelector(".admin-shell");
    if (shell) {
      shell.classList.toggle("dark", theme === "dark");
    }
  }, [theme, ready]);

  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleExpanded = useCallback(() => setExpanded((v) => !v), []);
  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  const value = useMemo(
    () => ({
      isMobileOpen,
      isExpanded,
      theme,
      toggleMobile,
      closeMobile,
      toggleExpanded,
      toggleTheme,
      setTheme,
    }),
    [
      isMobileOpen,
      isExpanded,
      theme,
      toggleMobile,
      closeMobile,
      toggleExpanded,
      toggleTheme,
      setTheme,
    ],
  );

  return (
    <AdminShellContext.Provider value={value}>
      {children}
    </AdminShellContext.Provider>
  );
}

export function useAdminSidebar() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) {
    throw new Error("useAdminSidebar must be used within AdminSidebarProvider");
  }
  return ctx;
}
