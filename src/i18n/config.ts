export const locales = ["ru", "ky"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const localeCookie = "esm_locale";
export const attributionCookie = "esm_attr";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export const localeLabels: Record<Locale, { short: string; long: string }> = {
  ru: { short: "Рус", long: "Русский" },
  ky: { short: "Кыр", long: "Кыргызча" },
};

/** hreflang + og locale codes */
export const localeMeta: Record<Locale, { htmlLang: string; ogLocale: string }> = {
  ru: { htmlLang: "ru", ogLocale: "ru_KG" },
  ky: { htmlLang: "ky", ogLocale: "ky_KG" },
};
