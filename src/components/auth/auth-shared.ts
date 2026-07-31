export type AuthMethod = "email" | "phone";

export const AUTH_FIELD_CLASS =
  "w-full rounded-2xl border border-umx-cream-deep bg-umx-cream-bright px-4 py-3.5 font-body text-[0.95rem] text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-black/45 focus:border-umx-orange/70 focus:bg-white focus:ring-4 focus:ring-umx-orange/12";

export const COUNTRY_CODES = [
  { code: "1", label: "US/CA +1" },
  { code: "44", label: "UK +44" },
  { code: "61", label: "AU +61" },
  { code: "65", label: "SG +65" },
  { code: "60", label: "MY +60" },
  { code: "66", label: "TH +66" },
  { code: "84", label: "VN +84" },
  { code: "62", label: "ID +62" },
  { code: "63", label: "PH +63" },
  { code: "81", label: "JP +81" },
  { code: "82", label: "KR +82" },
  { code: "852", label: "HK +852" },
  { code: "886", label: "TW +886" },
] as const;

export const SUBMIT_BTN_CLASS =
  "group relative w-full overflow-hidden rounded-full bg-umx-orange-ink py-4 font-display text-[0.8rem] font-bold tracking-[0.18em] text-white uppercase shadow-[0_18px_40px_rgba(61,22,5,0.28)] transition hover:bg-umx-orange hover:shadow-[0_22px_48px_rgba(255,91,4,0.35)] disabled:opacity-60";
