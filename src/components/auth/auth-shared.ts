export type AuthMethod = "email" | "phone";

export const AUTH_FIELD_CLASS =
  "w-full rounded-xl border border-black/10 bg-[#f8f6f2] px-3.5 py-2.5 font-body text-[0.9375rem] text-black outline-none transition placeholder:text-black/35 focus:border-umx-orange focus:bg-white focus:ring-2 focus:ring-umx-orange/15";

/** Dial codes for register / login / forgot-password phone flows. */
export const COUNTRY_CODES = [
  // North America first
  { code: "1", label: "USA +1", id: "us" },
  { code: "1", label: "Canada +1", id: "ca" },
  // Europe
  { code: "44", label: "UK +44", id: "gb" },
  { code: "49", label: "Germany +49", id: "de" },
  { code: "33", label: "France +33", id: "fr" },
  { code: "39", label: "Italy +39", id: "it" },
  { code: "34", label: "Spain +34", id: "es" },
  { code: "31", label: "Netherlands +31", id: "nl" },
  { code: "32", label: "Belgium +32", id: "be" },
  { code: "41", label: "Switzerland +41", id: "ch" },
  { code: "43", label: "Austria +43", id: "at" },
  { code: "46", label: "Sweden +46", id: "se" },
  { code: "47", label: "Norway +47", id: "no" },
  { code: "45", label: "Denmark +45", id: "dk" },
  { code: "358", label: "Finland +358", id: "fi" },
  { code: "48", label: "Poland +48", id: "pl" },
  { code: "351", label: "Portugal +351", id: "pt" },
  { code: "353", label: "Ireland +353", id: "ie" },
  { code: "30", label: "Greece +30", id: "gr" },
  { code: "420", label: "Czechia +420", id: "cz" },
  { code: "36", label: "Hungary +36", id: "hu" },
  { code: "40", label: "Romania +40", id: "ro" },
  // South Asia / Bangladesh
  { code: "880", label: "Bangladesh +880", id: "bd" },
  { code: "91", label: "India +91", id: "in" },
  { code: "92", label: "Pakistan +92", id: "pk" },
  // Middle East
  { code: "971", label: "UAE +971", id: "ae" },
  { code: "966", label: "Saudi Arabia +966", id: "sa" },
  { code: "974", label: "Qatar +974", id: "qa" },
  { code: "965", label: "Kuwait +965", id: "kw" },
  { code: "973", label: "Bahrain +973", id: "bh" },
  { code: "968", label: "Oman +968", id: "om" },
  { code: "962", label: "Jordan +962", id: "jo" },
  { code: "961", label: "Lebanon +961", id: "lb" },
  { code: "964", label: "Iraq +964", id: "iq" },
  { code: "972", label: "Israel +972", id: "il" },
  { code: "20", label: "Egypt +20", id: "eg" },
  { code: "90", label: "Turkey +90", id: "tr" },
  // Asia-Pacific
  { code: "86", label: "China +86", id: "cn" },
  { code: "852", label: "Hong Kong +852", id: "hk" },
  { code: "886", label: "Taiwan +886", id: "tw" },
  { code: "81", label: "Japan +81", id: "jp" },
  { code: "82", label: "South Korea +82", id: "kr" },
  { code: "65", label: "Singapore +65", id: "sg" },
  { code: "60", label: "Malaysia +60", id: "my" },
  { code: "66", label: "Thailand +66", id: "th" },
  { code: "84", label: "Vietnam +84", id: "vn" },
  { code: "62", label: "Indonesia +62", id: "id" },
  { code: "63", label: "Philippines +63", id: "ph" },
  { code: "61", label: "Australia +61", id: "au" },
  { code: "64", label: "New Zealand +64", id: "nz" },
] as const;

export const SUBMIT_BTN_CLASS =
  "w-full rounded-xl bg-umx-orange py-3 font-display text-sm font-semibold tracking-wide text-white shadow-[0_10px_24px_rgba(255,91,4,0.26)] transition hover:bg-umx-orange-deep disabled:opacity-60";
