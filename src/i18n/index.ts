import ru from "./dictionaries/ru";
import ky from "./dictionaries/ky";
import type { Locale } from "./config";
import type { Dictionary } from "./types";

export const dictionaries: Record<Locale, Dictionary> = { ru, ky };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export * from "./config";
export * from "./types";
