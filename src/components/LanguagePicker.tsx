"use client";

import { useEffect, useState } from "react";
import GoogleTranslate from "@/components/GoogleTranslate";
import {
  SITE_LANGUAGES,
  type SiteLanguageCode,
} from "@/lib/site-languages";
import {
  applyPreferredLangOnLoad,
  readPreferredSiteLang,
  resetToEnglish,
  writePreferredSiteLang,
} from "@/lib/google-translate-lang";

export { SITE_LANGUAGES, type SiteLanguageCode };

function applyGoogleLanguage(code: string) {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;

  const hasOption = Array.from(combo.options).some((o) => o.value === code);
  if (!hasOption) return false;

  combo.value = code;
  combo.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

type LanguagePickerProps = {
  mountWidget?: boolean;
  onPicked?: () => void;
  className?: string;
};

/**
 * Language list for the public site.
 * Default = English. User chooses any other language themselves.
 */
export default function LanguagePicker({
  mountWidget = true,
  onPicked,
  className = "",
}: LanguagePickerProps) {
  const [active, setActive] = useState("en");

  useEffect(() => {
    applyPreferredLangOnLoad();
    setActive(readPreferredSiteLang());

    // Safari back-forward cache can restore a Chinese page after English was chosen
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      if (readPreferredSiteLang() === "en") {
        applyPreferredLangOnLoad();
        setActive("en");
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  function pick(code: string) {
    // Always go back to original English page
    if (code === "en") {
      setActive("en");
      onPicked?.();
      resetToEnglish();
      return;
    }

    writePreferredSiteLang(code);
    setActive(code);

    const ok = applyGoogleLanguage(code);
    if (ok) {
      onPicked?.();
      return;
    }

    // Widget not ready (common on first open / Safari) — cookie + reload
    document.cookie = `googtrans=/en/${code};path=/`;
    onPicked?.();
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
