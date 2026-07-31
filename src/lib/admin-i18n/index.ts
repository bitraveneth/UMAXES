import en from "./en";
import zh from "./zh";
import {
  type AdminLocale,
  type AdminMessages,
  getMessage,
} from "./types";

export type { AdminLocale, AdminMessages };
export {
  ADMIN_LOCALE_KEY,
  ADMIN_LOCALE_COOKIE,
  getMessage,
} from "./types";

export const adminDictionaries: Record<AdminLocale, AdminMessages> = {
  en,
  zh,
};

export function isAdminLocale(value: unknown): value is AdminLocale {
  return value === "en" || value === "zh";
}

export function createAdminTranslator(locale: AdminLocale) {
  const dict = adminDictionaries[locale] || en;
  return (
    path: string,
    values?: Record<string, string | number>,
  ) => getMessage(dict, path, values);
}
