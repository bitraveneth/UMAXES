/**
 * Storefront language (Google Website Translator).
 *
 * Rules:
 * - Default language is always English
 * - User picks a language themselves (no auto region detection)
 * - Choice is saved in localStorage
 * - Switching back to English clears Google’s googtrans cookie and reloads
 *   (needed especially on Safari, where the page can stay Chinese otherwise)
 */

export const SITE_LANG_PREFERENCE_KEY = "umaxes-site-lang";

export function readGoogTransLang(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  const code = (match?.[1] || "en").trim();
  if (!code || code === "en") return "en";
  return code;
}

/** User’s saved choice, or English by default. */
export function readPreferredSiteLang(): string {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(SITE_LANG_PREFERENCE_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch {
    /* private mode / blocked storage */
  }
  return "en";
}

export function writePreferredSiteLang(code: string) {
  try {
    window.localStorage.setItem(SITE_LANG_PREFERENCE_KEY, code);
  } catch {
    /* ignore */
  }
}

/** Remove googtrans cookies (Safari often keeps domain-scoped copies). */
export function clearGoogTransCookies() {
  if (typeof document === "undefined") return;

  const host = location.hostname;
  const parts = host.split(".");
  const root =
    parts.length >= 2 ? `.${parts.slice(-2).join(".")}` : `.${host}`;

  const paths = ["/", location.pathname];
  const domains = ["", host, `.${host}`, root];
  const expire = "Thu, 01 Jan 1970 00:00:00 GMT";

  for (const path of paths) {
    document.cookie = `googtrans=; expires=${expire}; Max-Age=0; path=${path}`;
    for (const domain of domains) {
      if (!domain) continue;
      document.cookie = `googtrans=; expires=${expire}; Max-Age=0; path=${path}; domain=${domain}`;
    }
  }
}

/** Remove Google Translate UI leftovers from the page. */
export function stripGoogleTranslateDom() {
  if (typeof document === "undefined") return;

  document
    .querySelectorAll(
      "iframe.goog-te-banner-frame, .goog-te-banner-frame, .goog-te-menu-frame, iframe.goog-te-menu-frame, #goog-gt-tt, .goog-tooltip, .goog-te-balloon-frame",
    )
    .forEach((el) => el.remove());

  document.body?.classList.remove("translated-ltr", "translated-rtl");
  document.documentElement.classList.remove("translated-ltr", "translated-rtl");
  document.documentElement.lang = "en";
  if (document.body) {
    document.body.style.top = "";
    document.body.style.position = "";
  }
  document.documentElement.style.top = "";
}

/**
 * Call on every page load.
 * If the user wants English (default), wipe Google translate state first
 * so Safari does not keep showing Chinese.
 */
export function applyPreferredLangOnLoad() {
  if (typeof window === "undefined") return;
  const preferred = readPreferredSiteLang();
  if (preferred === "en") {
    clearGoogTransCookies();
    stripGoogleTranslateDom();
  }

  // Clean the temporary ?_lang=en flag used for Safari reloads
  try {
    const url = new URL(location.href);
    if (url.searchParams.has("_lang")) {
      url.searchParams.delete("_lang");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  } catch {
    /* ignore */
  }
}

/**
 * User chose English again — clear Google state and reload the original page.
 * Safari needs a full navigation (not only combo change) or text stays Chinese.
 */
export function resetToEnglish() {
  writePreferredSiteLang("en");
  clearGoogTransCookies();
  stripGoogleTranslateDom();

  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (combo) {
    combo.value = "";
    try {
      combo.dispatchEvent(new Event("change", { bubbles: true }));
    } catch {
      /* ignore */
    }
  }

  // Bust Safari / Google cache of the translated DOM
  const url = new URL(location.href);
  url.hash = "";
  url.searchParams.delete("googtrans");
  url.searchParams.set("_lang", "en");
  location.replace(url.pathname + url.search);
}
