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
  BUYER_LOCALE_COOKIE,
  BUYER_LOCALE_KEY,
  createBuyerTranslator,
  isBuyerLocale,
  type BuyerLocale,
} from "@/lib/buyer-i18n";

type BuyerI18nValue = {
  locale: BuyerLocale;
  setLocale: (locale: BuyerLocale) => void;
  t: (path: string, values?: Record<string, string | number>) => string;
};

const BuyerI18nContext = createContext<BuyerI18nValue | null>(null);

function writeCookie(locale: BuyerLocale) {
  document.cookie = `${BUYER_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function BuyerI18nProvider({
  initialLocale = "en",
  children,
}: {
  initialLocale?: BuyerLocale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<BuyerLocale>(initialLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(BUYER_LOCALE_KEY);
    if (isBuyerLocale(stored)) {
      setLocaleState(stored);
      writeCookie(stored);
    } else {
      writeCookie(initialLocale);
    }
    setReady(true);
  }, [initialLocale]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(BUYER_LOCALE_KEY, locale);
    writeCookie(locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale, ready]);

  const setLocale = useCallback((next: BuyerLocale) => {
    setLocaleState(next);
  }, []);

  const t = useMemo(() => createBuyerTranslator(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <BuyerI18nContext.Provider value={value}>
      {children}
    </BuyerI18nContext.Provider>
  );
}

export function useBuyerI18n() {
  const ctx = useContext(BuyerI18nContext);
  if (!ctx) {
    throw new Error("useBuyerI18n must be used within BuyerI18nProvider");
  }
  return ctx;
}

export function BuyerLanguagePicker({
  className = "",
}: {
  className?: string;
}) {
  const { locale, setLocale, t } = useBuyerI18n();

  return (
    <label
      className={`block px-3 ${className}`}
      title={t("nav.language")}
    >
      <span className="mb-1.5 block font-display text-[10px] font-semibold tracking-[0.14em] text-black uppercase">
        {t("nav.language")}
      </span>
      <span className="relative block">
        <select
          value={locale}
          onChange={(e) => {
            const next = e.target.value;
            if (isBuyerLocale(next)) setLocale(next);
          }}
          className="w-full appearance-none border border-black/15 bg-white py-2.5 pr-8 pl-3 font-display text-sm font-semibold text-black outline-none transition hover:border-umx-orange focus:border-umx-orange"
          aria-label={t("nav.language")}
        >
          <option value="zh">{t("nav.langZh")}</option>
          <option value="en">{t("nav.langEn")}</option>
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-black"
        >
          ▾
        </span>
      </span>
    </label>
  );
}
