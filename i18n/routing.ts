import { defineRouting } from "next-intl/routing";

/**
 * Configurazione centrale delle lingue del sito CIR.
 * - `it` è la lingua sorgente e resta alla radice (localePrefix: "as-needed"):
 *   `/eventi`, `/news/[slug]` ecc. restano invariati (§3 del brief i18n).
 * - `en`/`ar`/`bn` hanno prefisso esplicito (`/en/...`, `/ar/...`, `/bn/...`).
 */
export const routing = defineRouting({
  locales: ["it", "en", "ar", "bn"],
  defaultLocale: "it",
  localePrefix: "as-needed",
  // Gli hreflang li dichiariamo a mano via `generateMetadata` (§9 brief
  // i18n): per eventi/articoli non tutte le lingue hanno una traduzione
  // reale, e l'header Link automatico di next-intl non lo sa distinguere
  // (dichiarerebbe sempre tutte le locales come "tradotte").
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];

/** `true` per le lingue right-to-left (solo l'arabo, per ora). */
export function isRtl(locale: string): boolean {
  return locale === "ar";
}
