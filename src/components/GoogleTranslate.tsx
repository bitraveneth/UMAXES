"use client";

import { useEffect, useId, useRef } from "react";
import { GOOGLE_INCLUDED_LANGUAGES } from "@/lib/site-languages";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages?: string;
            layout?: number;
            autoDisplay?: boolean;
          },
          elementId: string,
        ) => void;
      };
    };
  }
}

type GoogleTranslateProps = {
  className?: string;
};

/**
 * Google Website Translator — driven by LanguagePicker (hidden combo).
 * Mount once per page via Header.
 */
export default function GoogleTranslate({ className = "" }: GoogleTranslateProps) {
  const reactId = useId().replace(/:/g, "");
  const elementId = `google_translate_element_${reactId}`;
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const init = () => {
      if (!window.google?.translate?.TranslateElement) return;
      const el = document.getElementById(elementId);
      if (!el || el.childElementCount > 0) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: GOOGLE_INCLUDED_LANGUAGES,
          autoDisplay: false,
        },
        elementId,
      );
    };

    window.googleTranslateElementInit = init;

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-umx-google-translate="1"]',
    );
    if (existing) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.dataset.umxGoogleTranslate = "1";
    document.body.appendChild(script);

    return () => {
      if (window.googleTranslateElementInit === init) {
        window.googleTranslateElementInit = undefined;
      }
    };
  }, [elementId]);

  return (
    <div
      className={`umx-google-translate notranslate ${className}`}
      translate="no"
    >
      <div id={elementId} />
    </div>
  );
}
