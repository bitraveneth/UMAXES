"use client";

import { useEffect, useState } from "react";
import GoogleTranslate from "@/components/GoogleTranslate";
import {
  SITE_LANGUAGES,
  type SiteLanguageCode,
} from "@/lib/site-languages";

export { SITE_LANGUAGES, type SiteLanguageCode };

function readGoogTransLang(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  return match?.[1] || "en";
}

/** Google stores googtrans on path=/ and sometimes host / .host — clear all. */
function clearGoogTransCookies() {
  const host = location.hostname;
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  const paths = ["/", location.pathname];
  const domains = ["", host, `.${host}`];

  for (const path of paths) {
    document.cookie = `googtrans=; expires=${expires}; path=${path}`;
    for (const domain of domains) {
      if (!domain) continue;
      document.cookie = `googtrans=; expires=${expires}; path=${path}; domain=${domain}`;
    }
  }
}

function applyGoogleLanguage(code: string) {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;

  const target = code === "en" ? "" : code;
  const hasOption = Array.from(combo.options).some((o) => o.value === target);
  if (!hasOption && target !== "") return false;

  combo.value = target;
  combo.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

/**
 * English is the site’s source language. Google mutates the DOM in place,
 * so switching “back” via the combo alone often fails — clear cookie + reload.
 */
function resetToEnglish() {
  clearGoogTransCookies();
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (combo) {
    combo.value = "";
    combo.dispatchEvent(new Event("change", { bubbles: true }));
  }
  location.reload();
}

type LanguagePickerProps = {
  /** Mount the Google widget here (only one active instance) */
  mountWidget?: boolean;
  onPicked?: () => void;
  className?: string;
};

export default function LanguagePicker({
  mountWidget = true,
  onPicked,
  className = "",
}: LanguagePickerProps) {
  const [active, setActive] = useState("en");

  useEffect(() => {
    setActive(readGoogTransLang());
  }, []);

  function pick(code: string) {
    if (code === "en") {
      setActive("en");
      resetToEnglish();
      return;
    }

    const ok = applyGoogleLanguage(code);
    if (ok) {
      setActive(code);
      onPicked?.();
      return;
    }

    // Widget not ready yet — set cookie and reload (reliable fallback)
    document.cookie = `googtrans=/en/${code};path=/`;
    location.reload();
  }

  return (
    <div className={`umx-lang-picker ${className}`}>
      {mountWidget ? (
        <div className="umx-lang-picker__widget" aria-hidden>
          <GoogleTranslate />
        </div>
      ) : null}

      <p className="mb-2.5 font-display text-[11px] font-semibold tracking-[0.14em] text-black/40 uppercase">
        Choose language
      </p>

      <ul className="umx-lang-picker__list" role="listbox" aria-label="Languages">
        {SITE_LANGUAGES.map((lang) => {
          const selected = active === lang.code;
          return (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => pick(lang.code)}
                className={`umx-lang-picker__item ${selected ? "is-active" : ""}`}
              >
                <span className="umx-lang-picker__native">{lang.native}</span>
                <span className="umx-lang-picker__label">{lang.label}</span>
                {selected ? (
                  <span className="umx-lang-picker__check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function languageNativeLabel(code: string) {
  return SITE_LANGUAGES.find((l) => l.code === code)?.native ?? "English";
}
