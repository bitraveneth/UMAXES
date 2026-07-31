import en from "./en";
import zh from "./zh";
import {
  type BuyerLocale,
  type BuyerMessages,
  getMessage,
} from "./types";

export type { BuyerLocale, BuyerMessages };
export {
  BUYER_LOCALE_KEY,
  BUYER_LOCALE_COOKIE,
  getMessage,
} from "./types";

export const buyerDictionaries: Record<BuyerLocale, BuyerMessages> = {
  en,
  zh,
};

export function isBuyerLocale(value: unknown): value is BuyerLocale {
  return value === "en" || value === "zh";
}

export function createBuyerTranslator(locale: BuyerLocale) {
  const dict = buyerDictionaries[locale] || en;
  return (
    path: string,
    values?: Record<string, string | number>,
  ) => getMessage(dict, path, values);
}
