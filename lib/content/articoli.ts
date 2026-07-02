import "server-only";
import { cache } from "react";
import { reader } from "./reader";
import type { Articolo, TipoArticolo } from "./types";
import { readingTime } from "@/lib/utils/readingTime";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Campi neutri (categoria, tags, autore, date, copertina, tipo, inEvidenza)
 * sono uguali per tutte le lingue. I campi localizzati (titolo, estratto,
 * corpo, SEO) vivono in italiano nei campi principali — invariati — e nelle
 * altre lingue in `traduzioni.<locale>` (opzionali, fallback IT altrimenti).
 */
function toArticolo(
  slug: string,
  entry: Record<string, unknown>,
  locale: Locale,
): Articolo {
  const seo = (entry.seo ?? {}) as Record<string, unknown>;
  const traduzioni = (entry.traduzioni ?? {}) as Record<
    string,
    Record<string, unknown> | undefined
  >;
  const t = locale === routing.defaultLocale ? undefined : traduzioni[locale];
  const tradotto = Boolean((t?.titolo as string | undefined)?.trim());

  return {
    slug,
    titolo: tradotto ? String(t!.titolo) : String(entry.titolo ?? ""),
    estratto:
      tradotto && (t?.estratto as string)?.trim()
        ? String(t!.estratto)
        : String(entry.estratto ?? ""),
    categoria: String(entry.categoria ?? ""),
    tags: Array.isArray(entry.tags) ? (entry.tags as string[]) : [],
    autore: String(entry.autore ?? "Redazione CIR"),
    dataPubblicazione: String(entry.dataPubblicazione ?? ""),
    dataModifica: (entry.dataModifica as string | null) ?? null,
    copertina: (entry.copertina as string | null) ?? undefined,
    tempoLettura: (entry.tempoLettura as number | null) ?? undefined,
    inEvidenza: Boolean(entry.inEvidenza),
    tipo: (entry.tipo as TipoArticolo) ?? "articolo",
    seo: {
      title:
        tradotto && (t?.seoTitle as string)?.trim()
          ? String(t!.seoTitle)
          : (seo.title as string) || undefined,
      description:
        tradotto && (t?.seoDescription as string)?.trim()
          ? String(t!.seoDescription)
          : (seo.description as string) || undefined,
      ogImage: (seo.ogImage as string) || undefined,
    },
    isFallback: !tradotto,
    originalLocale: tradotto ? locale : routing.defaultLocale,
  };
}

type Filtri = {
  categoria?: string;
  tipo?: TipoArticolo;
  inEvidenza?: boolean;
  locale?: Locale;
};

/** Articoli filtrabili, ordinati per data di pubblicazione (più recenti prima). */
export const getArticoli = cache(
  async (filtri: Filtri = {}): Promise<Articolo[]> => {
    const locale = filtri.locale ?? routing.defaultLocale;
    const entries = await reader.collections.articoli.all();
    let articoli = entries.map((e) =>
      toArticolo(e.slug, e.entry as Record<string, unknown>, locale),
    );

    if (filtri.categoria)
      articoli = articoli.filter((a) => a.categoria === filtri.categoria);
    if (filtri.tipo) articoli = articoli.filter((a) => a.tipo === filtri.tipo);
    if (filtri.inEvidenza !== undefined)
      articoli = articoli.filter((a) => a.inEvidenza === filtri.inEvidenza);

    return articoli.sort(
      (a, b) =>
        new Date(b.dataPubblicazione).getTime() -
        new Date(a.dataPubblicazione).getTime(),
    );
  },
);

/** Articolo singolo con corpo MDX risolto (stringa) + tempoLettura calcolato. */
export const getArticoloBySlug = cache(
  async (
    slug: string,
    locale: Locale = routing.defaultLocale,
  ): Promise<Articolo | null> => {
    const entry = await reader.collections.articoli.read(slug);
    if (!entry) return null;
    const base = toArticolo(
      slug,
      entry as unknown as Record<string, unknown>,
      locale,
    );

    // Risolvi il corpo MDX: `corpo` (IT, contentField) è una funzione async
    // che ritorna la sorgente; `traduzioni.<locale>.corpo` (mdx.inline) è già
    // una stringa diretta. Se la traduzione manca, resta il corpo IT.
    async function resolveCorpoIt(): Promise<string> {
      const raw = (entry as Record<string, unknown>).corpo;
      if (typeof raw === "function") {
        const resolved = await (raw as () => Promise<unknown>)();
        return typeof resolved === "string"
          ? resolved
          : ((resolved as { source?: string })?.source ?? "");
      }
      return typeof raw === "string" ? raw : "";
    }

    let corpo = "";
    if (locale !== routing.defaultLocale) {
      const traduzioni = (entry as Record<string, unknown>).traduzioni as
        | Record<string, Record<string, unknown> | undefined>
        | undefined;
      const corpoTradotto = traduzioni?.[locale]?.corpo;
      if (typeof corpoTradotto === "string" && corpoTradotto.trim()) {
        corpo = corpoTradotto;
      }
    }
    if (!corpo) corpo = await resolveCorpoIt();

    base.corpo = corpo;
    if (!base.tempoLettura && corpo) base.tempoLettura = readingTime(corpo);

    return base;
  },
);

/** Articoli correlati: stessa categoria, escluso quello corrente. */
export const getArticoliCorrelati = cache(
  async (
    slug: string,
    categoria: string,
    limit = 3,
    locale: Locale = routing.defaultLocale,
  ): Promise<Articolo[]> => {
    const articoli = await getArticoli({ categoria, locale });
    return articoli.filter((a) => a.slug !== slug).slice(0, limit);
  },
);

export const getArticoliSlugs = cache(async (): Promise<string[]> => {
  const entries = await reader.collections.articoli.all();
  return entries.map((e) => e.slug);
});

/** Lingue in cui l'articolo è realmente tradotto (IT sempre incluso) — per hreflang (§9 brief i18n). */
export const getArticoloAvailableLocales = cache(
  async (slug: string): Promise<Locale[]> => {
    const entry = await reader.collections.articoli.read(slug);
    if (!entry) return [routing.defaultLocale];
    const traduzioni = (entry.traduzioni ?? {}) as Record<
      string,
      Record<string, unknown> | undefined
    >;
    return routing.locales.filter(
      (loc) =>
        loc === routing.defaultLocale ||
        Boolean((traduzioni[loc]?.titolo as string | undefined)?.trim()),
    );
  },
);
