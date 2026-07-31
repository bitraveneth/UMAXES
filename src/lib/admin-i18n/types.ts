export type AdminLocale = "en" | "zh";

export const ADMIN_LOCALE_KEY = "umaxes-admin-locale";
export const ADMIN_LOCALE_COOKIE = "umaxes_admin_locale";

export type AdminMessages = {
  [key: string]: string | AdminMessages;
};

export function getMessage(
  dict: AdminMessages,
  path: string,
  values?: Record<string, string | number>,
): string {
  const parts = path.split(".");
  let cur: string | AdminMessages | undefined = dict;
  for (const p of parts) {
    if (!cur || typeof cur === "string") {
      cur = undefined;
      break;
    }
    cur = cur[p];
  }
  let text = typeof cur === "string" ? cur : path;
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}
