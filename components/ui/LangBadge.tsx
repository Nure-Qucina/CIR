"use client";

import { useTranslations } from "next-intl";

/**
 * Badge "Disponibile in italiano" (tradotto nella lingua UI corrente) per i
 * contenuti (eventi/articoli) che mancano di traduzione e mostrano il
 * fallback IT — vedi §6 del brief i18n. La chrome resta nella lingua scelta.
 *
 * Client Component (non server-only): così è utilizzabile sia da pagine
 * server (eventi/[slug], news/[slug]) sia da componenti client come
 * EventCard/EventTimeline. Legge da NextIntlClientProvider, non richiede
 * `locale` esplicito.
 *
 * ⚙️ DISATTIVATO TEMPORANEAMENTE: il badge è nascosto per ora (richiesta
 * utente). I punti di utilizzo restano intatti — per riattivarlo basta
 * rimettere `SHOW_BADGE = true`.
 */
const SHOW_BADGE = false;

export function LangBadge({ className }: { className?: string }) {
  if (!SHOW_BADGE) return null;
  return <LangBadgeInner className={className} />;
}

function LangBadgeInner({ className }: { className?: string }) {
  const t = useTranslations("langBadge");
  return (
    <span
      className={`inline-flex items-center rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700 ${className ?? ""}`}
    >
      {t("disponibileIn")}
    </span>
  );
}
