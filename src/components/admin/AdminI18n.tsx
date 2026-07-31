"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ADMIN_LOCALE_COOKIE,
  ADMIN_LOCALE_KEY,
  adminDictionaries,
  createAdminTranslator,
  isAdminLocale,
  type AdminLocale,
} from "@/lib/admin-i18n";

type AdminI18nValue = {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
  t: (path: string, values?: Record<string, string | number>) => string;
};

const AdminI18nContext = createContext<AdminI18nValue | null>(null);

function writeCookie(locale: AdminLocale) {
  document.cookie = `${ADMIN_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function AdminI18nProvider({
  initialLocale = "en",
  children,
}: {
  initialLocale?: AdminLocale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<AdminLocale>(initialLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_LOCALE_KEY);
    if (isAdminLocale(stored)) {
      setLocaleState(stored);
      writeCookie(stored);
    } else {
      writeCookie(initialLocale);
    }
    setReady(true);
  }, [initialLocale]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(ADMIN_LOCALE_KEY, locale);
    writeCookie(locale);
    const shell = document.querySelector(".admin-shell");
    if (shell) {
      shell.setAttribute("lang", locale === "zh" ? "zh-CN" : "en");
      shell.classList.toggle("admin-locale-zh", locale === "zh");
    }
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale, ready]);

  const setLocale = useCallback((next: AdminLocale) => {
    setLocaleState(next);
  }, []);

  const t = useMemo(() => createAdminTranslator(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <AdminI18nContext.Provider value={value}>
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n() {
  const ctx = useContext(AdminI18nContext);
  if (!ctx) {
    throw new Error("useAdminI18n must be used within AdminI18nProvider");
  }
  return ctx;
}

/** Inline translated text for mixed RSC/client trees. */
export function T({
  id,
  values,
}: {
  id: string;
  values?: Record<string, string | number>;
}) {
  const { t } = useAdminI18n();
  return <>{t(id, values)}</>;
}

export function AdminLanguagePicker() {
  const { locale, setLocale, t } = useAdminI18n();

  return (
    <label className="relative inline-flex items-center" title={t("header.language")}>
      <span className="sr-only">{t("header.language")}</span>
      <select
        value={locale}
        onChange={(e) => {
          const next = e.target.value;
          if (isAdminLocale(next)) setLocale(next);
        }}
        className="admin-input h-10 appearance-none rounded-full border border-[var(--admin-border)] bg-[var(--admin-card)] py-0 pr-8 pl-3 text-xs font-semibold text-[var(--admin-text)]"
        aria-label={t("header.language")}
      >
        <option value="zh">{t("header.langZh")}</option>
        <option value="en">{t("header.langEn")}</option>
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[10px] text-[var(--admin-muted)]"
      >
        ▾
      </span>
    </label>
  );
}

export function useAdminDictionary() {
  const { locale } = useAdminI18n();
  return adminDictionaries[locale];
}
